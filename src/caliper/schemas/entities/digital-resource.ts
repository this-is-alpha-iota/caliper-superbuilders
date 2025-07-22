import { z } from 'zod';
import { entitySchema, dateTimeSchema, iriSchema } from '../base';

// Base DigitalResource schema
export const digitalResourceSchema = entitySchema.extend({
  type: z.literal('DigitalResource'),
  mediaType: z.string().optional(),
  creators: z.array(entitySchema).optional(),
  keywords: z.array(z.string()).optional(),
  learningObjectives: z.array(entitySchema).optional(),
  isPartOf: entitySchema.optional(),
  datePublished: dateTimeSchema.optional(),
  version: z.string().optional(),
});

// AssignableDigitalResource
export const assignableDigitalResourceSchema = digitalResourceSchema.extend({
  type: z.literal('AssignableDigitalResource'),
  dateToActivate: dateTimeSchema.optional(),
  dateToShow: dateTimeSchema.optional(),
  dateToStartOn: dateTimeSchema.optional(),
  dateToSubmit: dateTimeSchema.optional(),
  maxAttempts: z.number().optional(),
  maxSubmits: z.number().optional(),
  maxScore: z.number().optional(),
});

// Assessment
export const assessmentSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('Assessment'),
  items: z.array(z.lazy(() => assessmentItemSchema)).optional(),
});

// AssessmentItem
export const assessmentItemSchema = assignableDigitalResourceSchema.extend({
  type: z.literal('AssessmentItem'),
  isTimeDependent: z.boolean().optional(),
});

// Document
export const documentSchema = digitalResourceSchema.extend({
  type: z.literal('Document'),
});

// Page
export const pageSchema = digitalResourceSchema.extend({
  type: z.literal('Page'),
});

// WebPage
export const webPageSchema = digitalResourceSchema.extend({
  type: z.literal('WebPage'),
});

// Chapter
export const chapterSchema = digitalResourceSchema.extend({
  type: z.literal('Chapter'),
});

// Frame
export const frameSchema = digitalResourceSchema.extend({
  type: z.literal('Frame'),
  index: z.number().optional(),
});

// MediaObject
export const mediaObjectSchema = digitalResourceSchema.extend({
  type: z.literal('MediaObject'),
  duration: z.string().optional(),
});

// AudioObject
export const audioObjectSchema = mediaObjectSchema.extend({
  type: z.literal('AudioObject'),
  volumeLevel: z.string().optional(),
  volumeMin: z.string().optional(),
  volumeMax: z.string().optional(),
  muted: z.boolean().optional(),
});

// VideoObject
export const videoObjectSchema = mediaObjectSchema.extend({
  type: z.literal('VideoObject'),
});

// ImageObject
export const imageObjectSchema = mediaObjectSchema.extend({
  type: z.literal('ImageObject'),
});

// MediaLocation
export const mediaLocationSchema = entitySchema.extend({
  type: z.literal('MediaLocation'),
  currentTime: z.string().optional(),
}); 