import type { Context } from 'hono';
import { envelopeSchema } from '../caliper/schemas/base';
import { strictEnvelopeSchema } from '../caliper/schemas/envelope';
import { type SensorData } from '../lib/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { getPaginationParams, buildPaginationMeta, applyPaginationHeaders } from '../lib/pagination';
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize Kinesis client
const kinesisClient = new KinesisClient({});

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
    
    // Store in DynamoDB
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

    // Also send to Kinesis stream for archival
    if (process.env.EVENT_STREAM_NAME) {
      try {
        const kinesisRecords = items.map(item => ({
          Data: Buffer.from(JSON.stringify({
            envelope,
            storedAt: item.PutRequest.Item.storedAt,
          })),
          PartitionKey: sensor.sensorId,
        }));

        // Kinesis has a limit of 500 records per request
        for (let i = 0; i < kinesisRecords.length; i += 500) {
          const batch = kinesisRecords.slice(i, i + 500);
          await kinesisClient.send(new PutRecordsCommand({
            Records: batch,
            StreamName: process.env.EVENT_STREAM_NAME,
          }));
        }
      } catch (kinesisError) {
        // Log error but don't fail the request - DynamoDB write was successful
        console.error('Failed to write to Kinesis:', kinesisError);
      }
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

// Query events handler
export async function queryEventsHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const query = c.req.query();
    
    // Get pagination params
    const paginationParams = getPaginationParams(query);
    
    // Parse query parameters
    const {
      actorId,
      objectId,
      eventType,
      startTime,
      endTime,
    } = query;
    
    // Query DynamoDB
    // Use the BySensor GSI to query events for this sensor
    const queryParams: any = {
      TableName: process.env.EVENTS_TABLE,
      IndexName: 'BySensor',
      KeyConditionExpression: 'sk = :sk',
      ExpressionAttributeValues: {
        ':sk': `SENSOR#${sensor.sensorId}`,
      },
      ScanIndexForward: false, // Sort by eventTime descending
    };
    
    // Add time range filter if provided
    if (startTime || endTime) {
      let timeCondition = '';
      if (startTime) {
        timeCondition = 'eventTime >= :startTime';
        queryParams.ExpressionAttributeValues[':startTime'] = new Date(startTime).getTime();
      }
      if (endTime) {
        if (timeCondition) timeCondition += ' AND ';
        timeCondition += 'eventTime <= :endTime';
        queryParams.ExpressionAttributeValues[':endTime'] = new Date(endTime).getTime();
      }
      queryParams.KeyConditionExpression += ` AND ${timeCondition}`;
    }
    
    // Add filter expressions for other criteria
    const filterExpressions: string[] = [];
    
    if (eventType) {
      filterExpressions.push('event.#type = :eventType');
      queryParams.ExpressionAttributeNames = queryParams.ExpressionAttributeNames || {};
      queryParams.ExpressionAttributeNames['#type'] = 'type';
      queryParams.ExpressionAttributeValues[':eventType'] = eventType;
    }
    
    if (actorId) {
      filterExpressions.push('event.actor.id = :actorId');
      queryParams.ExpressionAttributeValues[':actorId'] = actorId;
    }
    
    if (objectId) {
      filterExpressions.push('event.#object.id = :objectId');
      queryParams.ExpressionAttributeNames = queryParams.ExpressionAttributeNames || {};
      queryParams.ExpressionAttributeNames['#object'] = 'object';
      queryParams.ExpressionAttributeValues[':objectId'] = objectId;
    }
    
    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }
    
    // For offset-based pagination with DynamoDB, we need to fetch all items up to offset + limit
    // This is not ideal for large offsets, but DynamoDB doesn't support native offset
    const allItems = [];
    let lastEvaluatedKey = undefined;
    const targetCount = paginationParams.offset + paginationParams.limit;
    
    // Keep querying until we have enough items or no more results
    while (allItems.length < targetCount) {
      const currentQuery: any = {
        ...queryParams,
        Limit: Math.min(100, targetCount - allItems.length),
        ExclusiveStartKey: lastEvaluatedKey,
      };
      
      const result = await docClient.send(new QueryCommand(currentQuery));
      
      if (result.Items) {
        allItems.push(...result.Items);
      }
      
      lastEvaluatedKey = result.LastEvaluatedKey;
      
      // If no more items, break
      if (!lastEvaluatedKey) {
        break;
      }
    }
    
    // Apply offset and limit
    const paginatedItems = allItems.slice(paginationParams.offset, paginationParams.offset + paginationParams.limit);
    
    // Map items to response format
    const events = paginatedItems.map(item => ({
      id: item.event.id,
      type: item.event.type,
      actor: item.event.actor,
      action: item.event.action,
      object: item.event.object,
      eventTime: item.event.eventTime,
      storedAt: item.storedAt,
      sensor: item.sensor,
    }));
    
    // Build pagination metadata
    const totalCount = allItems.length;
    const meta = buildPaginationMeta(paginationParams, totalCount);
    
    // Apply pagination headers
    applyPaginationHeaders(c, meta, '/analytics/events');
    
    return c.json({ events });
    
  } catch (error) {
    console.error('Query error:', error);
    return c.json({
      error: 'Failed to query events',
    }, 500);
  }
}

// Get single event handler
export async function getEventHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const eventId = c.req.param('id');
    
    // Query for the specific event
    // Since we need to find by event ID, we'll use a scan with filters
    // This is not optimal, but works for now. In a real system, you might:
    // 1. Store event ID as part of the key structure
    // 2. Maintain a separate GSI with event ID as the key
    // 3. Use a separate lookup table
    
    const scanParams = {
      TableName: process.env.EVENTS_TABLE!,
      FilterExpression: 'event.id = :eventId AND sk = :sk',
      ExpressionAttributeValues: {
        ':eventId': eventId,
        ':sk': `SENSOR#${sensor.sensorId}`,
      },
      Limit: 1,
    };
    
    let item = null;
    let lastEvaluatedKey = undefined;
    
    // Scan until we find the item
    while (!item) {
      const currentScan: any = {
        ...scanParams,
        ExclusiveStartKey: lastEvaluatedKey,
      };
      
      const result = await docClient.send(new ScanCommand(currentScan));
      
      if (result.Items && result.Items.length > 0) {
        item = result.Items[0];
        break;
      }
      
      lastEvaluatedKey = result.LastEvaluatedKey;
      
      // If no more items to scan, break
      if (!lastEvaluatedKey) {
        break;
      }
    }
    
    if (!item) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json({
      id: item.event.id,
      type: item.event.type,
      actor: item.event.actor,
      action: item.event.action,
      object: item.event.object,
      eventTime: item.event.eventTime,
      storedAt: item.storedAt,
      sensor: item.sensor,
    });
    
  } catch (error) {
    console.error('Get event error:', error);
    return c.json({
      error: 'Failed to retrieve event',
    }, 500);
  }
} 