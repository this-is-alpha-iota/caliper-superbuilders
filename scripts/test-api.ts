#!/usr/bin/env bun

/**
 * Test script for Caliper API endpoints
 */

// Default to local unless explicitly set to production
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Try to load API key from .auth-token file or use default
let API_KEY = process.env.API_KEY || 'test-key';
try {
  const tokenFile = Bun.file('.auth-token');
  if (tokenFile.size > 0) {
    API_KEY = (await tokenFile.text()).trim();
    console.log('📌 Using API key from .auth-token file\n');
  }
} catch {
  // File doesn't exist or can't be read
}

interface TestResult {
  name: string;
  success: boolean;
  response?: any;
  error?: string;
}

async function runTest(name: string, fn: () => Promise<Response>): Promise<TestResult> {
  console.log(`🧪 ${name}...`);
  try {
    const response = await fn();
    const data = await response.text();
    
    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }
    
    console.log(JSON.stringify(parsed, null, 2));
    console.log('');
    
    return {
      name,
      success: response.ok,
      response: parsed,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error: ${errorMsg}\n`);
    return {
      name,
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  console.log(`🚀 Testing Caliper API at: ${API_URL}\n`);
  
  const results: TestResult[] = [];
  
  // Test 1: Health Check
  results.push(await runTest('Health Check', async () => {
    return fetch(`${API_URL}/health`);
  }));
  
  // Test 2: Validate Valid Event
  results.push(await runTest('Event Validation (Valid Event)', async () => {
    return fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sensor: 'https://example.edu/sensors/1',
        sendTime: '2024-01-01T00:00:00.000Z',
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: 'urn:uuid:test-123',
          type: 'ViewEvent',
          actor: { id: 'https://example.edu/users/123', type: 'Person' },
          action: 'Viewed',
          object: { id: 'https://example.edu/page/1', type: 'Page' },
          eventTime: '2024-01-01T00:00:00.000Z',
        }],
      }),
    });
  }));
  
  // Test 3: Validate Invalid Event
  results.push(await runTest('Event Validation (Invalid Event)', async () => {
    return fetch(`${API_URL}/caliper/v1p2/events/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sensor: 'https://example.edu/sensors/1',
        sendTime: '2024-01-01T00:00:00.000Z',
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          type: 'ViewEvent',
          // Missing required fields
        }],
      }),
    });
  }));
  
  // Test 4: Store Event Without Auth
  results.push(await runTest('Event Storage (No Auth)', async () => {
    return fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sensor: 'https://example.edu/sensors/1',
        sendTime: '2024-01-01T00:00:00.000Z',
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: 'urn:uuid:test-123',
          type: 'ViewEvent',
          actor: { id: 'https://example.edu/users/123', type: 'Person' },
          action: 'Viewed',
          object: { id: 'https://example.edu/page/1', type: 'Page' },
          eventTime: '2024-01-01T00:00:00.000Z',
        }],
      }),
    });
  }));
  
  // Test 5: Store Event With Auth
  results.push(await runTest('Event Storage (With Auth)', async () => {
    return fetch(`${API_URL}/caliper/v1p2/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        sensor: 'https://example.edu/sensors/1',
        sendTime: '2024-01-01T00:00:00.000Z',
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: 'urn:uuid:test-123',
          type: 'ViewEvent',
          actor: { id: 'https://example.edu/users/123', type: 'Person' },
          action: 'Viewed',
          object: { id: 'https://example.edu/page/1', type: 'Page' },
          eventTime: '2024-01-01T00:00:00.000Z',
        }],
      }),
    });
  }));
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${results.length}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error); 