import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { authMiddleware } from './lib/auth';
import { healthRoute, validationRoute, storageRoute } from './routes/routes';
import { healthHandler, validationHandler, storageHandler } from './routes/handlers';

// Create the main OpenAPI Hono app with custom error handling
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      // Return our custom error format for validation errors
      const errors = result.error.issues.map((issue: any) => ({
        path: issue.path,
        message: issue.message,
        code: issue.code,
      }));
      
      return c.json({
        valid: false,
        errors,
      }, 400);
    }
  },
});

// Register security schemes
(app as any).openAPIRegistry.registerComponent('securitySchemes', {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    description: 'Sensor API key authentication',
  },
});

// Register routes
app.openapi(healthRoute, healthHandler as any);
app.openapi(validationRoute, validationHandler as any);

// Apply auth middleware for storage endpoint
app.use('/caliper/v1p2/events', authMiddleware);
app.openapi(storageRoute, storageHandler as any);

// Root redirect to docs
app.get('/', (c) => c.redirect('/docs'));

// Get the OpenAPI document with our components
app.doc('/openapi.json', (c) => ({
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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Sensor API key authentication',
      },
    },
  },
}));

// Scalar UI for interactive documentation
app.get(
  '/docs',
  apiReference({
    url: '/openapi.json',
    theme: 'saturn',
  })
);

// Export handler for Lambda
export { app };

// Lambda handler - Hono's built-in Lambda support
import { handle } from 'hono/aws-lambda';
export const handler = handle(app); 