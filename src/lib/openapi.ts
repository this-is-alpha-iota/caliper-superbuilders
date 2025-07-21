import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';

export function configureOpenAPI(app: OpenAPIHono) {
  // Configure OpenAPI security schemes
  (app as any).openAPIRegistry.registerComponent('securitySchemes', {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      description: 'Sensor API key authentication',
    },
  });

  // Custom endpoint to debug the OpenAPI document
  app.get('/openapi.json', (c) => {
    const spec = (app as any).getOpenAPIDocument({
      openapi: '3.0.0',
      info: {
        title: 'Caliper Analytics API',
        version: '1.2.0',
        description: 'A modern implementation of the IMS Caliper Analytics® specification v1.2',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3000',
          description: 'API Server',
        },
      ],
    });
    return c.json(spec);
  });

  // Add Scalar UI for interactive documentation
  app.get(
    '/docs',
    apiReference({
      url: '/openapi.json',
      theme: 'saturn',
    })
  );
} 