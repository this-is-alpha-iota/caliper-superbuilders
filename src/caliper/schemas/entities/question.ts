import { z } from 'zod';
import { assignableDigitalResourceSchema } from './digital-resource';

// DateTimeQuestion entity
export const dateTimeQuestionSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('DateTimeQuestion'),
  questionPosed: z.string().optional(),
});

// OpenEndedQuestion entity
export const openEndedQuestionSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('OpenEndedQuestion'),
  questionPosed: z.string().optional(),
}); 