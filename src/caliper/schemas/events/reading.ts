import { z } from 'zod';
import { eventSchema } from '../base';
import { frameSchema } from '../entities/digital-resource';
import { digitalResourceUnionSchema } from '../entities/digital-resource-union';

// ReadingEvent - currently reading, not just viewing
export const readingEventSchema = eventSchema.extend({
  type: z.literal('ReadingEvent'),
  action: z.enum(['NavigatedTo', 'Viewed', 'Searched']),
  object: digitalResourceUnionSchema,
  target: frameSchema.optional(),
}); 