import { z } from 'zod';
import { entitySchema } from '../base';
import { digitalResourceSchema } from './digital-resource';

// Collection entity
export const collectionSchema = digitalResourceSchema.extend({
  type: z.literal('Collection'),
  items: z.array(entitySchema).optional(),
});

// DigitalResourceCollection entity
export const digitalResourceCollectionSchema = collectionSchema.extend({
  type: z.literal('DigitalResourceCollection'),
  items: z.array(digitalResourceSchema).optional(),
}); 