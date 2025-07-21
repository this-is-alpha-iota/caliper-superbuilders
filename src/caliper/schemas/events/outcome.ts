import { z } from 'zod';
import { eventSchema } from '../base';
import { entitySchema } from '../base';
import { outcomeSchema } from '../entities/learning';

// OutcomeEvent - for recording achievement of learning outcomes
export const outcomeEventSchema = eventSchema.extend({
  type: z.literal('OutcomeEvent'),
  action: z.enum(['Graded', 'Achieved']),
  object: entitySchema, // The entity being evaluated
  generated: outcomeSchema.optional(), // The outcome result
}); 