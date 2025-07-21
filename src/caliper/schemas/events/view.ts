import { z } from 'zod';
import { eventSchema } from '../base';
import { digitalResourceUnionSchema } from '../entities/digital-resource-union';

// ViewEvent - when a user views a resource
export const viewEventSchema = eventSchema.extend({
  type: z.literal('ViewEvent'),
  action: z.enum(['Viewed']),
  object: digitalResourceUnionSchema,
}); 