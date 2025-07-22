import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface Webhook {
  webhookId: string;
  sensorId: string;
  targetUrl: string;
  filters?: {
    eventTypes?: string[];
    actorId?: string;
    objectType?: string;
  };
  active: boolean;
  headers?: Record<string, string>;
  secret: string;
}

interface CaliperEvent {
  id: string;
  type: string;
  actor: {
    id: string;
    type: string;
  };
  object: {
    id: string;
    type: string;
  };
  eventTime: string;
  [key: string]: any;
}

interface EventEnvelope {
  sensor: string;
  sendTime: string;
  dataVersion: string;
  data: CaliperEvent[];
}

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Check if an event matches webhook filters
function eventMatchesFilters(event: CaliperEvent, webhook: Webhook): boolean {
  if (!webhook.filters) {
    return true; // No filters means all events match
  }

  const { eventTypes, actorId, objectType } = webhook.filters;

  // Check event type filter
  if (eventTypes && eventTypes.length > 0) {
    if (!eventTypes.includes(event.type)) {
      return false;
    }
  }

  // Check actor ID filter
  if (actorId) {
    if (event.actor.id !== actorId) {
      return false;
    }
  }

  // Check object type filter
  if (objectType) {
    if (event.object.type !== objectType) {
      return false;
    }
  }

  return true;
}

// Send webhook with retries
async function sendWebhook(
  webhook: Webhook,
  payload: any,
  retries = 3
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhook.secret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Caliper-Signature': signature,
    'X-Caliper-Webhook-Id': webhook.webhookId,
    'X-Caliper-Delivery-Id': crypto.randomUUID(),
    'X-Caliper-Event-Type': payload.data[0]?.type || 'unknown',
    ...(webhook.headers || {}),
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(webhook.targetUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return { 
          success: false, 
          statusCode: response.status, 
          error: `Client error: ${response.status} ${response.statusText}` 
        };
      }

      // Retry on server errors (5xx)
      if (attempt === retries) {
        return { 
          success: false, 
          statusCode: response.status, 
          error: `Server error after ${retries} attempts: ${response.status} ${response.statusText}` 
        };
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

    } catch (error: any) {
      if (attempt === retries) {
        return { 
          success: false, 
          error: `Network error after ${retries} attempts: ${error.message}` 
        };
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, error: 'Unknown error' };
}

// Process webhooks for events
export async function processWebhooksForEvents(
  sensorId: string,
  envelope: EventEnvelope
): Promise<void> {
  console.log(`[Webhook Processor] Starting for sensor ${sensorId} with ${envelope.data.length} events`);
  console.log(`[Webhook Processor] Using table: ${process.env.WEBHOOKS_TABLE}`);
  
  try {
    // Query all active webhooks for this sensor
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.WEBHOOKS_TABLE!,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
      FilterExpression: 'active = :active',
      ExpressionAttributeValues: {
        ':pk': `SENSOR#${sensorId}`,
        ':sk': 'WEBHOOK#',
        ':active': true,
      },
    }));

    const webhooks = (result.Items || []) as Webhook[];
    
    console.log(`[Webhook Processor] Found ${webhooks.length} active webhooks`);
    
    if (webhooks.length === 0) {
      console.log(`[Webhook Processor] No active webhooks found, skipping processing`);
      return; // No webhooks to process
    }

    console.log(`[Webhook Processor] Processing ${envelope.data.length} events for ${webhooks.length} webhooks`);

    // For each event, check which webhooks match
    const deliveryPromises: Promise<void>[] = [];

    for (const event of envelope.data) {
      console.log(`[Webhook Processor] Checking event ${event.id} (type: ${event.type})`);
      
      for (const webhook of webhooks) {
        console.log(`[Webhook Processor] Checking webhook ${webhook.webhookId} with filters:`, webhook.filters);
        
        if (eventMatchesFilters(event, webhook)) {
          console.log(`[Webhook Processor] Event matches webhook ${webhook.webhookId}, sending...`);
          
          // Create a single-event envelope for this webhook
          const webhookPayload = {
            sensor: envelope.sensor,
            sendTime: new Date().toISOString(),
            dataVersion: envelope.dataVersion,
            data: [event],
          };

          // Send webhook asynchronously
          const deliveryPromise = sendWebhook(webhook, webhookPayload)
            .then(result => {
              if (result.success) {
                console.log(`Webhook ${webhook.webhookId} delivered successfully`);
              } else {
                console.error(`Webhook ${webhook.webhookId} delivery failed:`, result.error);
                // In production, you might want to store failed deliveries for retry
              }
            });

          deliveryPromises.push(deliveryPromise);
        }
      }
    }

    // Wait for all webhook deliveries to complete
    await Promise.all(deliveryPromises);

  } catch (error) {
    console.error('Error processing webhooks:', error);
    // Don't throw - webhook failures shouldn't affect event storage
  }
}

// Process webhooks for a single event (convenience function)
export async function processWebhookForEvent(
  sensorId: string,
  event: CaliperEvent
): Promise<void> {
  const envelope: EventEnvelope = {
    sensor: sensorId,
    sendTime: new Date().toISOString(),
    dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
    data: [event],
  };

  return processWebhooksForEvents(sensorId, envelope);
} 