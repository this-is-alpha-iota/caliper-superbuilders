import { z } from 'zod';
import {
  digitalResourceSchema,
  assignableDigitalResourceSchema,
  assessmentSchema,
  assessmentItemSchema,
  documentSchema,
  pageSchema,
  webPageSchema,
  chapterSchema,
  frameSchema,
  mediaObjectSchema,
  audioObjectSchema,
  videoObjectSchema,
  imageObjectSchema,
  mediaLocationSchema,
} from './digital-resource';
import { linkSchema } from './link';
import { sharedLinkSchema } from './shared';
import { dateTimeQuestionSchema, openEndedQuestionSchema } from './question';

// Union of all digital resource types
export const digitalResourceUnionSchema = z.union([
  digitalResourceSchema,
  assignableDigitalResourceSchema,
  assessmentSchema,
  assessmentItemSchema,
  documentSchema,
  pageSchema,
  webPageSchema,
  chapterSchema,
  frameSchema,
  mediaObjectSchema,
  audioObjectSchema,
  videoObjectSchema,
  imageObjectSchema,
  mediaLocationSchema,
  linkSchema,
  sharedLinkSchema,
  dateTimeQuestionSchema,
  openEndedQuestionSchema,
]); 