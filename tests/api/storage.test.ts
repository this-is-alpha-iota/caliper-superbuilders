import { describe, test, expect } from 'bun:test';
import { apiRequest, createEnvelope, createViewEvent } from '../helpers/client';

describe('Event Storage', () => {
  const endpoint = '/caliper/v1p2/events';

  test('rejects request without authentication', async () => {
    const envelope = createEnvelope();
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
      skipAuth: true,
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(response.error).toContain('Missing or invalid Authorization header');
  });

  test('rejects request with invalid API key', async () => {
    const envelope = createEnvelope();
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
      apiKey: 'invalid-key',
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(response.error).toContain('Invalid or inactive API key');
  });

  test('stores valid event with authentication', async () => {
    const envelope = createEnvelope();
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      success: true,
      eventsStored: 1,
      message: '1 events stored successfully',
    });
  });

  test('stores multiple events in single request', async () => {
    const events = [
      createViewEvent(),
      createViewEvent(),
      createViewEvent(),
    ];
    const envelope = createEnvelope(events);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.data).toMatchObject({
      success: true,
      eventsStored: 3,
      message: '3 events stored successfully',
    });
  });

  test('validates events before storing', async () => {
    const invalidEvent = {
      '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
      type: 'ViewEvent',
      // Missing required fields
    };
    const envelope = createEnvelope([invalidEvent]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(response.error || response.data?.valid === false).toBeTruthy();
  });

  test('accepts Bearer token format', async () => {
    const envelope = createEnvelope();
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
      headers: {
        'Authorization': 'Bearer test-key',
      },
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });
}); 