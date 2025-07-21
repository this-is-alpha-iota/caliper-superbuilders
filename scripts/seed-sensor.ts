import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Get table name from environment or command line
const tableName = process.argv[2] || process.env.SENSORS_TABLE;
if (!tableName) {
  console.error('Please provide table name as argument or set SENSORS_TABLE environment variable');
  process.exit(1);
}

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Generate test sensor
const apiKey = `test-${randomUUID()}`;
const sensorData = {
  apiKey,
  sensorId: 'test-sensor-001',
  name: 'Test Sensor',
  createdAt: new Date().toISOString(),
  active: true,
};

async function seedSensor() {
  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: sensorData,
    }));
    
    console.log('✅ Test sensor created successfully!');
    console.log('Table:', tableName);
    console.log('API Key:', apiKey);
    console.log('Sensor ID:', sensorData.sensorId);
    console.log('\nUse this API key in your requests:');
    console.log(`Authorization: Bearer ${apiKey}`);
  } catch (error) {
    console.error('❌ Failed to create sensor:', error);
    process.exit(1);
  }
}

seedSensor(); 