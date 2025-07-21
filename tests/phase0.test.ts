import { describe, test, expect } from 'bun:test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Phase 0: Infrastructure & Documentation Shell', () => {
  test('health check returns ok', async () => {
    const res = await fetch(`${API_URL}/health`);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  test('OpenAPI spec is accessible', async () => {
    const res = await fetch(`${API_URL}/openapi.json`);
    expect(res.status).toBe(200);
    
    const spec = await res.json() as any;
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('Caliper Analytics API');
    expect(spec.info.version).toBe('1.2.0');
  });

  test('Scalar docs UI is accessible', async () => {
    const res = await fetch(`${API_URL}/docs`);
    expect(res.status).toBe(200);
    
    const html = await res.text();
    expect(html).toContain('scalar');
  });

  test('root redirects to docs', async () => {
    const res = await fetch(`${API_URL}/`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/docs');
  });
}); 