import { z } from 'zod';
import { eventSchema } from '../base';
import { softwareApplicationSchema } from '../base';

// ToolUseEvent - for external tool launches
export const toolUseEventSchema = eventSchema.extend({
  type: z.literal('ToolUseEvent'),
  action: z.enum(['Used', 'Launched']),
  object: softwareApplicationSchema,
}); 