import type { Context, Next } from 'hono';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface SensorData {
  apiKey: string;
  sensorId: string;
  name?: string;
  createdAt: string;
  active: boolean;
}

// Cache for sensor data to reduce DynamoDB calls
const sensorCache = new Map<string, { data: SensorData; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function authMiddleware(c: Context, next: Next) {
  // Extract API key from Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Check cache first
    const cached = sensorCache.get(apiKey);
    if (cached && cached.expiry > Date.now()) {
      c.set('sensor', cached.data);
      return next();
    }

    // Look up sensor in DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: process.env.SENSORS_TABLE!,
      Key: { apiKey },
    }));

    if (!result.Item || !result.Item.active) {
      return c.json({ error: 'Invalid or inactive API key' }, 401);
    }

    const sensorData = result.Item as SensorData;
    
    // Cache the result
    sensorCache.set(apiKey, {
      data: sensorData,
      expiry: Date.now() + CACHE_TTL,
    });

    // Attach sensor data to context
    c.set('sensor', sensorData);
    
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}

// Optional: Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sensorCache.entries()) {
    if (value.expiry < now) {
      sensorCache.delete(key);
    }
  }
}, CACHE_TTL); 