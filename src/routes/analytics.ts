import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { authMiddleware, type SensorData } from '../lib/auth';

// Query parameters schema
const queryParamsSchema = z.object({
  actorId: z.string().optional(),
  objectId: z.string().optional(),
  eventType: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.string().regex(/^\d+$/).default('20').transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).default('0').transform(Number).optional(),
});

// Event response schema (simplified view of stored event)
const eventResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.object({
    id: z.string(),
    type: z.string(),
  }),
  action: z.string(),
  object: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string().optional(),
  }),
  eventTime: z.string(),
  storedAt: z.string(),
  sensor: z.string(),
});

// Collection response schema
const eventsCollectionSchema = z.object({
  events: z.array(eventResponseSchema),
});

// Create the analytics query route
export const queryEventsRoute = createRoute({
  method: 'get',
  path: '/analytics/events',
  tags: ['Analytics'],
  summary: 'Query Caliper events',
  description: 'Query stored Caliper events with filtering and pagination support',
  security: [{ bearerAuth: [] }],
  request: {
    query: queryParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: eventsCollectionSchema,
          example: {
            events: [{
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
              storedAt: '2018-11-15T10:15:05.000Z',
              sensor: 'sensor-123',
            }],
          },
        },
      },
      description: 'Collection of events (see headers for pagination info)',
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

// Get single event route
export const getEventRoute = createRoute({
  method: 'get',
  path: '/analytics/events/:id',
  tags: ['Analytics'],
  summary: 'Get a specific Caliper event',
  description: 'Retrieve a single Caliper event by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Event ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: eventResponseSchema,
        },
      },
      description: 'Event details',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'Event not found',
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

// Create the analytics sub-app
export const analyticsApp = new OpenAPIHono<{ Variables: { sensor: SensorData } }>();

// Apply auth middleware to all analytics routes
analyticsApp.use('/analytics/*', authMiddleware);

// Register the routes with handlers (imported separately to avoid circular dependencies)
import { queryEventsHandler, getEventHandler } from './handlers';

analyticsApp.openapi(queryEventsRoute, queryEventsHandler as any);
analyticsApp.openapi(getEventRoute, getEventHandler as any); 