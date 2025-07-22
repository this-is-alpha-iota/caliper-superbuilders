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

  test('webhook endpoints appear in OpenAPI spec', async () => {
    const response = await apiRequest('/openapi.json');
    
    expect(response.ok).toBe(true);
    
    // Check webhook paths exist
    expect(response.data?.paths?.['/webhooks']).toBeDefined();
    expect(response.data?.paths?.['/webhooks/:id']).toBeDefined();
    
    // Check all CRUD operations
    expect(response.data?.paths?.['/webhooks']?.post).toBeDefined();
    expect(response.data?.paths?.['/webhooks']?.get).toBeDefined();
    expect(response.data?.paths?.['/webhooks/:id']?.get).toBeDefined();
    expect(response.data?.paths?.['/webhooks/:id']?.put).toBeDefined();
    expect(response.data?.paths?.['/webhooks/:id']?.delete).toBeDefined();
    
    // Check post webhook has proper tags and security
    expect(response.data?.paths?.['/webhooks']?.post).toMatchObject({
      summary: expect.stringContaining('webhook'),
      tags: ['Webhooks'],
      security: [{ bearerAuth: [] }],
    });
  });
}); 