import { z } from 'zod';
import { digitalResourceSchema } from './digital-resource';

// Link entity
export const linkSchema = digitalResourceSchema.extend({
  type: z.literal('Link'),
  href: z.string().url().optional(),
}); 