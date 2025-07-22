import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { envelopeSchema } from '../caliper/schemas/base';
import { strictEnvelopeSchema } from '../caliper/schemas/envelope';
import { envelopeSchemaForOpenAPI } from '../caliper/schemas/openapi-schemas';

// Validation result schema
const validationResultSchema = z.object({
  valid: z.boolean(),
  eventCount: z.number().optional(),
  errors: z.array(z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
    code: z.string().optional(),
  })).optional(),
});

// Response schema for storage
const storeResponseSchema = z.object({
  success: z.boolean(),
  eventsStored: z.number(),
  message: z.string().optional(),
});

// Validation route
export const validationRoute = createRoute({
  method: 'post',
  path: '/caliper/v1p2/events/validate',
  tags: ['Caliper Events'],
  summary: 'Validate Caliper events',
  description: 'Validates Caliper events against the v1.2 specification without storing them',
  request: {
    body: {
      content: {
        'application/json': {
          schema: envelopeSchemaForOpenAPI,
          example: {
            sensor: 'https://example.edu/sensors/1',
            sendTime: '2018-11-15T10:15:00.000Z',
            dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            data: [{
              '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
              id: 'urn:uuid:fcd495d0-3740-4298-9bec-1154571dc211',
              type: 'ViewEvent',
              actor: {
                id: 'https://example.edu/users/554433',
                type: 'Person',
              },
              action: 'Viewed',
              object: {
                id: 'https://example.edu/terms/201801/courses/7/sections/1/pages/2',
                type: 'Page',
                name: 'Introduction to Physics',
              },
              eventTime: '2018-11-15T10:15:00.000Z',
            }],
          },
        },
      },
      description: 'Caliper envelope containing events to validate',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Validation successful',
      content: {
        'application/json': {
          schema: validationResultSchema,
        },
      },
    },
    400: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: validationResultSchema,
        },
      },
    },
  },
});

// Storage route
export const storageRoute = createRoute({
  method: 'post',
  path: '/caliper/v1p2/events',
  tags: ['Caliper Events'],
  summary: 'Store Caliper events',
  description: 'Stores Caliper events in DynamoDB. Requires sensor authentication.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: envelopeSchemaForOpenAPI,
          example: {
            sensor: 'https://example.edu/sensors/1',
            sendTime: '2018-11-15T10:15:00.000Z',
            dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
            data: [{
              '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
              id: 'urn:uuid:fcd495d0-3740-4298-9bec-1154571dc211',
              type: 'ViewEvent',
              actor: {
                id: 'https://example.edu/users/554433',
                type: 'Person',
              },
              action: 'Viewed',
              object: {
                id: 'https://example.edu/terms/201801/courses/7/sections/1/pages/2',
                type: 'Page',
                name: 'Introduction to Physics',
              },
              eventTime: '2018-11-15T10:15:00.000Z',
            }],
          },
        },
      },
      description: 'Caliper envelope containing events to store',
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Events stored successfully',
      content: {
        'application/json': {
          schema: storeResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            details: z.unknown().optional(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

// Health check route
export const healthRoute = createRoute({
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
}); 