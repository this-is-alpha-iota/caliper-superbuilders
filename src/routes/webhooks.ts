import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware, type SensorData } from '../lib/auth';
import { 
  createWebhookHandler, 
  listWebhooksHandler, 
  getWebhookHandler, 
  updateWebhookHandler, 
  deleteWebhookHandler 
} from './webhook-handlers';
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookResponseSchema,
  webhookListResponseSchema,
  webhookNotFoundSchema,
  webhookErrorSchema,
} from '../schemas/webhook';

// Create webhook route
export const createWebhookRoute = createRoute({
  method: 'post',
  path: '/webhooks',
  tags: ['Webhooks'],
  summary: 'Create a webhook',
  description: 'Create a new webhook to receive Caliper events',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createWebhookSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: webhookResponseSchema,
        },
      },
      description: 'Webhook created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: webhookErrorSchema,
        },
      },
      description: 'Invalid request',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Unauthorized',
    },
  },
});

// List webhooks route
export const listWebhooksRoute = createRoute({
  method: 'get',
  path: '/webhooks',
  tags: ['Webhooks'],
  summary: 'List webhooks',
  description: 'List all webhooks for the authenticated sensor',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: webhookListResponseSchema,
        },
      },
      description: 'List of webhooks',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Unauthorized',
    },
  },
});

// Get webhook route
export const getWebhookRoute = createRoute({
  method: 'get',
  path: '/webhooks/:id',
  tags: ['Webhooks'],
  summary: 'Get a webhook',
  description: 'Get details of a specific webhook',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Webhook ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: webhookResponseSchema,
        },
      },
      description: 'Webhook details',
    },
    404: {
      content: {
        'application/json': {
          schema: webhookNotFoundSchema,
        },
      },
      description: 'Webhook not found',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Unauthorized',
    },
  },
});

// Update webhook route
export const updateWebhookRoute = createRoute({
  method: 'put',
  path: '/webhooks/:id',
  tags: ['Webhooks'],
  summary: 'Update a webhook',
  description: 'Update an existing webhook',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Webhook ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateWebhookSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: webhookResponseSchema,
        },
      },
      description: 'Webhook updated successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: webhookNotFoundSchema,
        },
      },
      description: 'Webhook not found',
    },
    400: {
      content: {
        'application/json': {
          schema: webhookErrorSchema,
        },
      },
      description: 'Invalid request',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Unauthorized',
    },
  },
});

// Delete webhook route
export const deleteWebhookRoute = createRoute({
  method: 'delete',
  path: '/webhooks/:id',
  tags: ['Webhooks'],
  summary: 'Delete a webhook',
  description: 'Delete an existing webhook',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Webhook ID'),
    }),
  },
  responses: {
    204: {
      description: 'Webhook deleted successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: webhookNotFoundSchema,
        },
      },
      description: 'Webhook not found',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Unauthorized',
    },
  },
});

// Create the webhooks sub-app
export const webhooksApp = new OpenAPIHono<{ Variables: { sensor: SensorData } }>();

// Apply auth middleware to all webhook routes
webhooksApp.use('/webhooks/*', authMiddleware);

// Register routes with handlers
webhooksApp.openapi(createWebhookRoute, createWebhookHandler as any);
webhooksApp.openapi(listWebhooksRoute, listWebhooksHandler as any);
webhooksApp.openapi(getWebhookRoute, getWebhookHandler as any);
webhooksApp.openapi(updateWebhookRoute, updateWebhookHandler as any);
webhooksApp.openapi(deleteWebhookRoute, deleteWebhookHandler as any); 