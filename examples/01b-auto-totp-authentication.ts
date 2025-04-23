/**
 * Auto TOTP Authentication Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Initialize the SmartAPI client with a TOTP secret
 * 2. Login automatically without manually entering TOTP codes
 * 3. Generate TOTP codes programmatically
 */

import { SmartAPI, SmartAPIConfig } from '../src';

// Set debug to true to see detailed logs
const DEBUG = true;

/**
 * Main function to demonstrate automatic TOTP authentication
 */
async function main() {
  try {
    // Initialize SmartAPI with configuration including the TOTP secret
    console.log('\n1. Initializing SmartAPI client with TOTP secret');
    
    const config: SmartAPIConfig = {
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID',
      debug: DEBUG,
      // Add your TOTP secret here - this is the key used to generate TOTP codes
      // You get this once when setting up TOTP authentication with Angel One
      totpSecret: 'YOUR_TOTP_SECRET_KEY', 
    };
    
    const smartApi = new SmartAPI(config);
    console.log('SmartAPI client initialized successfully with TOTP secret');
    
    // Login with auto-generated TOTP
    console.log('\n3.1. Login with auto-generated TOTP (no TOTP parameter)');
    // No TOTP parameter passed - will use TOTP secret to generate code automatically
    const password = 'YOUR_PASSWORD';
    const loginResponse1 = await smartApi.login(password);
    console.log('Login response (auto TOTP):', loginResponse1.status ? 'Success' : 'Failed');
    
    if (loginResponse1.status) {
      // Log out to prepare for next scenario
      await smartApi.logout();
      console.log('Logged out successfully to prepare for next scenario');
    }
    
  

    console.log('\n5. Logging out');
    const logoutResponse = await smartApi.logout();
    console.log('Logout response:', logoutResponse);
    console.log('Authentication status after logout:', smartApi.auth.isAuthenticated());

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('Auto TOTP authentication example completed'));