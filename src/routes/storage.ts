import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { envelopeSchema } from '../caliper/schemas/base';
import { authMiddleware, type SensorData } from '../lib/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

export const storageApp = new OpenAPIHono();

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Apply authentication middleware
storageApp.use('/caliper/v1p2/events', authMiddleware);

// Response schema
const storeResponseSchema = z.object({
  success: z.boolean(),
  eventsStored: z.number(),
  message: z.string().optional(),
});

// Helper to generate partition key
function generatePartitionKey(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const hourBucket = Math.floor(date.getHours() / 6);
  const randomId = randomUUID().split('-')[0];
  return `EVENT#${dateStr}#${hourBucket}#${randomId}`;
}

// Create the storage route
const storageRoute = createRoute({
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
            details: z.any().optional(),
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

// Register the route
storageApp.openapi(storageRoute, async (c: any) => {
  try {
    const body = await c.req.json();
    const sensor = c.get('sensor') as SensorData;
    
    const result = envelopeSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        error: 'Invalid Caliper envelope',
        details: result.error.issues,
      }, 400);
    }

    const envelope = result.data;
    const timestamp = Date.now();
    const ttl = Math.floor(timestamp / 1000) + (90 * 24 * 60 * 60);
    
    const items = envelope.data.map((event, index) => {
      const pk = generatePartitionKey();
      const sk = `SENSOR#${sensor.sensorId}`;
      
      return {
        PutRequest: {
          Item: {
            pk,
            sk,
            eventTime: new Date(event.eventTime).getTime(),
            ttl,
            sensor: sensor.sensorId,
            envelope: {
              sensor: envelope.sensor,
              sendTime: envelope.sendTime,
              dataVersion: envelope.dataVersion,
            },
            event,
            storedAt: new Date().toISOString(),
            index,
          },
        },
      };
    });

    const chunks = [];
    for (let i = 0; i < items.length; i += 25) {
      chunks.push(items.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [process.env.EVENTS_TABLE!]: chunk,
        },
      }));
    }

    return c.json({
      success: true,
      eventsStored: envelope.data.length,
      message: `${envelope.data.length} events stored successfully`,
    } as const, 200);
    
  } catch (error) {
    console.error('Storage error:', error);
    return c.json({
      error: 'Failed to store events',
    } as const, 500);
  }
}); 