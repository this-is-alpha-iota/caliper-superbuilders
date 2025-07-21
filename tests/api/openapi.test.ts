import { describe, test, expect } from 'bun:test';
import { apiRequest } from '../helpers/client';

describe('OpenAPI Documentation', () => {
  test('OpenAPI spec is accessible', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      openapi: '3.0.0',
      info: expect.objectContaining({
        title: 'Caliper Analytics API',
        version: expect.any(String),
      }),
    });
  });

  test('validation endpoint appears in OpenAPI spec', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    expect(response.data?.paths?.['/caliper/v1p2/events/validate']).toBeDefined();
    expect(response.data?.paths?.['/caliper/v1p2/events/validate']?.post).toMatchObject({
      summary: expect.stringContaining('Validate'),
      tags: ['Caliper Events'],
    });
  });

  test('storage endpoint appears in OpenAPI spec', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    expect(response.data?.paths?.['/caliper/v1p2/events']).toBeDefined();
    expect(response.data?.paths?.['/caliper/v1p2/events']?.post).toMatchObject({
      summary: expect.stringContaining('Store'),
      tags: ['Caliper Events'],
      security: [{ bearerAuth: [] }],
    });
  });

  test('security schemes are properly configured', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    // Check either in the merged spec or as defined in the schema components
    const hasSecurityScheme = 
      response.data?.components?.securitySchemes?.bearerAuth || 
      response.data?.paths?.['/caliper/v1p2/events']?.post?.security;
    expect(hasSecurityScheme).toBeTruthy();
  });

  test('CaliperEnvelope schema is defined', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    expect(response.data?.components?.schemas?.CaliperEnvelope).toBeDefined();
  });
}); 