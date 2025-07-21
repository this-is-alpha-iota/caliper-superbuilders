import { z } from 'zod';
import { eventSchema } from '../base';
import { querySchema, searchResponseSchema } from '../entities/search';

// SearchEvent - for search interactions
export const searchEventSchema = eventSchema.extend({
  type: z.literal('SearchEvent'),
  action: z.enum(['Searched']),
  object: querySchema,
  target: searchResponseSchema.optional(),
}); 