import { serve } from '@hono/node-server';
import { app } from '../src/index';

const port = 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Caliper API running at http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/docs`); 