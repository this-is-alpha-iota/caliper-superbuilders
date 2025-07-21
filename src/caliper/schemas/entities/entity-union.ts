import { z } from 'zod';
// Import base entities
import { 
  entitySchema,
  agentSchema,
  personSchema,
  softwareApplicationSchema,
  organizationSchema,
  sessionSchema,
  ltiSessionSchema,
  membershipSchema,
} from '../base';

// Import all other entities
import { digitalResourceUnionSchema } from './digital-resource-union';
import {
  annotationSchema,
  bookmarkAnnotationSchema,
  highlightAnnotationSchema,
  sharedAnnotationSchema,
  tagAnnotationSchema,
} from './annotation';
import {
  attemptSchema,
  resultSchema,
  scoreSchema,
  responseSchema,
  multipleChoiceResponseSchema,
  multipleResponseResponseSchema,
  trueFalseResponseSchema,
  fillInBlankResponseSchema,
  selectTextResponseSchema,
} from './attempt';
import { collectionSchema, digitalResourceCollectionSchema } from './collection';
import { courseOfferingSchema, courseSectionSchema, groupSchema, courseProgramSchema, curriculumSchema } from './course';
import { ratingSchema, commentSchema } from './feedback';
import { forumSchema, threadSchema, messageSchema } from './forum';
import { learningObjectiveSchema, outcomeSchema } from './learning';
import { linkSchema } from './link';
import { sharedLinkSchema } from './shared';
import { instructorSchema, learnerSchema, systemIdentifierSchema } from './person';
import { querySchema, searchResponseSchema } from './search';
import { surveySchema, questionnaireSchema, questionnaireItemSchema, surveyInvitationSchema } from './survey';
import { scaleSchema } from './scale';
import { textPositionSelectorSchema } from './selector';
import { dateTimeQuestionSchema, openEndedQuestionSchema } from './question';
import { dateTimeResponseSchema, openEndedResponseSchema } from './attempt';

// Union of all entity types
export const entityUnionSchema = z.union([
  // Base entities
  entitySchema,
  agentSchema,
  personSchema,
  softwareApplicationSchema,
  organizationSchema,
  sessionSchema,
  ltiSessionSchema,
  membershipSchema,
  
  // Digital resources (already a union)
  digitalResourceUnionSchema,
  
  // Annotations
  annotationSchema,
  bookmarkAnnotationSchema,
  highlightAnnotationSchema,
  sharedAnnotationSchema,
  tagAnnotationSchema,
  
  // Attempts and responses
  attemptSchema,
  resultSchema,
  scoreSchema,
  responseSchema,
  multipleChoiceResponseSchema,
  multipleResponseResponseSchema,
  trueFalseResponseSchema,
  fillInBlankResponseSchema,
  selectTextResponseSchema,
  dateTimeResponseSchema,
  openEndedResponseSchema,
  
  // Collections
  collectionSchema,
  digitalResourceCollectionSchema,
  
  // Course entities
  courseOfferingSchema,
  courseSectionSchema,
  groupSchema,
  courseProgramSchema,
  curriculumSchema,
  
  // Feedback
  ratingSchema,
  commentSchema,
  
  // Forum
  forumSchema,
  threadSchema,
  messageSchema,
  
  // Learning
  learningObjectiveSchema,
  outcomeSchema,
  
  // Link
  linkSchema,
  sharedLinkSchema,
  
  // Person types
  instructorSchema,
  learnerSchema,
  systemIdentifierSchema,
  
  // Search
  querySchema,
  searchResponseSchema,
  
  // Survey
  surveySchema,
  questionnaireSchema,
  questionnaireItemSchema,
  surveyInvitationSchema,
  
  // Scale
  scaleSchema,
  
  // Selector
  textPositionSelectorSchema,
  
  // Questions
  dateTimeQuestionSchema,
  openEndedQuestionSchema,
]); 