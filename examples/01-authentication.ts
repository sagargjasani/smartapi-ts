/**
 * Authentication Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Initialize the SmartAPI client
 * 2. Login with different authentication methods
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
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID',
      debug: DEBUG,
    };
    
    const smartApi = new SmartAPI(config);
    console.log('SmartAPI client initialized successfully');

    // Step 2: Login using different methods
    console.log('\n2. Demonstrating different login scenarios');
    
    // Replace with actual credentials
    const password = 'YOUR_PASSWORD';
    
    // Scenario 1: Login without TOTP (for accounts without 2FA enabled)
    console.log('\n2.1 Login without TOTP');
    const loginResponseNoTotp = await smartApi.login(password);
    console.log('Login without TOTP:', loginResponseNoTotp.status ? 'Success' : 'Failed');
    
    if (loginResponseNoTotp.status) {
      // Logout to prepare for next scenario
      await smartApi.logout();
    }

    // Scenario 2: Login with manually provided TOTP
    console.log('\n2.2 Login with manually provided TOTP');
    const totp = 'TOTP_CODE_HERE'; // Enter a valid TOTP code if your account requires it
    
    const loginResponseWithTotp = await smartApi.login(password, totp);
    console.log('Login with TOTP:', loginResponseWithTotp.status ? 'Success' : 'Failed');
    
    // Store tokens from the successful login
    let jwtToken, refreshToken, feedToken;
    
    if (loginResponseWithTotp.status) {
      // Store tokens for future use
      jwtToken = loginResponseWithTotp.data?.jwtToken;
      refreshToken = loginResponseWithTotp.data?.refreshToken;
      feedToken = loginResponseWithTotp.data?.feedToken;
      
      console.log('JWT Token:', jwtToken);
      console.log('Refresh Token:', refreshToken);
      console.log('Feed Token:', feedToken);
    } else if (loginResponseNoTotp.status) {
      // If login with TOTP failed but non-TOTP login succeeded
      jwtToken = loginResponseNoTotp.data?.jwtToken;
      refreshToken = loginResponseNoTotp.data?.refreshToken;
      feedToken = loginResponseNoTotp.data?.feedToken;
    } else {
      console.error('All login attempts failed');
      return; // Exit if all logins fail
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
    console.log('\n5. Demonstrating token-based authentication');
    
    // Create a new SmartAPI instance using the tokens from the previous login
    console.log('Creating new SmartAPI instance with saved tokens');
    const tokenConfig: SmartAPIConfig = {
      apiKey: 'YOUR_API_KEY',
      jwtToken: jwtToken,
      refreshToken: refreshToken,
      debug: DEBUG
    };
    
    const tokenSmartApi = new SmartAPI(tokenConfig);
    
    // Check if authenticated with token
    console.log('Authentication status with token:', tokenSmartApi.auth.isAuthenticated());
    
    // Try getting profile with token authentication
    console.log('Fetching profile with token authentication:');
    const tokenProfileResponse = await tokenSmartApi.getProfile();
    console.log('Profile response with token auth:', tokenProfileResponse.status ? 'Success' : 'Failed');

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