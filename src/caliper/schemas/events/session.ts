import { z } from 'zod';
import { eventSchema } from '../base';
import { sessionSchema } from '../base';

// SessionEvent - for session lifecycle
export const sessionEventSchema = eventSchema.extend({
  type: z.literal('SessionEvent'),
  action: z.enum(['LoggedIn', 'LoggedOut', 'TimedOut']),
  object: sessionSchema,
}); 