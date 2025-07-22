import type { Context } from 'hono';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import type { SensorData } from '../lib/auth';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Generate a webhook secret
function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

// Create webhook handler
export async function createWebhookHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const body = await c.req.json();
    
    const webhookId = randomUUID();
    const now = new Date().toISOString();
    
    // Set default active status if not provided
    if (body.active === undefined) {
      body.active = true;
    }
    
    const webhook = {
      pk: `SENSOR#${sensor.sensorId}`,
      sk: `WEBHOOK#${webhookId}`,
      webhookId,
      sensorId: sensor.sensorId,
      name: body.name,
      targetUrl: body.targetUrl,
      description: body.description,
      filters: body.filters,
      active: body.active,
      headers: body.headers,
      secret: generateWebhookSecret(),
      createdAt: now,
      updatedAt: now,
    };
    
    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.WEBHOOKS_TABLE!,
      Item: webhook,
    }));
    
    // Return webhook without pk/sk
    const response = {
      id: webhookId,
      sensorId: sensor.sensorId,
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      description: webhook.description,
      filters: webhook.filters,
      active: webhook.active,
      headers: webhook.headers,
      secret: webhook.secret,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create webhook error:', error);
    return c.json({
      error: 'Failed to create webhook',
      details: error,
    }, 500);
  }
}

// List webhooks handler
export async function listWebhooksHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    
    // Query webhooks for this sensor
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.WEBHOOKS_TABLE!,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SENSOR#${sensor.sensorId}`,
        ':sk': 'WEBHOOK#',
      },
    }));
    
    const webhooks = (result.Items || []).map(item => ({
      id: item.webhookId,
      sensorId: item.sensorId,
      name: item.name,
      targetUrl: item.targetUrl,
      description: item.description,
      filters: item.filters,
      active: item.active,
      headers: item.headers,
      secret: item.secret,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    
    return c.json({
      webhooks,
      count: webhooks.length,
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    return c.json({
      error: 'Failed to list webhooks',
    }, 500);
  }
}

// Get webhook handler
export async function getWebhookHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const webhookId = c.req.param('id');
    
    // Get webhook from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: process.env.WEBHOOKS_TABLE!,
      Key: {
        pk: `SENSOR#${sensor.sensorId}`,
        sk: `WEBHOOK#${webhookId}`,
      },
    }));
    
    if (!result.Item) {
      return c.json({ error: 'Webhook not found' }, 404);
    }
    
    const webhook = {
      id: result.Item.webhookId,
      sensorId: result.Item.sensorId,
      name: result.Item.name,
      targetUrl: result.Item.targetUrl,
      description: result.Item.description,
      filters: result.Item.filters,
      active: result.Item.active,
      headers: result.Item.headers,
      secret: result.Item.secret,
      createdAt: result.Item.createdAt,
      updatedAt: result.Item.updatedAt,
    };
    
    return c.json(webhook);
  } catch (error) {
    console.error('Get webhook error:', error);
    return c.json({
      error: 'Failed to get webhook',
    }, 500);
  }
}

// Update webhook handler
export async function updateWebhookHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const webhookId = c.req.param('id');
    const body = await c.req.json();
      // Check if webhook exists first
      const existingResult = await docClient.send(new GetCommand({
        TableName: process.env.WEBHOOKS_TABLE!,
        Key: {
          pk: `SENSOR#${sensor.sensorId}`,
          sk: `WEBHOOK#${webhookId}`,
        },
      }));
      
      if (!existingResult.Item) {
        return c.json({ error: 'Webhook not found' }, 404);
      }
      
      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      
      if (body.name !== undefined) {
        updateExpressions.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = body.name;
      }
      
      if (body.targetUrl !== undefined) {
        updateExpressions.push('targetUrl = :targetUrl');
        expressionAttributeValues[':targetUrl'] = body.targetUrl;
      }
      
      if (body.description !== undefined) {
        updateExpressions.push('description = :description');
        expressionAttributeValues[':description'] = body.description;
      }
      
      if (body.filters !== undefined) {
        updateExpressions.push('filters = :filters');
        expressionAttributeValues[':filters'] = body.filters;
      }
      
      if (body.active !== undefined) {
        updateExpressions.push('active = :active');
        expressionAttributeValues[':active'] = body.active;
      }
      
      if (body.headers !== undefined) {
        updateExpressions.push('headers = :headers');
        expressionAttributeValues[':headers'] = body.headers;
      }
      
      // Always update the updatedAt timestamp
      updateExpressions.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      const updateExpression = 'SET ' + updateExpressions.join(', ');
      
      const result = await docClient.send(new UpdateCommand({
        TableName: process.env.WEBHOOKS_TABLE!,
        Key: {
          pk: `SENSOR#${sensor.sensorId}`,
          sk: `WEBHOOK#${webhookId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }));
      
      const webhook = {
        id: result.Attributes!.webhookId,
        sensorId: result.Attributes!.sensorId,
        name: result.Attributes!.name,
        targetUrl: result.Attributes!.targetUrl,
        description: result.Attributes!.description,
        filters: result.Attributes!.filters,
        active: result.Attributes!.active,
        headers: result.Attributes!.headers,
        secret: result.Attributes!.secret,
        createdAt: result.Attributes!.createdAt,
        updatedAt: result.Attributes!.updatedAt,
      };
      
      return c.json(webhook);
  } catch (error) {
    console.error('Update webhook error:', error);
    return c.json({
      error: 'Failed to update webhook',
      details: error,
    }, 500);
  }
}

// Delete webhook handler
export async function deleteWebhookHandler(c: Context) {
  try {
    const sensor = c.get('sensor') as SensorData;
    const webhookId = c.req.param('id');
      // Check if webhook exists first
      const existingResult = await docClient.send(new GetCommand({
        TableName: process.env.WEBHOOKS_TABLE!,
        Key: {
          pk: `SENSOR#${sensor.sensorId}`,
          sk: `WEBHOOK#${webhookId}`,
        },
      }));
      
      if (!existingResult.Item) {
        return c.json({ error: 'Webhook not found' }, 404);
      }
      
      // Delete webhook
      await docClient.send(new DeleteCommand({
        TableName: process.env.WEBHOOKS_TABLE!,
        Key: {
          pk: `SENSOR#${sensor.sensorId}`,
          sk: `WEBHOOK#${webhookId}`,
        },
      }));
    
    return c.body(null, 204);
  } catch (error) {
    console.error('Delete webhook error:', error);
    return c.json({
      error: 'Failed to delete webhook',
    }, 500);
  }
} 