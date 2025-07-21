import { z } from 'zod';
import { eventSchema } from '../base';
import { surveySchema, questionnaireSchema, surveyInvitationSchema } from '../entities/survey';

// SurveyEvent - for survey activities
export const surveyEventSchema = eventSchema.extend({
  type: z.literal('SurveyEvent'),
  action: z.enum(['Started', 'Completed', 'OptedOut']),
  object: surveySchema,
});

// QuestionnaireEvent - for questionnaire activities
export const questionnaireEventSchema = eventSchema.extend({
  type: z.literal('QuestionnaireEvent'),
  action: z.enum(['Started', 'Completed']),
  object: questionnaireSchema,
});

// SurveyInvitationEvent - for survey invitations
export const surveyInvitationEventSchema = eventSchema.extend({
  type: z.literal('SurveyInvitationEvent'),
  action: z.enum(['Sent', 'Accepted', 'Declined']),
  object: surveyInvitationSchema,
}); 