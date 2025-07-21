import type { Context } from 'hono';
import { envelopeSchema } from '../caliper/schemas/base';
import { strictEnvelopeSchema } from '../caliper/schemas/envelope';
import { type SensorData } from '../lib/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Helper to generate partition key
function generatePartitionKey(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const hourBucket = Math.floor(date.getHours() / 6);
  const randomId = randomUUID().split('-')[0];
  return `EVENT#${dateStr}#${hourBucket}#${randomId}`;
}

// Health check handler
export async function healthHandler(c: Context) {
  return c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  }, 200);
}

// Validation handler
export async function validationHandler(c: Context) {
  try {
    const body = await c.req.json();
    const result = strictEnvelopeSchema.safeParse(body);
    
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
      }, 400);
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
}

// Storage handler
export async function storageHandler(c: Context) {
  try {
    const body = await c.req.json();
    const sensor = c.get('sensor') as SensorData;
    
    const result = strictEnvelopeSchema.safeParse(body);
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
    });
    
  } catch (error) {
    console.error('Storage error:', error);
    return c.json({
      error: 'Failed to store events',
    }, 500);
  }
} 