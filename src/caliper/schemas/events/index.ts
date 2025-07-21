import { z } from 'zod';

// Import all event schemas
export * from './annotation';
export * from './assessment';
export * from './assignable';
export * from './feedback';
export * from './forum';
export * from './grading';
export * from './media';
export * from './navigation';
export * from './reading';
export * from './resource-management';
export * from './search';
export * from './session';
export * from './survey';
export * from './tool-use';
export * from './view';
export * from './outcome';

// Import schemas for union
import { annotationEventSchema } from './annotation';
import { assessmentEventSchema, assessmentItemEventSchema } from './assessment';
import { assignableEventSchema } from './assignable';
import { feedbackEventSchema } from './feedback';
import { forumEventSchema, threadEventSchema, messageEventSchema } from './forum';
import { gradeEventSchema } from './grading';
import { mediaEventSchema } from './media';
import { navigationEventSchema } from './navigation';
import { readingEventSchema } from './reading';
import { resourceManagementEventSchema } from './resource-management';
import { searchEventSchema } from './search';
import { sessionEventSchema } from './session';
import { surveyEventSchema, questionnaireEventSchema, surveyInvitationEventSchema } from './survey';
import { toolUseEventSchema } from './tool-use';
import { viewEventSchema } from './view';
import { outcomeEventSchema } from './outcome';

// Create discriminated union of all event types
export const caliperEventSchema = z.discriminatedUnion('type', [
  annotationEventSchema,
  assessmentEventSchema,
  assessmentItemEventSchema,
  assignableEventSchema,
  feedbackEventSchema,
  forumEventSchema,
  threadEventSchema,
  messageEventSchema,
  gradeEventSchema,
  mediaEventSchema,
  navigationEventSchema,
  readingEventSchema,
  resourceManagementEventSchema,
  searchEventSchema,
  sessionEventSchema,
  surveyEventSchema,
  questionnaireEventSchema,
  surveyInvitationEventSchema,
  toolUseEventSchema,
  viewEventSchema,
  outcomeEventSchema,
]); 