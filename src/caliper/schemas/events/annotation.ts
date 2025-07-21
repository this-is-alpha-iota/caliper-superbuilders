import { z } from 'zod';
import { eventSchema } from '../base';
import { annotationSchema } from '../entities/annotation';
import { digitalResourceUnionSchema } from '../entities/digital-resource-union';

// AnnotationEvent - for annotation activities
export const annotationEventSchema = eventSchema.extend({
  type: z.literal('AnnotationEvent'),
  action: z.enum(['Bookmarked', 'Highlighted', 'Shared', 'Tagged']),
  object: digitalResourceUnionSchema,
  generated: annotationSchema.optional(),
}); 