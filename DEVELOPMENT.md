# Caliper Superbuilders Development Guide

## Development Modes

This project **always uses real AWS services** - there are no mock data modes.

### 1. Local Development - `bun run dev`

Runs a local server that connects to real AWS services.

```bash
bun run dev
```

- **URL**: http://localhost:3000
- **Docs**: http://localhost:3000/docs
- **Uses**: Real DynamoDB, Kinesis, S3 in your AWS account
- **Requirements**: AWS credentials configured
- **Good for**: Development with real data persistence

### 2. SST Live Development - `bun run dev:sst`

Runs the application using SST's Live Lambda Development. Also connects to real AWS services.

```bash
bun run dev:sst
```

- **Uses**: Real DynamoDB, Kinesis, S3 in your AWS account
- **Good for**: Testing Lambda behavior, debugging SST infrastructure
- **Requirements**: AWS credentials configured
- **Cost**: Minimal (pay-per-request pricing)

### 3. Testing - `bun test`

Runs tests against real AWS services.

```bash
bun test
```

- **Uses**: Real AWS services
- **Good for**: Integration testing, verifying actual AWS behavior
- **Requirements**: AWS credentials configured

## Environment Variables

- `NODE_ENV` - Standard Node environment (`development`, `production`)
- AWS service table names are set by SST or can be manually configured:
  - `SENSORS_TABLE` - DynamoDB table for sensor data
  - `EVENTS_TABLE` - DynamoDB table for events
  - `WEBHOOKS_TABLE` - DynamoDB table for webhooks
  - `EVENT_STREAM_NAME` - Kinesis stream name

## Authentication

For all modes, generate an auth token:

```bash
bun auth-helper.ts login test@example.com TestPassword123!
```

This creates a `.auth-token` file used by tests and development.

## AWS Services Used (in SST dev mode)

- **DynamoDB**: Event and webhook storage
- **Kinesis Data Streams**: Event streaming
- **S3**: Long-term event archival
- **Lambda**: Processing functions

## Cost Considerations

When using `bun run dev:sst`:

- DynamoDB: Pay-per-request (~$0.25 per million reads/writes)
- Kinesis: ~$0.015 per shard hour + data ingestion
- S3: ~$0.023 per GB stored
- Lambda: Free tier covers most development usage

For typical development, costs are minimal (< $1/month).

## Important Notes

1. **No Mock Data**: All operations hit real AWS services
2. **Data Persistence**: All data is persisted in AWS - be careful with test data
3. **Cost Implications**: While minimal, there are real AWS costs
4. **AWS Credentials Required**: You must have AWS credentials configured
5. **Deploy to Production**: `bun run deploy`

## Recommended Development Workflow

1. Use a separate AWS account for development
2. Set up billing alerts to monitor costs
3. Clean up test data regularly
4. Use unique sensor IDs for testing to avoid conflicts 