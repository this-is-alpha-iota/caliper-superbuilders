#!/usr/bin/env bun

// Set environment for local development
process.env.NODE_ENV = 'development';
// These will be overridden by SST when running with 'sst dev'
process.env.SENSORS_TABLE = process.env.SENSORS_TABLE || 'CaliperSensors';
process.env.EVENTS_TABLE = process.env.EVENTS_TABLE || 'CaliperEvents';
process.env.WEBHOOKS_TABLE = process.env.WEBHOOKS_TABLE || 'CaliperWebhooks';
process.env.EVENT_STREAM_NAME = process.env.EVENT_STREAM_NAME || 'CaliperEventStream';

import { serve } from '@hono/node-server';
import { app } from '../src/index';

const port = 3000;
console.log(`🚀 Caliper API running at http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/docs`);

serve({
  fetch: app.fetch,
  port,
}); 