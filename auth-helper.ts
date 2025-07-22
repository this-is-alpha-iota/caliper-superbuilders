#!/usr/bin/env bun

import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { writeFileSync } from "fs";

// Your deployed Cognito configuration
const COGNITO_CONFIG = {
  userPoolId: "us-east-1_BvmcFzsVf",
  clientId: "4hobk8m7cd4o729t9d0mf20jhg",
  region: "us-east-1"
};

const client = new CognitoIdentityProviderClient({ region: COGNITO_CONFIG.region });

// Helper functions
async function registerUser(email: string, password: string, name: string) {
  try {
    const command = new SignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name }
      ]
    });
    
    const response = await client.send(command);
    console.log("✅ User registered successfully!");
    console.log("Check your email for the verification code.");
    return response;
  } catch (error: any) {
    if (error.name === "UsernameExistsException") {
      console.log("User already exists. Skipping registration.");
    } else {
      console.error("Registration error:", error.message);
    }
  }
}

async function confirmUser(email: string, code: string) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      ConfirmationCode: code
    });
    
    await client.send(command);
    console.log("✅ User confirmed successfully!");
  } catch (error: any) {
    console.error("Confirmation error:", error.message);
  }
}

async function login(email: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      ClientId: COGNITO_CONFIG.clientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const response = await client.send(command);
    
    if (response.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
      
      console.log("✅ Login successful!");
      console.log("\nAccess Token:");
      console.log(AccessToken);
      
      // Save token to file
      writeFileSync(".auth-token", AccessToken!);
      console.log("\nToken saved to .auth-token file");
      
      return {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken
      };
    }
  } catch (error: any) {
    console.error("Login error:", error.message);
  }
}

// Interactive CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log("=== Caliper API Cognito Authentication Helper ===");
  console.log(`User Pool ID: ${COGNITO_CONFIG.userPoolId}`);
  console.log(`Client ID: ${COGNITO_CONFIG.clientId}\n`);
  
  if (command === "register") {
    const email = args[1] || "test@example.com";
    const password = args[2] || "TestPassword123!";
    const name = args[3] || "Test User";
    
    console.log(`Registering user: ${email}`);
    await registerUser(email, password, name);
    
  } else if (command === "confirm") {
    const email = args[1];
    const code = args[2];
    
    if (!email || !code) {
      console.error("Usage: bun auth-helper.ts confirm <email> <code>");
      process.exit(1);
    }
    
    await confirmUser(email, code);
    
  } else if (command === "login") {
    const email = args[1] || "test@example.com";
    const password = args[2] || "TestPassword123!";
    
    console.log(`Logging in as: ${email}`);
    await login(email, password);
    
  } else {
    console.log("Usage:");
    console.log("  bun auth-helper.ts register [email] [password] [name]");
    console.log("  bun auth-helper.ts confirm <email> <code>");
    console.log("  bun auth-helper.ts login [email] [password]");
    console.log("\nExample:");
    console.log("  bun auth-helper.ts register test@example.com TestPassword123! 'Test User'");
    console.log("  bun auth-helper.ts confirm test@example.com 123456");
    console.log("  bun auth-helper.ts login test@example.com TestPassword123!");
  }
}

main().catch(console.error); 