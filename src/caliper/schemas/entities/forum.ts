import { z } from 'zod';
import { entitySchema, agentSchema, dateTimeSchema } from '../base';

// Forum entity
export const forumSchema = entitySchema.extend({
  type: z.literal('Forum'),
  isPartOf: entitySchema.optional(),
});

// Thread entity
export const threadSchema = entitySchema.extend({
  type: z.literal('Thread'),
  isPartOf: forumSchema.optional(),
});

// Message entity
export const messageSchema = entitySchema.extend({
  type: z.literal('Message'),
  creators: z.array(agentSchema).optional(),
  body: z.string().optional(),
  isPartOf: threadSchema.optional(),
  // replyTo: z.lazy(() => messageSchema).optional(), // TODO: Add back circular ref
  attachments: z.array(entitySchema).optional(),
  datePublished: dateTimeSchema.optional(),
}); 