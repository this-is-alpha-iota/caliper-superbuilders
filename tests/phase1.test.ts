import { describe, test, expect } from 'bun:test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Helper to create a valid ViewEvent
function createViewEvent() {
  return {
    '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    id: 'urn:uuid:fcd495d0-3740-4298-9bec-1154571dc211',
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
    eventTime: '2018-11-15T10:15:00.000Z',
  };
}

// Helper to create a valid envelope
function createValidEnvelope(events: any[] = [createViewEvent()]) {
  return {
    sensor: 'https://example.edu/sensors/1',
    sendTime: '2018-11-15T10:15:00.000Z',
    dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    data: events,
  };
}

describe('Phase 1: Event Validation Endpoint', () => {
  test('validates correct ViewEvent', async () => {
    const envelope = createValidEnvelope();
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toMatchObject({
      valid: true,
      eventCount: 1,
    });
  });

  test('rejects invalid event with helpful error', async () => {
    const envelope = { 
      sensor: 'test', 
      data: [{ invalid: true }] 
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(400);
    const error = await res.json() as any;
    expect(error.valid).toBe(false);
    expect(error.errors).toBeDefined();
    expect(error.errors.length).toBeGreaterThan(0);
  });

  test('rejects envelope with missing sendTime', async () => {
    const envelope = {
      sensor: 'https://example.edu/sensors/1',
      dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      data: [createViewEvent()],
    };
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(400);
    const error = await res.json() as any;
    expect(error.valid).toBe(false);
    expect(error.errors).toContainEqual(
      expect.objectContaining({
        path: ['sendTime'],
        message: expect.any(String),
      })
    );
  });

  test('rejects event with invalid actor type', async () => {
    const event = createViewEvent();
    (event.actor as any).type = 'InvalidType';
    const envelope = createValidEnvelope([event]);
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(400);
    const error = await res.json() as any;
    expect(error.valid).toBe(false);
    expect(error.errors).toBeDefined();
  });

  test('rejects event with missing required fields', async () => {
    const invalidEvent = {
      '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      type: 'ViewEvent',
      // Missing: id, actor, action, object, eventTime
    };
    const envelope = createValidEnvelope([invalidEvent as any]);
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(400);
    const error = await res.json() as any;
    expect(error.valid).toBe(false);
    expect(error.errors.length).toBeGreaterThan(1);
  });

  test('validates envelope with multiple events', async () => {
    const events = [
      createViewEvent(),
      {
        '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        type: 'NavigationEvent',
        actor: {
          id: 'https://example.edu/users/554433',
          type: 'Person',
        },
        action: 'NavigatedTo',
        object: {
          id: 'https://example.edu/page1',
          type: 'Page',
        },
        target: {
          id: 'https://example.edu/page2',
          type: 'Page',
        },
        eventTime: '2018-11-15T10:16:00.000Z',
      },
    ];
    
    const envelope = createValidEnvelope(events);
    
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toMatchObject({
      valid: true,
      eventCount: 2,
    });
  });

  test('rejects invalid JSON', async () => {
    const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });
    
    expect(res.status).toBe(400);
    // Hono returns text/plain for malformed JSON
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const error = await res.json() as any;
      expect(error.valid).toBe(false);
      expect(error.errors[0].message).toContain('Invalid JSON');
    } else {
      const text = await res.text();
      expect(text).toContain('Malformed JSON');
    }
  });

  test('validation endpoint appears in OpenAPI spec', async () => {
    const res = await fetch(`${API_URL}/openapi.json`);
    expect(res.status).toBe(200);
    
    const spec = await res.json() as any;
    expect(spec.paths['/caliper/v1p2/events/validate']).toBeDefined();
    expect(spec.paths['/caliper/v1p2/events/validate'].post).toBeDefined();
    expect(spec.paths['/caliper/v1p2/events/validate'].post.summary).toBe('Validate Caliper events');
  });
}); 