import { describe, test, expect } from 'bun:test';
import { apiRequest } from '../helpers/client';

describe('Health Check', () => {
  test('returns ok status', async () => {
    const response = await apiRequest('/health');
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  test('root redirects to docs', async () => {
    const response = await apiRequest('/');
    
    // Check for either redirect or direct response
    expect([200, 302]).toContain(response.status);
    
    // If it's a redirect, check the location header
    if (response.status === 302) {
      expect(response.headers.get('location')).toBe('/docs');
    }
    // If it's a 200, it might be the docs page itself
    else if (response.status === 200) {
      expect(response.headers.get('content-type')).toContain('text/html');
    }
  });

  test('Scalar docs UI is accessible', async () => {
    const response = await apiRequest('/docs');
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.data).toContain('Scalar');
  });
}); 