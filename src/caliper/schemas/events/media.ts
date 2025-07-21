import { z } from 'zod';
import { eventSchema } from '../base';
import { mediaObjectSchema, mediaLocationSchema } from '../entities/digital-resource';

// MediaEvent - for media player interactions
export const mediaEventSchema = eventSchema.extend({
  type: z.literal('MediaEvent'),
  action: z.enum([
    'Started', 'Ended', 'Paused', 'Resumed', 'Restarted',
    'ForwardedTo', 'JumpedTo', 'ChangedResolution',
    'ChangedSize', 'ChangedSpeed', 'ChangedVolume',
    'EnabledClosedCaptioning', 'DisabledClosedCaptioning',
    'EnteredFullScreen', 'ExitedFullScreen', 'Muted', 'Unmuted'
  ]),
  object: mediaObjectSchema,
  target: mediaLocationSchema.optional(),
}); 