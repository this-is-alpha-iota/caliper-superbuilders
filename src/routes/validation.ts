import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { envelopeSchema } from '../caliper/schemas/base';

export const validationApp = new OpenAPIHono();

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

// Create the validation route
const validationRoute = createRoute({
  method: 'post',
  path: '/caliper/v1p2/events/validate',
  tags: ['Caliper Events'],
  summary: 'Validate Caliper events',
  description: 'Validates Caliper events against the v1.2 specification without storing them',
  request: {
    body: {
      content: {
        'application/json': {
          schema: envelopeSchema,
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

// Register the route
validationApp.openapi(validationRoute, async (c) => {
  try {
    const body = await c.req.json();
    const result = envelopeSchema.safeParse(body);
    
    if (result.success) {
      return c.json({
        valid: true,
        eventCount: result.data.data.length,
      });
    } else {
      const errors = result.error.issues.map(issue => ({
        path: issue.path.filter((p): p is string | number => p !== null),
        message: issue.message,
        code: issue.code as string,
      }));
      
      return c.json({
        valid: false,
        errors,
      } as const, 400);
    }
  } catch (error) {
    return c.json({
      valid: false,
      errors: [{
        path: [],
        message: 'Invalid JSON in request body',
      }],
    }, 400);
  }
}); 