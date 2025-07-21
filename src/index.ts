import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { z } from 'zod';

// Create the OpenAPI Hono app
const app = new OpenAPIHono();

// Health check endpoint
app.openapi(
  {
    method: 'get',
    path: '/health',
    tags: ['System'],
    summary: 'Health check endpoint',
    description: 'Returns the health status of the API',
    responses: {
      200: {
        description: 'API is healthy',
        content: {
          'application/json': {
            schema: z.object({
              status: z.literal('ok'),
              timestamp: z.string().datetime(),
            }),
          },
        },
      },
    },
  },
  (c) => {
    return c.json({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    });
  }
);

// OpenAPI documentation endpoint
app.doc('/openapi.json', {
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

// Scalar UI for API documentation
app.get(
  '/docs',
  apiReference({
    url: '/openapi.json',
    theme: 'saturn',
  })
);

// Root redirect to docs
app.get('/', (c) => c.redirect('/docs'));

// Export handler for Lambda
export { app };

// Lambda handler - Hono's built-in Lambda support
import { handle } from 'hono/aws-lambda';
export const handler = handle(app); 