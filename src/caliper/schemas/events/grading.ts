import { z } from 'zod';
import { eventSchema } from '../base';
import { attemptSchema, scoreSchema } from '../entities/attempt';

// GradeEvent - when a grade is assigned
export const gradeEventSchema = eventSchema.extend({
  type: z.literal('GradeEvent'),
  action: z.enum(['Graded']),
  object: attemptSchema,
  generated: scoreSchema.optional(),
}); 