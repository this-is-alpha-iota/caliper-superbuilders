#!/usr/bin/env bun

// Set environment for local development
process.env.NODE_ENV = 'development';
// Use the actual deployed table names from SST
process.env.SENSORS_TABLE = process.env.SENSORS_TABLE || 'caliper-superbuilders-dev-CaliperSensorsTable-beanrwhk';
process.env.EVENTS_TABLE = process.env.EVENTS_TABLE || 'caliper-superbuilders-dev-CaliperEventsTable-bbnzzbka';
process.env.WEBHOOKS_TABLE = process.env.WEBHOOKS_TABLE || 'caliper-superbuilders-dev-CaliperWebhooksTable-edxoosfn';
process.env.EVENT_STREAM_NAME = process.env.EVENT_STREAM_NAME || 'caliper-superbuilders-dev-CaliperEventStreamStream-bcewkfwr';

import { serve } from '@hono/node-server';
import { app } from '../src/index';

const port = 3000;
console.log(`🚀 Caliper API running at http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/docs`);

serve({
  fetch: app.fetch,
  port,
}); 