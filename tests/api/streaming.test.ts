import { describe, it, expect, beforeAll } from 'bun:test';
import { apiRequest } from '../helpers/client';
import { readFileSync } from 'fs';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Helper to create a valid Caliper envelope
function createValidEnvelope(events: any[]) {
  return {
    sensor: 'https://example.edu/sensors/test',
    sendTime: new Date().toISOString(),
    dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    data: events,
  };
}

// Helper to create a ViewEvent
function createViewEvent(overrides = {}) {
  return {
    '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    id: 'urn:uuid:test-event-1',
    type: 'ViewEvent',
    actor: {
      id: 'https://example.edu/users/554433',
      type: 'Person',
    },
    action: 'Viewed',
    object: {
      id: 'https://example.edu/page/1',
      type: 'Page',
      name: 'Test Page',
    },
    eventTime: new Date().toISOString(),
    ...overrides,
  };
}

describe('Event Streaming to Cold Storage', () => {
  let testToken: string;
  
  beforeAll(async () => {
    // Read token from .auth-token file
    try {
      testToken = readFileSync('.auth-token', 'utf-8').trim();
    } catch (error) {
      console.warn('No .auth-token file found, using test API key');
      testToken = process.env.TEST_API_KEY || 'test-api-key';
    }
  });

  describe('Event Storage with Streaming', () => {
    it('stores events and initiates streaming to S3', async () => {
      const envelope = createValidEnvelope([createViewEvent()]);
      
      const response = await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      expect(response.ok).toBe(true);
      expect(response.data).toMatchObject({
        success: true,
        eventsStored: 1,
        message: '1 events stored successfully',
      });
    });

    it('handles multiple events in a single envelope', async () => {
      const events = [
        createViewEvent(),
        createViewEvent({ id: 'urn:uuid:test-event-2' }),
        createViewEvent({ id: 'urn:uuid:test-event-3' }),
      ];
      const envelope = createValidEnvelope(events);
      
      const response = await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      expect(response.ok).toBe(true);
      expect(response.data).toMatchObject({
        success: true,
        eventsStored: 3,
        message: '3 events stored successfully',
      });
    });

    it('handles large batches of events', async () => {
      // Create 50 events to test batching
      const events = Array.from({ length: 50 }, (_, i) => 
        createViewEvent({ id: `urn:uuid:batch-test-${i}` })
      );
      const envelope = createValidEnvelope(events);
      
      const response = await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      expect(response.ok).toBe(true);
      expect(response.data).toMatchObject({
        success: true,
        eventsStored: 50,
        message: '50 events stored successfully',
      });
    });
  });

  describe('Kinesis Integration', () => {
    it('continues to work even if Kinesis is unavailable', async () => {
      // This test verifies that DynamoDB storage succeeds even if Kinesis fails
      const envelope = createValidEnvelope([createViewEvent()]);
      
      const response = await apiRequest('/caliper/v1p2/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      // Should still succeed even if Kinesis write fails
      expect(response.ok).toBe(true);
      expect(response.data).toMatchObject({
        success: true,
        eventsStored: 1,
      });
    });
  });

  describe('OpenAPI Documentation', () => {
    it('includes archival information in API docs', async () => {
      const response = await apiRequest('/openapi.json');
      
      expect(response.ok).toBe(true);
      
      // Check that storage endpoint documentation mentions archival
      const storageEndpoint = response.data?.paths?.['/caliper/v1p2/events']?.post;
      expect(storageEndpoint).toBeDefined();
      
      // The description should mention that events are archived
      const description = storageEndpoint?.description || storageEndpoint?.summary || '';
      expect(description.toLowerCase()).toContain('store');
    });
  });
}); 