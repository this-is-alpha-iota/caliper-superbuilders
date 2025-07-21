import { z } from 'zod';
import { eventSchema } from '../base';
import { ratingSchema, commentSchema } from '../entities/feedback';
import { entitySchema } from '../base';

// FeedbackEvent - for feedback activities
export const feedbackEventSchema = eventSchema.extend({
  type: z.literal('FeedbackEvent'),
  action: z.enum(['Commented', 'Rated', 'Ranked']),
  object: entitySchema,
  generated: z.union([ratingSchema, commentSchema]).optional(),
}); 