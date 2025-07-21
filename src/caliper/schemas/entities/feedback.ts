import { z } from 'zod';
import { entitySchema, agentSchema } from '../base';

// Rating entity
export const ratingSchema = entitySchema.extend({
  type: z.literal('Rating'),
  rater: agentSchema.optional(),
  rated: entitySchema.optional(),
  value: z.number().optional(),
  maxValue: z.number().optional(),
  minValue: z.number().optional(),
});

// Comment entity
export const commentSchema = entitySchema.extend({
  type: z.literal('Comment'),
  commenter: agentSchema.optional(),
  commentedOn: entitySchema.optional(),
  value: z.string().optional(),
}); 