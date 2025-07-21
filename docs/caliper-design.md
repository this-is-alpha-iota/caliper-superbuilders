# Caliper Analytics v1.2 Implementation Design

## Overview

This document outlines the implementation plan for a modern Caliper Analytics v1.2 API using TypeScript, AWS serverless infrastructure, and event-driven architecture. Unlike the legacy implementation with its 147+ schema files, we'll build a streamlined, performant system that fully implements the specification while being developer-friendly and cost-effective.

## Key Architectural Decisions

### 1. Event-First Architecture
Caliper is fundamentally about **events**, not CRUD operations. Our architecture reflects this:
- **Write Path**: Lambda Function URLs → Kinesis → Storage
- **Read Path**: DynamoDB (hot) + Athena (cold) + ClickHouse (analytics)
- **Validation**: In-memory Zod schemas with compiled validators

### 2. Technology Stack
- **Runtime**: Bun (for speed) [[memory:3701108]]
- **Framework**: Hono (minimal, fast, TypeScript-native)
- **Validation**: Zod with pre-compiled schemas
- **Infrastructure**: SST v3 with AWS CDK
- **Storage**: DynamoDB + S3 + ClickHouse Cloud
- **Auth**: AWS Cognito with JWT [[memory:3596161]]
- **Docs**: Scalar UI with auto-generated OpenAPI [[memory:3596156]]

### 3. No Build Step
- Pure TypeScript with Bun runtime
- File-based routing for LLM discoverability
- Semantic filenames throughout

## AWS Service Selection Rationale

### Why DynamoDB over RDS/Aurora?

**DynamoDB is the optimal choice for Caliper events because:**

1. **Event data is naturally key-value**: Events are accessed by `sensorId#timestamp` or `actorId#timestamp` - perfect for DynamoDB's partition/sort key model
2. **Predictable performance at scale**: Single-digit millisecond latency regardless of data size (RDS performance degrades as tables grow)
3. **Auto-scaling without connection limits**: No connection pooling issues or manual scaling required (RDS has connection limits that complicate serverless)
4. **Built-in TTL for hot data**: Native expiration for 30-day retention (RDS requires custom cleanup jobs)
5. **Cost-effective for educational patterns**: Pay-per-request pricing aligns with sporadic usage during school hours (RDS charges hourly even when idle)

**RDS would only be preferable if** we needed complex JOINs across entities, but Caliper events are self-contained JSON documents that don't require relational queries.

### Why Lambda over ECS/Fargate?

**Lambda is ideal for Caliper's event ingestion because:**

1. **Event-driven by design**: Caliper is about processing discrete events, not maintaining long-lived connections
2. **Zero idle cost**: Schools generate events only during class hours (Fargate charges 24/7 for running containers)
3. **Instant scaling**: From 0 to 10,000 concurrent executions without pre-warming (ECS requires capacity planning)
4. **No container management overhead**: Just deploy code (ECS needs image builds, registries, task definitions)
5. **Native Kinesis integration**: Built-in event source mapping (ECS requires custom polling logic)

**Fargate would only be necessary if** we needed WebSockets, long-running processes, or complex container orchestration - none of which apply to Caliper's stateless HTTP ingestion.

### The Synergy

Lambda + DynamoDB + Kinesis creates an **infinitely scalable event pipeline** that:
- Requires no server management
- Eliminates capacity planning
- Provides pay-per-event pricing
- Delivers sub-100ms latency
- Includes automatic failover

This architecture perfectly matches Caliper's core requirement: **handling unpredictable bursts of educational events with fast ingestion and simple retrieval**.

