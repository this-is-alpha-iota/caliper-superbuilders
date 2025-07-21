import { z } from 'zod';
import { eventSchema } from '../base';
import { attemptSchema, responseSchema, multipleChoiceResponseSchema, multipleResponseResponseSchema, trueFalseResponseSchema, fillInBlankResponseSchema, selectTextResponseSchema, dateTimeResponseSchema, openEndedResponseSchema } from '../entities/attempt';
import { assessmentSchema, assessmentItemSchema, assignableDigitalResourceSchema } from '../entities/digital-resource';
import { dateTimeQuestionSchema, openEndedQuestionSchema } from '../entities/question';

// Union of all assessment item types
const assessmentItemUnionSchema = z.union([
  assessmentItemSchema,
  dateTimeQuestionSchema,
  openEndedQuestionSchema,
]);

// Union of all response types
const responseUnionSchema = z.union([
  responseSchema,
  multipleChoiceResponseSchema,
  multipleResponseResponseSchema,
  trueFalseResponseSchema,
  fillInBlankResponseSchema,
  selectTextResponseSchema,
  dateTimeResponseSchema,
  openEndedResponseSchema,
]);

// AssessmentEvent - base for assessment-related events
export const assessmentEventSchema = eventSchema.extend({
  type: z.literal('AssessmentEvent'),
  action: z.enum(['Started', 'Paused', 'Resumed', 'Restarted', 'Reset', 'Submitted']),
  object: assessmentSchema,
  generated: attemptSchema.optional(),
});

// AssessmentItemEvent - for individual assessment items (including questions)
export const assessmentItemEventSchema = eventSchema.extend({
  type: z.literal('AssessmentItemEvent'),
  action: z.enum(['Started', 'Skipped', 'Completed', 'Reviewed']),
  object: assessmentItemUnionSchema,
  generated: z.union([attemptSchema, responseUnionSchema]).optional(),
}); 