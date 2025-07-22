import { cognitoAuthMiddleware } from './cognito-auth';

// Re-export the Cognito auth middleware as the default auth middleware
export const authMiddleware = cognitoAuthMiddleware;

// Re-export SensorData type from cognito-auth
export type { SensorData } from './cognito-auth'; 