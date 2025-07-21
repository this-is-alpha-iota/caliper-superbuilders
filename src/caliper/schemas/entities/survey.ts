import { z } from 'zod';
import { entitySchema, dateTimeSchema } from '../base';
import { assignableDigitalResourceSchema } from './digital-resource';

// Survey entity
export const surveySchema = assignableDigitalResourceSchema.extend({
  type: z.literal('Survey'),
  items: z.array(entitySchema).optional(),
});

// Questionnaire entity
export const questionnaireSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('Questionnaire'),
  items: z.array(entitySchema).optional(),
});

// QuestionnaireItem entity
export const questionnaireItemSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('QuestionnaireItem'),
  question: z.string().optional(),
  responseOptions: z.array(z.string()).optional(),
});

// SurveyInvitation entity  
export const surveyInvitationSchema = entitySchema.extend({
  type: z.literal('SurveyInvitation'),
  survey: surveySchema.optional(),
  rsvpDeadline: dateTimeSchema.optional(),
}); 