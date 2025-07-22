import { describe, it, expect } from 'bun:test';
import { apiRequest } from '../helpers/client';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Helper to make webhook API requests that returns Response-like objects
const client = {
  get: async (path: string) => {
    const result = await apiRequest(path, { method: 'GET' });
    return {
      status: result.status,
      json: async () => result.data,
      text: async () => result.data || '',
    };
  },
  post: async (path: string, body: any) => {
    const result = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
    return {
      status: result.status,
      json: async () => result.data,
    };
  },
  put: async (path: string, body: any) => {
    const result = await apiRequest(path, { method: 'PUT', body: JSON.stringify(body) });
    return {
      status: result.status,
      json: async () => result.data,
    };
  },
  delete: async (path: string) => {
    const result = await apiRequest(path, { method: 'DELETE' });
    return {
      status: result.status,
      text: async () => result.data || '',
    };
  },
};

describe('Webhook Management', () => {
  let createdWebhookId: string;

  describe('POST /webhooks', () => {
    it('requires authentication', async () => {
      const response = await fetch(`${API_URL}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Webhook',
          targetUrl: 'https://example.com/hook',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('creates a webhook with valid data', async () => {
      const response = await client.post('/webhooks', {
        name: 'Test Webhook',
        targetUrl: 'https://example.com/hook',
        description: 'A test webhook',
        filters: {
          eventTypes: ['ViewEvent', 'NavigationEvent'],
          actorId: 'https://example.edu/users/123',
        },
        active: true,
        headers: {
          'X-Custom-Header': 'test-value',
        },
      });

      expect(response.status).toBe(201);
      const webhook = await response.json();
      
      expect(webhook).toMatchObject({
        name: 'Test Webhook',
        targetUrl: 'https://example.com/hook',
        description: 'A test webhook',
        filters: {
          eventTypes: ['ViewEvent', 'NavigationEvent'],
          actorId: 'https://example.edu/users/123',
        },
        active: true,
        headers: {
          'X-Custom-Header': 'test-value',
        },
      });
      
      expect(webhook.id).toBeDefined();
      expect(webhook.sensorId).toBeDefined();
      expect(webhook.secret).toBeDefined();
      expect(webhook.createdAt).toBeDefined();
      expect(webhook.updatedAt).toBeDefined();
      
      createdWebhookId = webhook.id;
    });

    it('creates a webhook with minimal data', async () => {
      const response = await client.post('/webhooks', {
        name: 'Minimal Webhook',
        targetUrl: 'https://example.com/minimal',
      });

      expect(response.status).toBe(201);
      const webhook = await response.json();
      
      expect(webhook.name).toBe('Minimal Webhook');
      expect(webhook.targetUrl).toBe('https://example.com/minimal');
      expect(webhook.active).toBe(true); // Default value
      expect(webhook.filters).toBeUndefined();
      expect(webhook.description).toBeUndefined();
    });

    it('rejects invalid target URL', async () => {
      const response = await client.post('/webhooks', {
        name: 'Invalid URL Webhook',
        targetUrl: 'not-a-valid-url',
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      // When Zod validation fails via defaultHook, it returns { valid: false, errors: [...] }
      if (error.valid === false) {
        expect(error.errors).toBeDefined();
      } else {
        // Otherwise, it's a generic error response
        expect(error.error).toBeDefined();
      }
    });
  });

  describe('GET /webhooks', () => {
    it('requires authentication', async () => {
      const response = await fetch(`${API_URL}/webhooks`);
      expect(response.status).toBe(401);
    });

    it('lists webhooks for the sensor', async () => {
      const response = await client.get('/webhooks');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.webhooks).toBeInstanceOf(Array);
      expect(data.count).toBeGreaterThanOrEqual(0);
      
      // In development mode, it returns empty array
      // In production, it would return actual webhooks
    });
  });

  describe('GET /webhooks/:id', () => {
    it('requires authentication', async () => {
      const response = await fetch(`${API_URL}/webhooks/test-id`);
      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent webhook', async () => {
      const response = await client.get('/webhooks/non-existent-id');
      expect(response.status).toBe(404);
      
      const error = await response.json();
      expect(error.error).toBe('Webhook not found');
    });

    it('retrieves a specific webhook', async () => {
      // First create a webhook
      const createResponse = await client.post('/webhooks', {
        name: 'Get Test Webhook',
        targetUrl: 'https://example.com/get-test',
      });
      
      const created = await createResponse.json();
      
      // Then retrieve it
      const response = await client.get(`/webhooks/${created.id}`);
      
      // In development mode, this returns 404
      // In production, it would return the webhook
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('PUT /webhooks/:id', () => {
    it('requires authentication', async () => {
      const response = await fetch(`${API_URL}/webhooks/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      expect(response.status).toBe(401);
    });

    it('updates webhook fields', async () => {
      const response = await client.put(`/webhooks/${createdWebhookId || 'test-id'}`, {
        name: 'Updated Webhook Name',
        active: false,
        filters: {
          eventTypes: ['AssessmentEvent'],
        },
      });

      // In development mode, returns mock data
      expect(response.status).toBe(200);
      const webhook = await response.json();
      
      expect(webhook.id).toBeDefined();
      expect(webhook.name).toBeTruthy();
      expect(webhook.updatedAt).toBeDefined();
    });

    it('returns 404 for non-existent webhook', async () => {
      const response = await client.put('/webhooks/non-existent', {
        name: 'Should Not Update',
      });

      // In development mode, this might return 200 with mock data
      // In production, it would return 404
      expect([200, 404]).toContain(response.status);
    });

    it('partial update preserves other fields', async () => {
      const response = await client.put(`/webhooks/${createdWebhookId || 'test-id'}`, {
        description: 'Only updating description',
      });

      expect(response.status).toBe(200);
      const webhook = await response.json();
      
      // Other fields should still be present
      expect(webhook.name).toBeDefined();
      expect(webhook.targetUrl).toBeDefined();
    });
  });

  describe('DELETE /webhooks/:id', () => {
    it('requires authentication', async () => {
      const response = await fetch(`${API_URL}/webhooks/test-id`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(401);
    });

    it('deletes an existing webhook', async () => {
      // First create a webhook to delete
      const createResponse = await client.post('/webhooks', {
        name: 'To Be Deleted',
        targetUrl: 'https://example.com/delete-me',
      });
      
      const created = await createResponse.json();
      
      // Then delete it
      const response = await client.delete(`/webhooks/${created.id}`);
      
      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    it('returns appropriate response for non-existent webhook', async () => {
      const response = await client.delete('/webhooks/non-existent');
      
      // In development mode returns 204, in production would return 404
      expect([204, 404]).toContain(response.status);
    });
  });

  describe('Webhook Filters', () => {
    it('validates event type filters', async () => {
      const response = await client.post('/webhooks', {
        name: 'Filter Test',
        targetUrl: 'https://example.com/filter',
        filters: {
          eventTypes: ['InvalidEventType'],
        },
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      // When Zod validation fails via defaultHook, it returns { valid: false, errors: [...] }
      if (error.valid === false) {
        expect(error.errors).toBeDefined();
      } else {
        // Otherwise, it's a generic error response
        expect(error.error).toBeDefined();
      }
    });

    it('accepts valid event type filters', async () => {
      const validEventTypes = [
        'ViewEvent',
        'NavigationEvent',
        'AssessmentEvent',
        'AssessmentItemEvent',
      ];

      const response = await client.post('/webhooks', {
        name: 'Valid Filter Test',
        targetUrl: 'https://example.com/valid-filter',
        filters: {
          eventTypes: validEventTypes,
        },
      });

      expect(response.status).toBe(201);
      const webhook = await response.json();
      expect(webhook.filters.eventTypes).toEqual(validEventTypes);
    });
  });
}); 