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

### 🔄 Phase 1: Event Validation Endpoint (Next)
- [ ] `POST /caliper/v1p2/events/validate` endpoint
- [ ] Full Caliper v1.2 schema validation
- [ ] Detailed validation error messages

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
