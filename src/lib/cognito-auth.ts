import type { Context, Next } from 'hono';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Define the sensor context type
export interface SensorData {
  sensorId: string;
  email: string;
  cognitoId: string;
  organizationId?: string;
}

// Authentication middleware for Cognito
export async function cognitoAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify token with Cognito
    const getUserCommand = new GetUserCommand({
      AccessToken: token,
    });
    
    const response = await cognitoClient.send(getUserCommand);
    
    if (!response.Username || !response.UserAttributes) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Extract user information from Cognito response
    const email = response.UserAttributes.find(attr => attr.Name === 'email')?.Value;
    const organizationId = response.UserAttributes.find(attr => attr.Name === 'custom:organizationId')?.Value;
    
    if (!email) {
      return c.json({ error: 'Email not found in token' }, 401);
    }
    
    // Create sensor data from Cognito user
    const sensor: SensorData = {
      sensorId: `sensor-${response.Username}`,
      email,
      cognitoId: response.Username,
      organizationId,
    };
    
    // Set sensor in context
    c.set('sensor', sensor);
    
    await next();
  } catch (error: any) {
    console.error('Cognito auth error:', error);
    
    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return c.json({ error: 'Token is expired or invalid' }, 401);
    }
    
    if (error.name === 'UserNotFoundException') {
      return c.json({ error: 'User not found' }, 401);
    }
    
    return c.json({ error: 'Authentication failed' }, 401);
  }
} 