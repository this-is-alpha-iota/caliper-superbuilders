import { z } from 'zod';

// IRI pattern for Caliper identifiers
export const iriSchema = z.string().url().or(
  z.string().regex(/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
);

// ISO 8601 datetime
export const dateTimeSchema = z.string().datetime();

// ISO 8601 duration
export const durationSchema = z.string().regex(/^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/);

// Base entity schema - all entities extend this
export const entitySchema = z.object({
  id: iriSchema,
  type: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  dateCreated: dateTimeSchema.optional(),
  dateModified: dateTimeSchema.optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

// Agent types (actors who perform actions)
export const agentSchema = entitySchema.extend({
  type: z.enum(['Person', 'SoftwareApplication', 'Organization']),
});

// Person entity
export const personSchema = agentSchema.extend({
  type: z.literal('Person'),
});

// SoftwareApplication entity
export const softwareApplicationSchema = agentSchema.extend({
  type: z.literal('SoftwareApplication'),
  version: z.string().optional(),
});

// Organization entity
export const organizationSchema = agentSchema.extend({
  type: z.literal('Organization'),
  // subOrganizationOf: z.lazy(() => organizationSchema).optional(), // TODO: Add back circular ref
});

// Session entity
export const sessionSchema = entitySchema.extend({
  type: z.literal('Session'),
  startedAtTime: dateTimeSchema.optional(),
  endedAtTime: dateTimeSchema.optional(),
  duration: durationSchema.optional(),
});

// LTI Session
export const ltiSessionSchema = sessionSchema.extend({
  type: z.literal('LtiSession'),
  messageParameters: z.record(z.string(), z.unknown()).optional(),
});

// Membership entity
export const membershipSchema = entitySchema.extend({
  type: z.literal('Membership'),
  member: agentSchema.optional(),
  organization: organizationSchema.optional(),
  roles: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

// Base event schema - all events extend this
// Note: actor field will be replaced with agentUnionSchema when building the strict schema
export const eventSchema = z.object({
  '@context': z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
  id: iriSchema,
  type: z.string(),
  actor: agentSchema,
  action: z.string(),
  object: entitySchema,
  eventTime: dateTimeSchema,
  
  // Optional fields
  target: entitySchema.optional(),
  generated: entitySchema.optional(),
  referrer: entitySchema.optional(),
  edApp: softwareApplicationSchema.optional(),
  group: organizationSchema.optional(),
  membership: membershipSchema.optional(),
  session: sessionSchema.optional(),
  federatedSession: ltiSessionSchema.optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

// Import the discriminated union (will be done after we export base schemas)
// For now, keep using eventSchema for the envelope
// The actual event validation will happen in a separate pass

// Envelope schema - wraps events for transmission
export const envelopeSchema = z.object({
  sensor: z.string(),
  sendTime: dateTimeSchema,
  dataVersion: z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
  data: z.array(eventSchema),
}); 