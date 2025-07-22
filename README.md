# Caliper Analytics API

A modern implementation of the IMS Caliper Analytics® specification v1.2 using TypeScript, AWS Lambda, and serverless architecture.

## 🚀 Live API

- **API Endpoint**: https://aihmehnsouzwahorcupmgsmz7u0rzdss.lambda-url.us-east-1.on.aws
- **Documentation**: https://aihmehnsouzwahorcupmgsmz7u0rzdss.lambda-url.us-east-1.on.aws/docs

## 📋 Implementation Status

### ✅ Phase 0: Infrastructure & Documentation Shell (Complete)
- [x] SST infrastructure deployed to AWS
- [x] Lambda function with health check endpoint
- [x] Empty OpenAPI spec served via Scalar UI
- [x] Basic project structure

**Endpoints Available**:
- `GET /health` - Health check endpoint
- `GET /openapi.json` - OpenAPI specification
- `GET /docs` - Scalar API documentation UI
- `GET /` - Redirects to `/docs`

### ✅ Phase 1: Event Validation Endpoint (Complete)
- [x] `POST /caliper/v1p2/events/validate` endpoint
- [x] Full Caliper v1.2 schema validation
- [x] Detailed validation error messages

**Endpoints Available**:
- `POST /caliper/v1p2/events/validate` - Validate Caliper events without storing them

### ✅ Phase 2: Event Storage Endpoint (Complete)
- [x] `POST /caliper/v1p2/events` endpoint for storing events  
- [x] DynamoDB storage with hot partition pattern
- [x] Sensor API key authentication with Bearer token support
- [x] Batch write support for multiple events (up to 25 per batch)
- [x] 90-day TTL on stored events
- [x] Complete OpenAPI documentation
- [x] All tests passing locally and on AWS

### ✅ Phase 3: Query API for Recent Events (Complete)
- [x] `GET /analytics/events` - Query recent events with filtering
- [x] `GET /analytics/events/:id` - Get specific event by ID
- [x] Filtering by actor, object, event type, and time range
- [x] Pagination with offset/limit and Link headers (RFC 5988 compliant)
- [x] Complete OpenAPI documentation for analytics endpoints
- [x] All tests passing with proper authentication

## 📍 API Endpoints

### Available Endpoints
- `GET /` - Redirects to API documentation
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Scalar UI)
- `GET /openapi.json` - OpenAPI specification
- `POST /caliper/v1p2/events/validate` - Validate Caliper events without storing them
- `POST /caliper/v1p2/events` - Store Caliper events (requires Bearer token authentication)
- `GET /analytics/events` - Query stored events with filtering and pagination (requires authentication)
- `GET /analytics/events/:id` - Get a specific event by ID (requires authentication)

### Authentication
The storage endpoint requires authentication using a Bearer token:
```
Authorization: Bearer <api-key>
```

## 🛠 Technology Stack

- **Runtime**: Bun (fast, TypeScript-native)
- **Framework**: Hono (minimal, fast web framework)
- **Validation**: Zod schemas
- **Infrastructure**: SST v3 + AWS Lambda
- **Documentation**: Scalar UI with OpenAPI

## 🏃‍♂️ Local Development

```bash
# Install dependencies
bun install

# Run local development server
bun run dev

# Run tests
bun test

# Deploy to AWS
sst deploy --stage dev
```

## 🧪 Testing

Run the Phase 0 tests:

```bash
# Test locally
bun test tests/phase0.test.ts

# Test against deployed API
API_URL=https://aihmehnsouzwahorcupmgsmz7u0rzdss.lambda-url.us-east-1.on.aws bun test tests/phase0.test.ts
```

## 📁 Project Structure

```
caliper-superbuilders/
├── src/
│   ├── index.ts         # Main API entry point
│   ├── caliper/         # Caliper-specific code
│   └── lib/             # Shared utilities
├── tests/
│   └── phase0.test.ts   # Phase 0 E2E tests
├── scripts/
│   └── dev.ts          # Local development server
├── docs/               # Documentation
└── sst.config.ts       # SST infrastructure config
```

## 🔗 Resources

- [IMS Caliper Analytics® v1.2 Specification](https://www.imsglobal.org/spec/caliper/v1p2)
- [SST Documentation](https://sst.dev)
- [Hono Documentation](https://hono.dev)
