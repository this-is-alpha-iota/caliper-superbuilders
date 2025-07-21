import { describe, test, expect } from 'bun:test';
import { apiRequest, createEnvelope, createViewEvent } from '../helpers/client';

describe('Event Validation', () => {
  const endpoint = '/caliper/v1p2/events/validate';

  test('validates correct ViewEvent', async () => {
    const envelope = createEnvelope();
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      valid: true,
      eventCount: 1,
    });
  });

  test('rejects invalid event with helpful errors', async () => {
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
    expect(response.data).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: expect.any(Array),
          message: expect.any(String),
        }),
      ]),
    });
  });

  test('rejects envelope with missing sendTime', async () => {
    const envelope = createEnvelope();
    delete (envelope as any).sendTime;
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(response.data?.errors).toBeDefined();
    const sendTimeError = response.data?.errors.find((e: any) => 
      e.path.includes('sendTime')
    );
    expect(sendTimeError).toBeDefined();
    expect(sendTimeError?.message.toLowerCase()).toMatch(/required|expected|invalid/i);
  });

  test('rejects event with invalid actor type', async () => {
    const event = createViewEvent({
      actor: {
        id: 'https://example.edu/users/123',
        type: 'InvalidType',
      },
    });
    const envelope = createEnvelope([event]);
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(envelope),
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(response.data?.errors).toBeDefined();
    expect(response.data?.errors.some((e: any) => 
      e.path.some((p: any) => p === 'actor' || p === 0)
    )).toBe(true);
  });

  test('validates envelope with multiple events', async () => {
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
      valid: true,
      eventCount: 3,
    });
  });

  test('rejects invalid JSON', async () => {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: 'invalid json',
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    // Either a plain error message or an errors array
    const errorMessage = response.error || response.data?.error || response.data?.errors?.[0]?.message;
    expect(errorMessage).toBeDefined();
    expect(errorMessage).toContain('JSON');
  });
}); 