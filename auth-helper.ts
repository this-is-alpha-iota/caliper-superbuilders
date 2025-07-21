#!/usr/bin/env bun

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';

// Configuration
const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  sensorsTable: process.env.SENSORS_TABLE || 'caliper-superbuilders-ajbeckner-CaliperSensors',
};

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: AWS_CONFIG.region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Generate a secure API key
function generateApiKey(): string {
  return `sk_${randomBytes(32).toString('hex')}`;
}

// Create a sensor with API key
async function createSensor(name: string, apiKey?: string) {
  const key = apiKey || generateApiKey();
  
  // For local development, just save the key
  if (process.env.NODE_ENV === 'development' || process.env.API_URL?.includes('localhost')) {
    console.log(`🔧 Local mode - creating test sensor`);
    console.log(`✅ Sensor "${name}" created (local only)!`);
    console.log(`API Key: ${key}`);
    
    // Save to .auth-token file
    writeFileSync('.auth-token', key);
    console.log('\nAPI key saved to .auth-token file');
    console.log('\nNote: This is a local test key. For production, deploy with sst and use real DynamoDB.');
    
    return key;
  }
  
  try {
    await docClient.send(new PutCommand({
      TableName: AWS_CONFIG.sensorsTable,
      Item: {
        apiKey: key,
        sensorId: `sensor-${Date.now()}`,
        name,
        active: true,
        createdAt: new Date().toISOString(),
      },
    }));
    
    console.log(`✅ Sensor "${name}" created successfully!`);
    console.log(`API Key: ${key}`);
    
    // Save to .auth-token file
    writeFileSync('.auth-token', key);
    console.log('\nAPI key saved to .auth-token file');
    
    return key;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ Table ${AWS_CONFIG.sensorsTable} not found.`);
      console.error('Make sure you have deployed the infrastructure with: sst deploy');
      console.error('\nFor local development, use: NODE_ENV=development bun auth-helper.ts create');
    } else {
      console.error('Error creating sensor:', error.message);
    }
  }
}

// List all sensors
async function listSensors() {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: AWS_CONFIG.sensorsTable,
    }));
    
    if (!response.Items || response.Items.length === 0) {
      console.log('No sensors found.');
      return;
    }
    
    console.log('\n📋 Existing Sensors:');
    console.log('─'.repeat(80));
    
    response.Items.forEach((sensor) => {
      console.log(`Name: ${sensor.name}`);
      console.log(`ID: ${sensor.sensorId}`);
      console.log(`API Key: ${sensor.apiKey.substring(0, 10)}...`);
      console.log(`Active: ${sensor.active ? '✅' : '❌'}`);
      console.log(`Created: ${sensor.createdAt}`);
      console.log('─'.repeat(80));
    });
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ Table ${AWS_CONFIG.sensorsTable} not found.`);
      console.error('Make sure you have deployed the infrastructure with: sst deploy');
    } else {
      console.error('Error listing sensors:', error.message);
    }
  }
}

// Get current API key from file
function getCurrentApiKey(): string | null {
  if (existsSync('.auth-token')) {
    return readFileSync('.auth-token', 'utf-8').trim();
  }
  return null;
}

// Test the current API key
async function testApiKey(apiUrl?: string) {
  const apiKey = getCurrentApiKey();
  if (!apiKey) {
    console.error('❌ No API key found. Run: bun auth-helper.ts create');
    return;
  }
  
  const url = apiUrl || process.env.API_URL || 'http://localhost:3000';
  
  console.log(`Testing API key at: ${url}`);
  console.log(`Using key: ${apiKey.substring(0, 10)}...`);
  
  try {
    const response = await fetch(`${url}/caliper/v1p2/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sensor: 'https://example.edu/sensors/1',
        sendTime: new Date().toISOString(),
        dataVersion: 'http://purl.imsglobal.org/ctx/caliper/v1p2',
        data: [{
          '@context': 'http://purl.imsglobal.org/ctx/caliper/v1p2',
          id: `urn:uuid:test-${Date.now()}`,
          type: 'ViewEvent',
          actor: { id: 'https://example.edu/users/123', type: 'Person' },
          action: 'Viewed',
          object: { id: 'https://example.edu/page/1', type: 'Page' },
          eventTime: new Date().toISOString(),
        }],
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API key is valid!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API key test failed:');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    console.error('Make sure the API is running.');
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('=== Caliper API Authentication Helper ===');
  console.log(`Sensors Table: ${AWS_CONFIG.sensorsTable}`);
  console.log(`Region: ${AWS_CONFIG.region}\n`);
  
  if (command === 'create') {
    const name = args[1] || 'Test Sensor';
    await createSensor(name);
    
  } else if (command === 'list') {
    await listSensors();
    
  } else if (command === 'test') {
    const apiUrl = args[1];
    await testApiKey(apiUrl);
    
  } else if (command === 'current') {
    const apiKey = getCurrentApiKey();
    if (apiKey) {
      console.log('Current API key:', apiKey);
    } else {
      console.log('No API key found in .auth-token file');
    }
    
  } else {
    console.log('Usage:');
    console.log('  bun auth-helper.ts create [name]     - Create a new sensor with API key');
    console.log('  bun auth-helper.ts list              - List all sensors');
    console.log('  bun auth-helper.ts test [api-url]    - Test the current API key');
    console.log('  bun auth-helper.ts current           - Show current API key');
    console.log('\nExamples:');
    console.log('  bun auth-helper.ts create "Production Sensor"');
    console.log('  bun auth-helper.ts test https://your-api.lambda-url.us-east-1.on.aws');
    console.log('\nNote: API keys are saved to .auth-token file for use by tests.');
  }
}

main().catch(console.error); 