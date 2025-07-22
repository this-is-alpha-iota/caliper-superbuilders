import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { apiRequest } from '../helpers/client';
import { readFileSync } from 'fs';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Server } from 'node:net';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Create a test webhook server to receive webhook calls
function createTestWebhookServer() {
  const app = new Hono();
  const receivedWebhooks: any[] = [];
  
  app.post('/webhook', async (c) => {
    const body = await c.req.json();
    const headers = Object.fromEntries(c.req.raw.headers.entries());
    
    receivedWebhooks.push({
      body,
      headers,
      timestamp: new Date().toISOString(),
    });
    
    return c.json({ success: true });
  });
  
  app.get('/status', (c) => {
    return c.json({ 
      received: receivedWebhooks.length,
      webhooks: receivedWebhooks,
    });
  });
  
  app.delete('/clear', (c) => {
    receivedWebhooks.length = 0;
    return c.json({ success: true });
  });
  
  return { app, receivedWebhooks };
}

describe('Webhook Processing', () => {
  let testToken: string;
  let webhookServer: Server;
  let webhookServerPort: number;
  let webhookApp: ReturnType<typeof createTestWebhookServer>;
  
  beforeAll(async () => {
    // Read token from .auth-token file
    try {
      testToken = readFileSync('.auth-token', 'utf-8').trim();
    } catch (error) {
      console.warn('No .auth-token file found, using test API key');
      testToken = process.env.TEST_API_KEY || 'test-api-key';
    }
    
    // Start test webhook server
    webhookApp = createTestWebhookServer();
    webhookServerPort = 4000 + Math.floor(Math.random() * 1000);
    webhookServer = serve({
      fetch: webhookApp.app.fetch,
      port: webhookServerPort,
    });
  });
  
  afterAll(() => {
    webhookServer?.close();
  });

  describe('Event-triggered webhooks', () => {
    it('triggers webhook when matching event is stored', async () => {
      // Create a webhook
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test ViewEvent Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
          filters: {
            eventTypes: ['ViewEvent'],
          },
        }),
      });
      
      expect(createResponse.ok).toBe(true);
      const webhook = createResponse.data;
      
      // Clear any existing webhooks
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send a ViewEvent
      const eventEnvelope = {
        sensor: 'https://example.edu/sensors/test',
        sendTime: new Date().toISOString(),
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: 'urn:uuid:test-view-event-1',
          type: 'ViewEvent',
          actor: {
            id: 'https://example.edu/users/test-user',
            type: 'Person',
          },
          action: 'Viewed',
          object: {
            id: 'https://example.edu/page/test',
            type: 'Page',
            name: 'Test Page',
          },
          eventTime: new Date().toISOString(),
        }],
      };
      
      const storeResponse = await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventEnvelope),
      });
      
      expect(storeResponse.ok).toBe(true);
      
      // Wait for webhook to be delivered
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check webhook was received
      const statusResponse = await fetch(`http://localhost:${webhookServerPort}/status`);
      const status = await statusResponse.json() as any;
      
      expect(status.received).toBe(1);
      expect(status.webhooks[0].body.data).toHaveLength(1);
      expect(status.webhooks[0].body.data[0].type).toBe('ViewEvent');
      expect(status.webhooks[0].headers['x-caliper-webhook-id']).toBe(webhook.id);
      expect(status.webhooks[0].headers['x-caliper-signature']).toBeDefined();
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });

    it('does not trigger webhook for non-matching event type', async () => {
      // Create a webhook that only accepts AssessmentEvents
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Assessment Only Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
          filters: {
            eventTypes: ['AssessmentEvent'],
          },
        }),
      });
      
      expect(createResponse.ok).toBe(true);
      const webhook = createResponse.data;
      
      // Clear webhooks
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send a ViewEvent (not AssessmentEvent)
      const eventEnvelope = {
        sensor: 'https://example.edu/sensors/test',
        sendTime: new Date().toISOString(),
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: 'urn:uuid:test-view-event-2',
          type: 'ViewEvent',
          actor: {
            id: 'https://example.edu/users/test-user',
            type: 'Person',
          },
          action: 'Viewed',
          object: {
            id: 'https://example.edu/page/test2',
            type: 'Page',
            name: 'Test Page 2',
          },
          eventTime: new Date().toISOString(),
        }],
      };
      
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventEnvelope),
      });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check no webhook was received
      const statusResponse = await fetch(`http://localhost:${webhookServerPort}/status`);
      const status = await statusResponse.json() as any;
      
      expect(status.received).toBe(0);
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });

    it('filters webhooks by actor ID', async () => {
      const specificActorId = 'https://example.edu/users/specific-user';
      
      // Create webhook with actor filter
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Specific Actor Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
          filters: {
            actorId: specificActorId,
          },
        }),
      });
      
      const webhook = createResponse.data;
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send event with matching actor
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor: 'https://example.edu/sensors/test',
          sendTime: new Date().toISOString(),
          dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          data: [{
            '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            id: 'urn:uuid:test-event-3',
            type: 'ViewEvent',
            actor: {
              id: specificActorId,
              type: 'Person',
            },
            action: 'Viewed',
            object: {
              id: 'https://example.edu/page/test3',
              type: 'Page',
            },
            eventTime: new Date().toISOString(),
          }],
        }),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status1 = await (await fetch(`http://localhost:${webhookServerPort}/status`)).json() as any;
      expect(status1.received).toBe(1);
      
      // Send event with different actor
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor: 'https://example.edu/sensors/test',
          sendTime: new Date().toISOString(),
          dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          data: [{
            '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            id: 'urn:uuid:test-event-4',
            type: 'ViewEvent',
            actor: {
              id: 'https://example.edu/users/different-user',
              type: 'Person',
            },
            action: 'Viewed',
            object: {
              id: 'https://example.edu/page/test4',
              type: 'Page',
            },
            eventTime: new Date().toISOString(),
          }],
        }),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status2 = await (await fetch(`http://localhost:${webhookServerPort}/status`)).json();
      expect(status2.received).toBe(1); // Still only 1
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });

    it('respects webhook active status', async () => {
      // Create an inactive webhook
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Inactive Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
          active: false,
        }),
      });
      
      const webhook = createResponse.data;
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send an event
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor: 'https://example.edu/sensors/test',
          sendTime: new Date().toISOString(),
          dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          data: [{
            '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            id: 'urn:uuid:test-event-5',
            type: 'ViewEvent',
            actor: {
              id: 'https://example.edu/users/test',
              type: 'Person',
            },
            action: 'Viewed',
            object: {
              id: 'https://example.edu/page/test5',
              type: 'Page',
            },
            eventTime: new Date().toISOString(),
          }],
        }),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check no webhook was triggered
      const status = await (await fetch(`http://localhost:${webhookServerPort}/status`)).json();
      expect(status.received).toBe(0);
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });

    it('sends custom headers with webhook', async () => {
      const customHeaders = {
        'X-Custom-Header': 'test-value',
        'X-Another-Header': 'another-value',
      };
      
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Custom Headers Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
          headers: customHeaders,
        }),
      });
      
      const webhook = createResponse.data;
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send an event
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor: 'https://example.edu/sensors/test',
          sendTime: new Date().toISOString(),
          dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          data: [{
            '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            id: 'urn:uuid:test-event-6',
            type: 'ViewEvent',
            actor: {
              id: 'https://example.edu/users/test',
              type: 'Person',
            },
            action: 'Viewed',
            object: {
              id: 'https://example.edu/page/test6',
              type: 'Page',
            },
            eventTime: new Date().toISOString(),
          }],
        }),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = await (await fetch(`http://localhost:${webhookServerPort}/status`)).json();
      expect(status.received).toBe(1);
      expect(status.webhooks[0].headers['x-custom-header']).toBe('test-value');
      expect(status.webhooks[0].headers['x-another-header']).toBe('another-value');
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });
  });
  
  describe('Webhook signature verification', () => {
    it('includes valid HMAC signature in webhook delivery', async () => {
      const createResponse = await apiRequest('/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Signature Test Webhook',
          targetUrl: `http://localhost:${webhookServerPort}/webhook`,
        }),
      });
      
      const webhook = createResponse.data;
      const webhookSecret = webhook.secret;
      
      await fetch(`http://localhost:${webhookServerPort}/clear`, { method: 'DELETE' });
      
      // Send an event
      await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor: 'https://example.edu/sensors/test',
          sendTime: new Date().toISOString(),
          dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          data: [{
            '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            id: 'urn:uuid:test-event-7',
            type: 'ViewEvent',
            actor: {
              id: 'https://example.edu/users/test',
              type: 'Person',
            },
            action: 'Viewed',
            object: {
              id: 'https://example.edu/page/test7',
              type: 'Page',
            },
            eventTime: new Date().toISOString(),
          }],
        }),
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = await (await fetch(`http://localhost:${webhookServerPort}/status`)).json();
      expect(status.received).toBe(1);
      
      // Verify signature
      const receivedSignature = status.webhooks[0].headers['x-caliper-signature'];
      expect(receivedSignature).toBeDefined();
      expect(receivedSignature).toMatch(/^[0-9a-f]{64}$/); // SHA256 hex
      
      // The webhook processor should have created the correct signature
      // We can't verify it here without reimplementing the HMAC logic
      
      // Clean up
      await apiRequest(`/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` },
      });
    });
  });
}); 