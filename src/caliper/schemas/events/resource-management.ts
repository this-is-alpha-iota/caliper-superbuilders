import { z } from 'zod';
import { eventSchema } from '../base';
import { digitalResourceUnionSchema } from '../entities/digital-resource-union';

// ResourceManagementEvent - for resource lifecycle
export const resourceManagementEventSchema = eventSchema.extend({
  type: z.literal('ResourceManagementEvent'),
  action: z.enum([
    'Created', 'Modified', 'Archived', 'Deleted', 
    'Downloaded', 'Copied', 'Moved', 'Retrieved', 'Restored'
  ]),
  object: digitalResourceUnionSchema,
}); 