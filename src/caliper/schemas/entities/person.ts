import { z } from 'zod';
import { personSchema, organizationSchema } from '../base';

// Instructor entity
export const instructorSchema = personSchema.extend({
  type: z.literal('Instructor'),
});

// Learner entity
export const learnerSchema = personSchema.extend({
  type: z.literal('Learner'),
});

// SystemIdentifier entity
export const systemIdentifierSchema = z.object({
  type: z.literal('SystemIdentifier'),
  identifier: z.string(),
  identifierType: z.string(),
  source: organizationSchema.optional(),
}); 