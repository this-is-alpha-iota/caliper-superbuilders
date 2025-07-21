import { z } from 'zod';

// TextPositionSelector entity - defines text selection positions
export const textPositionSelectorSchema = z.object({
  type: z.literal('TextPositionSelector'),
  start: z.number(),
  end: z.number(),
}); 