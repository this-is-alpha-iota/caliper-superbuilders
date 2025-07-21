import { describe, test, expect, beforeAll } from 'bun:test';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_API_KEY || 'test-key';

// Helper to create a valid ViewEvent
function createViewEvent() {
  return {
    '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: 'ViewEvent',
    actor: {
      id: 'https://example.edu/users/554433',
      type: 'Person',
    },
    action: 'Viewed',
    object: {
      id: 'https://example.edu/terms/201801/courses/7/sections/1/pages/2',
      type: 'Page',
      name: 'Introduction to Physics',
    },
    eventTime: new Date().toISOString(),
  };
}

// Helper to create a valid envelope
function createValidEnvelope(events: any[] = [createViewEvent()]) {
  return {
    sensor: 'https://example.edu/sensors/1',
    sendTime: new Date().toISOString(),
    dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    data: events,
  };
}

describe('Phase 2: Event Storage Endpoint', () => {
  test('rejects request without authentication', async () => {
    const envelope = createValidEnvelope();
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(401);
    const error = await res.json() as any;
    expect(error.error).toContain('Authorization');
  });

  test('rejects request with invalid API key', async () => {
    const envelope = createValidEnvelope();
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-key-12345',
      },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(401);
    const error = await res.json() as any;
    expect(error.error).toBeDefined();
  });

  test('stores valid event with authentication', async () => {
    
    const envelope = createValidEnvelope();
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toMatchObject({
      success: true,
      eventsStored: 1,
      message: expect.stringContaining('1 events stored'),
    });
  });

  test('stores multiple events in single request', async () => {
    
    const events = [
      createViewEvent(),
      createViewEvent(),
      createViewEvent(),
    ];
    const envelope = createValidEnvelope(events);
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toMatchObject({
      success: true,
      eventsStored: 3,
      message: expect.stringContaining('3 events stored'),
    });
  });

  test('validates events before storing', async () => {
    const invalidEvent = {
      '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      type: 'ViewEvent',
      // Missing required fields
    };
    const envelope = createValidEnvelope([invalidEvent as any]);
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(400);
    const error = await res.json() as any;
    expect(error.error || error.valid === false).toBeTruthy();
  });

  test('storage endpoint appears in OpenAPI spec', async () => {
    const res = await fetch(`${API_URL}/openapi.json`);
    expect(res.status).toBe(200);
    
    const spec = await res.json() as any;
    expect(spec.paths['/caliper/v1p2/events']).toBeDefined();
    expect(spec.paths['/caliper/v1p2/events'].post).toBeDefined();
    expect(spec.paths['/caliper/v1p2/events'].post.summary).toBe('Store Caliper events');
    expect(spec.paths['/caliper/v1p2/events'].post.security).toBeDefined();
  });

  test('accepts Bearer token format', async () => {
    const envelope = createValidEnvelope();
    
    // Test various authorization header formats
    const variations = [
      'Bearer ',  // Empty token
      'Basic dGVzdDp0ZXN0',  // Wrong auth type
      'BearerTOKEN',  // No space
      'bearer token',  // Lowercase
    ];
    
    for (const auth of variations) {
      const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': auth,
        },
        body: JSON.stringify(envelope),
      });
      
      expect(res.status).toBe(401);
    }
  });
}); 