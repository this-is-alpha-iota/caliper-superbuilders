import { z } from 'zod';
import { entitySchema, agentSchema, dateTimeSchema } from '../base';
import { digitalResourceSchema } from './digital-resource';
import { textPositionSelectorSchema } from './selector';

// Base Annotation schema
export const annotationSchema = entitySchema.extend({
  type: z.literal('Annotation'),
  annotator: agentSchema.optional(),
  annotated: digitalResourceSchema.optional(),
});

// BookmarkAnnotation
export const bookmarkAnnotationSchema = annotationSchema.extend({
  type: z.literal('BookmarkAnnotation'),
  bookmarkDateTime: dateTimeSchema.optional(),
});

// HighlightAnnotation
export const highlightAnnotationSchema = annotationSchema.extend({
  type: z.literal('HighlightAnnotation'),
  selection: z.lazy(() => textPositionSelectorSchema).optional(),
  selectionText: z.string().optional(),
});

// SharedAnnotation
export const sharedAnnotationSchema = annotationSchema.extend({
  type: z.literal('SharedAnnotation'),
  withAgents: z.array(agentSchema).optional(),
});

// TagAnnotation
export const tagAnnotationSchema = annotationSchema.extend({
  type: z.literal('TagAnnotation'),
  tags: z.array(z.string()).optional(),
}); 