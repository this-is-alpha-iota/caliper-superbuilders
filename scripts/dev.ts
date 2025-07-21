#!/usr/bin/env bun

// Set environment for development
process.env.NODE_ENV = 'development';
process.env.SENSORS_TABLE = 'local-sensors';
process.env.EVENTS_TABLE = 'local-events';

import { serve } from '@hono/node-server';
import { app } from '../src/index';

const port = 3000;
console.log(`🚀 Caliper API running at http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/docs`);

serve({
  fetch: app.fetch,
  port,
}); 