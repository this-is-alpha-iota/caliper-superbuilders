import { z } from 'zod';
import { entitySchema } from '../base';

// Scale entity - for rating scales
export const scaleSchema = entitySchema.extend({
  type: z.literal('Scale'),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleStep: z.number().optional(),
}); 