## API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                    (Custom Domain + WAF)                         │
└────────────────────┬────────────────────────┬───────────────────┘
                     │                        │
                     ▼                        ▼
         ┌───────────────────┐       ┌────────────────┐
         │ /caliper/v1p2/*   │       │ /analytics/*   │
         │ Lambda Function   │       │ Lambda@Edge    │
         │ (Event Ingestion) │       │ (Queries)      │
         └─────────┬─────────┘       └───────┬────────┘
                   │                         │
                   ▼                         ▼
         ┌─────────────────┐       ┌──────────────────┐
         │ Kinesis Firehose│       │ DynamoDB + S3    │
         │ (Event Stream)  │       │ (Storage Layer)  │
         └─────────────────┘       └──────────────────┘
```

## Directory Structure

```
src/
├── caliper/
│   ├── events/                    # Event handlers
│   │   ├── ingest.ts             # Main event ingestion
│   │   └── validate.ts           # Validation-only endpoint
│   ├── schemas/                   # Zod schemas
│   │   ├── events/               # 21 event types
│   │   ├── entities/             # Entity schemas
│   │   ├── profiles/             # Profile definitions
│   │   └── index.ts              # Schema registry
│   ├── validators/               # Compiled validators
│   └── streaming/                # Kinesis processors
├── analytics/                    # Query endpoints
│   ├── metrics.ts               # Aggregate metrics
│   ├── paths.ts                 # Learning paths
│   └── export.ts                # Bulk data export
├── webhooks/                    # Webhook management
│   ├── crud.ts                  # Webhook CRUD
│   └── processor.ts             # Event → Webhook
├── lib/
│   ├── auth.ts                  # Cognito integration
│   ├── storage/                 # Storage adapters
│   └── telemetry.ts             # OpenTelemetry
└── index.ts                     # App entry point
```

## Core Schemas

### Base Event Schema (Required for all phases)

```typescript
// src/caliper/schemas/base.ts
import { z } from 'zod';

// IRI pattern for Caliper identifiers
const iriSchema = z.string().url().or(
  z.string().regex(/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
);

// Base entity schema - all entities extend this
export const entitySchema = z.object({
  id: iriSchema,
  type: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  dateCreated: z.string().datetime().optional(),
  dateModified: z.string().datetime().optional(),
  extensions: z.record(z.any()).optional(),
});

// Base event schema
export const eventSchema = z.object({
  '@context': z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
  id: iriSchema,
  type: z.string(),
  actor: z.lazy(() => agentSchema),
  action: z.string(),
  object: z.lazy(() => entitySchema),
  eventTime: z.string().datetime(),
  
  // Optional fields
  target: z.lazy(() => entitySchema).optional(),
  generated: z.lazy(() => entitySchema).optional(),
  referrer: z.lazy(() => entitySchema).optional(),
  edApp: z.lazy(() => softwareApplicationSchema).optional(),
  group: z.lazy(() => organizationSchema).optional(),
  membership: z.lazy(() => membershipSchema).optional(),
  session: z.lazy(() => sessionSchema).optional(),
  federatedSession: z.lazy(() => ltiSessionSchema).optional(),
  extensions: z.record(z.any()).optional(),
});

// Envelope schema
export const envelopeSchema = z.object({
  sensor: z.string(),
  sendTime: z.string().datetime(),
  dataVersion: z.literal('http://purl.imsglobal.org/ctx/caliper/v1p2'),
  data: z.array(eventSchema),
});
```

## Implementation Phases

### Phase 0: Infrastructure & Documentation Shell

**Goal**: Deploy empty API with health check and Scalar docs

**Deliverables**:
- SST infrastructure deployed to AWS
- Lambda function with health check endpoint
- Empty OpenAPI spec served via Scalar UI
- Basic authentication configured (but not required for health)

**OpenAPI Visible**:
- `GET /health` - Returns `{ status: "ok" }`
- `GET /openapi.json` - Returns OpenAPI spec
- Scalar UI at `/docs`

**E2E Test**:
```typescript
// tests/phase0.test.ts
test("health check returns ok", async () => {
  const res = await fetch(`${API_URL}/health`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("OpenAPI spec is accessible", async () => {
  const res = await fetch(`${API_URL}/openapi.json`);
  expect(res.status).toBe(200);
  const spec = await res.json();
  expect(spec.openapi).toBe("3.0.0");
});
```

### Phase 1: Event Validation Endpoint

**Goal**: Accept and validate Caliper events without storing them

**Deliverables**:
- `POST /caliper/v1p2/events/validate` endpoint
- Full Caliper v1.2 schema validation
- Detailed validation error messages
- No authentication required for validation

**OpenAPI Visible**:
- New endpoint with full request/response schemas
- Example requests for all 21 event types
- Validation error schema with examples

**E2E Test**:
```typescript
// tests/phase1.test.ts
test("validates correct ViewEvent", async () => {
  const envelope = createValidEnvelope([createViewEvent()]);
  const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
    method: "POST",
    body: JSON.stringify(envelope),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({
    valid: true,
    eventCount: 1,
  });
});

test("rejects invalid event with helpful error", async () => {
  const envelope = { sensor: "test", data: [{ invalid: true }] };
  const res = await fetch(`${API_URL}/caliper/v1p2/events/validate`, {
    method: "POST", 
    body: JSON.stringify(envelope),
  });
  expect(res.status).toBe(400);
  const error = await res.json();
  expect(error.errors).toContainEqual(
    expect.objectContaining({
      path: ["data", 0, "type"],
      message: "Required"
    })
  );
});
```

### Phase 2: Event Ingestion with Hot Storage

**Goal**: Store events in DynamoDB with authentication

**Deliverables**:
- `POST /caliper/v1p2/events` endpoint (requires auth)
- Events stored in DynamoDB with TTL
- Idempotency via event ID deduplication
- Sensor-based multi-tenancy

**OpenAPI Visible**:
- Authenticated endpoint with security requirements
- Success response includes event IDs stored
- Rate limit documentation

**E2E Test**:
```typescript
// tests/phase2.test.ts
test("stores events with valid auth token", async () => {
  const token = await getTestToken();
  const envelope = createValidEnvelope([createViewEvent()]);
  
  const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(envelope),
  });
  
  expect(res.status).toBe(200);
  const result = await res.json();
  expect(result.eventCount).toBe(1);
  expect(result.eventIds).toHaveLength(1);
});

test("rejects requests without auth", async () => {
  const res = await fetch(`${API_URL}/caliper/v1p2/events`, {
    method: "POST",
    body: JSON.stringify(createValidEnvelope()),
  });
  expect(res.status).toBe(401);
});
```

### Phase 3: Query API for Recent Events

**Goal**: Query events from DynamoDB

**Deliverables**:
- `GET /analytics/events` - Query recent events
- `GET /analytics/events/:id` - Get specific event
- Filtering by actor, object, time range
- Pagination support

**OpenAPI Visible**:
- Query parameter schemas with examples
- Response pagination format
- Filter syntax documentation

**E2E Test**:
```typescript
// tests/phase3.test.ts
test("queries events by actor", async () => {
  const actorId = "https://example.edu/users/554433";
  await seedEvents([
    createViewEvent({ actorId }),
    createViewEvent({ actorId: "other" }),
  ]);
  
  const res = await fetch(
    `${API_URL}/analytics/events?actorId=${actorId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  const data = await res.json();
  expect(data.events).toHaveLength(1);
  expect(data.events[0].actor.id).toBe(actorId);
});
```

### Phase 4: Webhook Management

**Goal**: CRUD operations for webhooks

**Deliverables**:
- `POST /webhooks` - Create webhook
- `GET /webhooks` - List webhooks for sensor
- `PUT /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- Webhook secret generation

**OpenAPI Visible**:
- Full CRUD endpoints
- Webhook schema with examples
- Security considerations documented

**E2E Test**:
```typescript
// tests/phase4.test.ts
test("creates and lists webhooks", async () => {
  const webhook = {
    name: "Test Webhook",
    targetUrl: "https://example.com/hook",
    events: ["ViewEvent"],
  };
  
  const createRes = await fetch(`${API_URL}/webhooks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(webhook),
  });
  expect(createRes.status).toBe(201);
  
  const listRes = await fetch(`${API_URL}/webhooks`);
  const { webhooks } = await listRes.json();
  expect(webhooks).toHaveLength(1);
});
```

### Phase 5: Streaming to Cold Storage

**Goal**: Archive all events to S3 via Kinesis

**Deliverables**:
- Kinesis Firehose configuration
- S3 bucket with lifecycle policies
- Parquet transformation
- Dead letter queue for failures

**OpenAPI Visible**:
- No new endpoints (internal feature)
- Documentation updated to mention archival

**E2E Test**:
```typescript
// tests/phase5.test.ts
test("events appear in S3 within 5 minutes", async () => {
  const eventId = crypto.randomUUID();
  await sendEvent(createViewEvent({ id: eventId }));
  
  // Wait for Kinesis batch
  await sleep(5 * 60 * 1000);
  
  const s3Objects = await listS3Objects({
    prefix: `events/${new Date().toISOString().slice(0, 10)}/`,
  });
  
  expect(s3Objects.some(obj => 
    obj.key.includes(eventId)
  )).toBe(true);
});
```

### Phase 6: Webhook Processing

**Goal**: Trigger webhooks when events arrive

**Deliverables**:
- Event filtering logic for webhooks
- Webhook delivery with retries
- Webhook event log
- Signature verification

**OpenAPI Visible**:
- `GET /webhooks/:id/deliveries` - Webhook delivery history
- Webhook filtering syntax in docs

**E2E Test**:
```typescript
// tests/phase6.test.ts
test("triggers webhook for matching event", async () => {
  let received: any;
  const server = createTestWebhookServer((req) => {
    received = req.body;
  });
  
  await createWebhook({
    targetUrl: server.url,
    filters: [{ eventType: "ViewEvent" }],
  });
  
  await sendEvent(createViewEvent());
  await waitFor(() => expect(received).toBeDefined());
  
  expect(received.data[0].type).toBe("ViewEvent");
});
```

## Key Implementation Benefits

### 1. Performance
- **Sub-100ms** event ingestion latency
- **Parallel processing** via Kinesis
- **Pre-compiled validators** for speed
- **Strategic caching** at multiple layers

### 2. Scalability
- **Serverless** auto-scaling
- **Event-driven** architecture
- **Partitioned storage** for unlimited growth
- **Read replicas** for analytics

### 3. Developer Experience
- **Type-safe** throughout
- **File-based routing** for discoverability
- **Auto-generated OpenAPI** docs via Scalar
- **Semantic error messages** for debugging

### 4. Cost Optimization
- **Pay-per-use** serverless model
- **Automatic data tiering** (hot/cold)
- **Efficient compression** for storage
- **Smart caching** to reduce queries

### 5. Compliance
- **Full Caliper v1.2** compatibility
- **FERPA-compliant** data handling
- **Audit logging** built-in
- **Data retention** policies

## Stretch Goals

The following phases are **neither required by the Caliper v1.2 specification nor implemented in the existing system**. They represent potential future enhancements that could add value but are not necessary for spec compliance or feature parity.

### Phase 7: Analytics Queries (Stretch)

**Goal**: Complex analytics via Athena/ClickHouse

**Why it's a stretch goal**:
- Caliper spec is only about event ingestion, not analytics
- Existing implementation explicitly states analytics/ETL is out of scope
- Would require significant additional infrastructure

**Potential Deliverables**:
- `GET /analytics/metrics` - Aggregated metrics
- `GET /analytics/paths` - Learning path analysis
- `GET /analytics/engagement` - Engagement scores
- Pre-computed daily aggregates

### Phase 8: Bulk Export (Stretch)

**Goal**: Export large datasets efficiently

**Why it's a stretch goal**:
- Not mentioned in Caliper spec
- Not in existing implementation
- Could be handled by direct S3 access for authorized users

**Potential Deliverables**:
- `POST /analytics/export` - Request export
- `GET /analytics/exports/:id` - Check export status
- S3 presigned URLs for downloads
- Multiple export formats (JSON, CSV, Parquet)

### Phase 9: Performance Optimization (Stretch)

**Goal**: Sub-100ms p99 latency at scale

**Why it's a stretch goal**:
- Implementation detail, not a spec requirement
- Current serverless architecture should scale well already
- Optimization is premature without real usage data

**Potential Deliverables**:
- Compiled schema validators
- Connection pooling
- Response caching with ElastiCache
- Batch write optimizations

### Phase 10: Production Readiness (Stretch)

**Goal**: Complete monitoring and operations

**Why it's a stretch goal**:
- Implementation detail, not spec requirement
- Basic monitoring comes with AWS Lambda/CloudWatch
- Advanced monitoring can be added based on actual needs

**Potential Deliverables**:
- OpenTelemetry traces
- CloudWatch dashboards
- Alerts for key metrics
- Runbook documentation

## Testing Strategy

Each phase includes:
1. **Unit tests** for business logic
2. **Integration tests** for AWS services
3. **E2E tests** using `bun test`
4. **Load tests** for performance validation

Test structure:
```
tests/
├── unit/          # Pure logic tests
├── integration/   # AWS service tests
├── e2e/          # Full API tests
├── load/         # Performance tests
└── fixtures/     # Test data generators
```

## Migration Considerations

Since this is a greenfield implementation:
1. **No data migration needed**
2. **Start with pilot customers**
3. **Gradual rollout** with feature flags
4. **Side-by-side testing** if replacing existing system

## Success Metrics

1. **Technical Metrics**
   - Event ingestion latency < 100ms p99
   - Validation success rate > 95%
   - Zero data loss
   - 99.9% uptime

2. **Business Metrics**
   - Events processed per second
   - Active sensors/customers
   - Storage costs per million events
   - Developer onboarding time

## Conclusion

This phased approach delivers a modern Caliper implementation that:
- **Incrementally adds value** with each phase
- **Maintains full test coverage** throughout
- **Documents progress** via OpenAPI/Scalar
- **Scales effortlessly** with demand
- **Costs less** than traditional architectures

Each phase builds on the previous one, with clear deliverables and tests ensuring quality at every step. Phases 0-6 provide full Caliper v1.2 compliance and feature parity with the existing implementation, while the stretch goals offer a roadmap for future enhancements based on actual user needs. 