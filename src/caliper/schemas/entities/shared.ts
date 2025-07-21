import { z } from 'zod';
import { linkSchema } from './link';
import { agentSchema } from '../base';

// SharedLink entity - represents a shared hyperlink
export const sharedLinkSchema = linkSchema.extend({
  type: z.literal('SharedLink'),
  sharedWithAgents: z.array(agentSchema).optional(),
}); 