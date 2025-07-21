import { z } from 'zod';
import { eventSchema } from '../base';
import { assignableDigitalResourceSchema } from '../entities/digital-resource';
import { attemptSchema } from '../entities/attempt';

// AssignableEvent - for assignment lifecycle
export const assignableEventSchema = eventSchema.extend({
  type: z.literal('AssignableEvent'),
  action: z.enum(['Activated', 'Deactivated', 'Started', 'Completed', 'Submitted', 'Reviewed']),
  object: assignableDigitalResourceSchema,
  generated: attemptSchema.optional(),
}); 