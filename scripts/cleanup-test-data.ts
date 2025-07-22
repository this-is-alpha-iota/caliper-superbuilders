#!/usr/bin/env bun

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function cleanupTable(tableName: string, keyAttributes: string[]) {
  console.log(`\n🧹 Cleaning up table: ${tableName}`);
  
  try {
    // Scan all items
    const scanResult = await docClient.send(new ScanCommand({
      TableName: tableName,
    }));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('No items to delete');
      return;
    }
    
    console.log(`Found ${scanResult.Items.length} items to delete`);
    
    // Delete in batches of 25
    const deleteRequests = scanResult.Items.map(item => ({
      DeleteRequest: {
        Key: keyAttributes.reduce((acc, key) => {
          acc[key] = item[key];
          return acc;
        }, {} as any),
      },
    }));
    
    for (let i = 0; i < deleteRequests.length; i += 25) {
      const batch = deleteRequests.slice(i, i + 25);
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch,
        },
      }));
      console.log(`Deleted ${Math.min(i + 25, deleteRequests.length)} / ${deleteRequests.length} items`);
    }
    
    console.log('✅ Cleanup complete');
  } catch (error: any) {
    console.error(`Error cleaning table ${tableName}:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] !== '--confirm') {
    console.log('⚠️  WARNING: This will delete ALL data from your DynamoDB tables!');
    console.log('\nTo confirm, run:');
    console.log('  bun scripts/cleanup-test-data.ts --confirm');
    return;
  }
  
  // Clean up events table
  await cleanupTable('caliper-superbuilders-dev-CaliperEventsTable-bbnzzbka', ['pk', 'sk']);
  
  // Clean up sensors table (be careful!)
  console.log('\n⚠️  Sensor cleanup would delete API keys. Skipping for safety.');
  console.log('To manually clean sensors, use AWS Console.');
}

main().catch(console.error); 