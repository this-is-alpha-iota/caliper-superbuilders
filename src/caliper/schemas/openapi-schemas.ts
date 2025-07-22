import { z } from 'zod';

// Simplified envelope schema for OpenAPI documentation
// This avoids the complex discriminated union and circular references
export const envelopeSchemaForOpenAPI = z.object({
  sensor: z.string().describe('Sensor identifier'),
  sendTime: z.string().datetime().describe('When the envelope was sent'),
  dataVersion: z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2').describe('Caliper specification version'),
  data: z.array(z.object({
    '@context': z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
    id: z.string().describe('Event ID (IRI format)'),
    type: z.string().describe('Event type (e.g., ViewEvent, AssessmentEvent)'),
    actor: z.object({
      id: z.string().describe('Actor ID (IRI format)'),
      type: z.string().describe('Actor type (e.g., Person, SoftwareApplication)'),
    }).describe('Who performed the action'),
    action: z.string().describe('Action performed (e.g., Viewed, Started)'),
    object: z.object({
      id: z.string().describe('Object ID (IRI format)'),
      type: z.string().describe('Object type (e.g., Page, Assessment)'),
      name: z.string().optional().describe('Object name'),
    }).describe('Target of the action'),
    eventTime: z.string().datetime().describe('When the event occurred'),
    target: z.any().optional().describe('Specific part of the object'),
    generated: z.any().optional().describe('What was created by the action'),
    referrer: z.any().optional().describe('Navigation source'),
    edApp: z.any().optional().describe('Software application context'),
    group: z.any().optional().describe('Group context'),
    membership: z.any().optional().describe('Actor membership context'),
    session: z.any().optional().describe('Session context'),
    federatedSession: z.any().optional().describe('External session context'),
    extensions: z.record(z.string(), z.any()).optional().describe('Custom extensions'),
  }).passthrough()).describe('Array of Caliper events'),
}).openapi('CaliperEnvelope'); 