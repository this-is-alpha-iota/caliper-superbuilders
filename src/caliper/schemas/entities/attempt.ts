import { z } from 'zod';
import { entitySchema, dateTimeSchema, durationSchema, agentSchema } from '../base';
import { assignableDigitalResourceSchema } from './digital-resource';

// Attempt entity
export const attemptSchema = entitySchema.extend({
  type: z.literal('Attempt'),
  assignee: agentSchema.optional(),
  assignable: assignableDigitalResourceSchema.optional(),
  count: z.number().optional(),
  startedAtTime: dateTimeSchema.optional(),
  endedAtTime: dateTimeSchema.optional(),
  duration: durationSchema.optional(),
});

// Result entity
export const resultSchema = entitySchema.extend({
  type: z.literal('Result'),
  attempt: attemptSchema.optional(),
  maxResultScore: z.number().optional(),
  resultScore: z.number().optional(),
  comment: z.string().optional(),
});

// Score entity
export const scoreSchema = entitySchema.extend({
  type: z.literal('Score'),
  attempt: attemptSchema.optional(),
  maxScore: z.number().optional(),
  scoreGiven: z.number().optional(),
  comment: z.string().optional(),
  scoredBy: agentSchema.optional(),
});

// Response entity
export const responseSchema = entitySchema.extend({
  type: z.literal('Response'),
  attempt: attemptSchema.optional(),
  startedAtTime: dateTimeSchema.optional(),
  endedAtTime: dateTimeSchema.optional(),
  duration: durationSchema.optional(),
});

// MultipleChoiceResponse
export const multipleChoiceResponseSchema = responseSchema.extend({
  type: z.literal('MultipleChoiceResponse'),
  value: z.string().optional(),
});

// MultipleResponseResponse
export const multipleResponseResponseSchema = responseSchema.extend({
  type: z.literal('MultipleResponseResponse'),
  values: z.array(z.string()).optional(),
});

// TrueFalseResponse
export const trueFalseResponseSchema = responseSchema.extend({
  type: z.literal('TrueFalseResponse'),
  value: z.string().optional(),
});

// FillInBlankResponse
export const fillInBlankResponseSchema = responseSchema.extend({
  type: z.literal('FillInBlankResponse'),
  values: z.array(z.string()).optional(),
});

// SelectTextResponse
export const selectTextResponseSchema = responseSchema.extend({
  type: z.literal('SelectTextResponse'),
  values: z.array(z.string()).optional(),
});

// DateTimeResponse entity
export const dateTimeResponseSchema = responseSchema.extend({
  type: z.literal('DateTimeResponse'),
  value: z.string().datetime().optional(),
});

// OpenEndedResponse entity
export const openEndedResponseSchema = responseSchema.extend({
  type: z.literal('OpenEndedResponse'),
  value: z.string().optional(),
}); 