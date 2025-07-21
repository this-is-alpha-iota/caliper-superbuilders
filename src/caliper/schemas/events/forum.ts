import { z } from 'zod';
import { eventSchema } from '../base';
import { forumSchema, threadSchema, messageSchema } from '../entities/forum';

// ForumEvent - for forum interactions
export const forumEventSchema = eventSchema.extend({
  type: z.literal('ForumEvent'),
  action: z.enum(['Subscribed', 'Unsubscribed']),
  object: forumSchema,
});

// ThreadEvent - for thread interactions
export const threadEventSchema = eventSchema.extend({
  type: z.literal('ThreadEvent'),
  action: z.enum(['MarkedAsRead', 'MarkedAsUnread']),
  object: threadSchema,
});

// MessageEvent - for message interactions
export const messageEventSchema = eventSchema.extend({
  type: z.literal('MessageEvent'),
  action: z.enum(['Posted', 'MarkedAsRead', 'MarkedAsUnread']),
  object: messageSchema,
}); 