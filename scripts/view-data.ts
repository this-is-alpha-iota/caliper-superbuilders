#!/usr/bin/env bun

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function viewTable(tableName: string, limit = 10) {
  console.log(`\n📊 Viewing table: ${tableName}`);
  console.log('='.repeat(50));
  
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      Limit: limit,
    }));
    
    console.log(`Found ${result.Count} items (showing up to ${limit}):`);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((item, index) => {
        console.log(`\n--- Item ${index + 1} ---`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('No items found in table');
    }
    
    if (result.LastEvaluatedKey) {
      console.log(`\n⚠️  More items available (only showing first ${limit})`);
    }
  } catch (error: any) {
    console.error(`Error scanning table ${tableName}:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // These are the actual table names from your deployed stack
  const tables = {
    sensors: 'caliper-superbuilders-dev-CaliperSensorsTable-beanrwhk',
    events: 'caliper-superbuilders-dev-CaliperEventsTable-bbnzzbka', 
    webhooks: 'caliper-superbuilders-dev-CaliperWebhooksTable-???', // Not in outputs yet
  };
  
  if (command === 'all') {
    // View all tables
    for (const [name, tableName] of Object.entries(tables)) {
      await viewTable(tableName, 5);
    }
  } else if (command === 'sensors') {
    await viewTable(tables.sensors);
  } else if (command === 'events') {
    await viewTable(tables.events);
  } else if (command === 'webhooks') {
    await viewTable(tables.webhooks);
  } else if (command === 'count') {
    // Just show counts
    for (const [name, tableName] of Object.entries(tables)) {
      try {
        const result = await docClient.send(new ScanCommand({
          TableName: tableName,
          Select: 'COUNT',
        }));
        console.log(`${name}: ${result.Count || 0} items`);
      } catch (error: any) {
        console.log(`${name}: Error - ${error.message}`);
      }
    }
  } else {
    console.log('Usage: bun scripts/view-data.ts <command>');
    console.log('\nCommands:');
    console.log('  all      - View sample data from all tables');
    console.log('  sensors  - View sensor data');
    console.log('  events   - View event data');
    console.log('  webhooks - View webhook data');
    console.log('  count    - Show item counts for all tables');
    console.log('\nExample:');
    console.log('  bun scripts/view-data.ts events');
  }
}

main().catch(console.error); 