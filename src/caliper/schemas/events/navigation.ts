import { z } from 'zod';
import { eventSchema } from '../base';
import { digitalResourceUnionSchema } from '../entities/digital-resource-union';

// NavigationEvent - when a user navigates from one resource to another
export const navigationEventSchema = eventSchema.extend({
  type: z.literal('NavigationEvent'),
  action: z.enum(['NavigatedTo']),
  object: digitalResourceUnionSchema,
  target: digitalResourceUnionSchema, // The resource navigated to
  referrer: digitalResourceUnionSchema.optional(), // The resource navigated from
}); 