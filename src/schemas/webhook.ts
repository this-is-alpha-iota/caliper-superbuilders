import { z } from 'zod';

// Event type enum - all 21 Caliper event types
export const eventTypeEnum = z.enum([
  'AnnotationEvent',
  'AssessmentEvent',
  'AssessmentItemEvent',
  'AssignableEvent',
  'FeedbackEvent',
  'ForumEvent',
  'ThreadEvent',
  'MessageEvent',
  'GradeEvent',
  'MediaEvent',
  'NavigationEvent',
  'ReadingEvent',
  'ResourceManagementEvent',
  'SearchEvent',
  'SessionEvent',
  'SurveyEvent',
  'QuestionnaireEvent',
  'SurveyInvitationEvent',
  'ToolUseEvent',
  'ViewEvent',
  'OutcomeEvent',
]);

// Webhook filter schema
export const webhookFilterSchema = z.object({
  eventTypes: z.array(eventTypeEnum).min(1).optional().describe('List of event types to filter (if empty, all events are sent)'),
  actorId: z.string().optional().describe('Filter events by specific actor ID'),
  objectType: z.string().optional().describe('Filter events by object type'),
});

// Create webhook request schema
export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100).describe('Name of the webhook'),
  targetUrl: z.string().url().describe('URL to send events to'),
  description: z.string().optional().describe('Description of the webhook'),
  filters: webhookFilterSchema.optional().describe('Event filters'),
  active: z.boolean().default(true).optional().describe('Whether the webhook is active'),
  headers: z.record(z.string(), z.string()).optional().describe('Custom headers to include in webhook requests'),
});

// Update webhook request schema
export const updateWebhookSchema = createWebhookSchema.partial();

// Webhook response schema
export const webhookResponseSchema = z.object({
  id: z.string().describe('Webhook ID'),
  sensorId: z.string().describe('Sensor ID that owns this webhook'),
  name: z.string().describe('Name of the webhook'),
  targetUrl: z.string().describe('URL to send events to'),
  description: z.string().optional().describe('Description of the webhook'),
  filters: webhookFilterSchema.optional().describe('Event filters'),
  active: z.boolean().describe('Whether the webhook is active'),
  headers: z.record(z.string(), z.string()).optional().describe('Custom headers'),
  secret: z.string().describe('Webhook secret for signature verification'),
  createdAt: z.string().datetime().describe('When the webhook was created'),
  updatedAt: z.string().datetime().describe('When the webhook was last updated'),
});

// List webhooks response
export const webhookListResponseSchema = z.object({
  webhooks: z.array(webhookResponseSchema),
  count: z.number(),
});

// Webhook not found error
export const webhookNotFoundSchema = z.object({
  error: z.literal('Webhook not found'),
});

// Error response schema
export const webhookErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
}); 