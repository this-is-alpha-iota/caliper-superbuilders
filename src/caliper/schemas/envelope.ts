import { z } from 'zod';
import { dateTimeSchema } from './base';
import { caliperEventSchema } from './events';

// Strict envelope schema that validates events with the discriminated union
export const strictEnvelopeSchema = z.object({
  sensor: z.string(),
  sendTime: dateTimeSchema,
  dataVersion: z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
  data: z.array(caliperEventSchema),
}); 