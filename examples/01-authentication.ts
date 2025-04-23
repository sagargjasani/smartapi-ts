/**
 * Authentication Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Initialize the SmartAPI client
 * 2. Login with password and TOTP
 * 3. Check authentication status
 * 4. Generate new session with existing tokens
 * 5. Get user profile
 * 6. Logout
 */

import { SmartAPI, SmartAPIConfig } from '../src';

// Set debug to true to see detailed logs
const DEBUG = true;

/**
 * Main function to demonstrate authentication
 */
async function main() {
  try {
    // Step 1: Initialize SmartAPI with configuration
    console.log('\n1. Initializing SmartAPI client');
    
    const config: SmartAPIConfig = {
      apiKey: 'Ff6VQt0S',
      clientId: 'S315107',
      debug: DEBUG,
    };
    
    const smartApi = new SmartAPI(config);
    console.log('SmartAPI client initialized successfully');

    // Step 2: Login using password and optional TOTP
    console.log('\n2. Logging in with password (and optional TOTP)');
    
    // Replace with actual credentials
    const password = '2643';
    const totp = '895946'; // Leave empty if TOTP is not enabled
    
    const loginResponse = await smartApi.login(password, totp);
    console.log('Login response:', loginResponse);

    if (loginResponse.status) {
      // Store tokens for future use
      const jwtToken = loginResponse.data?.jwtToken;
      const refreshToken = loginResponse.data?.refreshToken;
      const feedToken = loginResponse.data?.feedToken;
      
      console.log('JWT Token:', jwtToken);
      console.log('Refresh Token:', refreshToken);
      console.log('Feed Token:', feedToken);
    } else {
      console.error('Login failed:', loginResponse.message);
      return; // Exit if login fails
    }

    // Step 3: Check if authenticated
    console.log('\n3. Checking authentication status');
    const isAuthenticated = smartApi.auth.isAuthenticated();
    console.log('Authenticated:', isAuthenticated);

    // Step 4: Get user profile
    console.log('\n4. Fetching user profile');
    const profileResponse = await smartApi.getProfile();
    console.log('Profile response:', profileResponse);

    // Step 5: Demonstrate token-based authentication
    // In a real application, you would save these tokens and reuse them
    console.log('\n5. Demonstrating token-based authentication');
    console.log('Normally, you would save your tokens from a previous login and use them like this:');
    console.log(`
    const savedJwtToken = '...your saved jwt token...';
    const savedRefreshToken = '...your saved refresh token...';
    
    const sessionResponse = await smartApi.generateSession(savedJwtToken, savedRefreshToken);
    console.log('Session response:', sessionResponse);
    `);

    // Step 6: Logout
    console.log('\n6. Logging out');
    const logoutResponse = await smartApi.logout();
    console.log('Logout response:', logoutResponse);
    console.log('Authentication status after logout:', smartApi.auth.isAuthenticated());

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('Authentication example completed'));