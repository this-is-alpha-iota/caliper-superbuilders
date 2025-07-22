import { z } from 'zod';
import { agentSchema } from './base';
import { entitySchema, agentSchema as baseAgentSchema, dateTimeSchema } from './base';
import { threadSchema } from './entities/forum';

// OpenAPI-compatible version of organizationSchema without circular reference
export const organizationSchemaForOpenAPI = agentSchema.extend({
  type: z.literal('Organization'),
  // Removed circular reference for OpenAPI compatibility
  // In actual validation, use the full organizationSchema from base.ts
});

// OpenAPI-compatible version of messageSchema without circular reference
export const messageSchemaForOpenAPI = entitySchema.extend({
  type: z.literal('Message'),
  creators: z.array(baseAgentSchema).optional(),
  body: z.string().optional(),
  isPartOf: threadSchema.optional(),
  // Removed circular reference for OpenAPI compatibility
  attachments: z.array(entitySchema).optional(),
  datePublished: dateTimeSchema.optional(),
}); 