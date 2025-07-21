import type { Context, Next } from 'hono';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface SensorData {
  apiKey: string;
  sensorId: string;
  name: string;
  active: boolean;
}

// Auth middleware
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const apiKey = authHeader.substring(7);
  
  // Test mode - allow test API keys in development
  if (process.env.NODE_ENV !== 'production' && (apiKey.startsWith('test-') || apiKey.startsWith('sk_'))) {
    c.set('sensor', {
      apiKey,
      sensorId: 'test-sensor-001',
      name: 'Test Sensor',
      active: true,
    } as SensorData);
    return next();
  }
  
  try {
    // Look up the sensor by API key
    const result = await docClient.send(new GetCommand({
      TableName: process.env.SENSORS_TABLE!,
      Key: { apiKey },
    }));
    
    if (!result.Item || !result.Item.active) {
      return c.json({ error: 'Invalid or inactive API key' }, 401);
    }
    
    // Store sensor data in context for use in handlers
    c.set('sensor', result.Item as SensorData);
    return next();
  } catch (error: any) {
    // Handle table not found error gracefully in development
    if (error.name === 'ResourceNotFoundException' && process.env.NODE_ENV !== 'production') {
      // Silently handle missing tables in development
      return c.json({ error: 'Invalid or inactive API key' }, 401);
    }
    
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
} 