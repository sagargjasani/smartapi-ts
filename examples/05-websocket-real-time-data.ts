/**
 * WebSocket Real-Time Data Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Connect to the WebSocket for real-time market data
 * 2. Subscribe to market ticks for specific symbols
 * 3. Handle WebSocket events
 * 4. Subscribe to multiple symbols
 * 5. Unsubscribe from symbols
 * 6. Reconnect on disconnection
 * 
 * Note: This example runs continuously until manually terminated (Ctrl+C)
 */

import { 
  SmartAPI, 
  SmartAPIConfig, 
  SmartAPIWebSocket
} from '../src';

// Import the enums directly from the WebSocket file
import { FeedMode, ExchangeType } from '../src/lib/WebSocket';

// Set debug to true to see detailed logs
const DEBUG = true;

// This function is used to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to demonstrate WebSocket functionality
 */
async function main() {
  try {
    // STEP 1: Initialize SmartAPI and login to get feed token
    console.log('Step 1: Initializing SmartAPI client and login');
    
    const config: SmartAPIConfig = {
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID',
      debug: DEBUG,
    };
    
    const smartApi = new SmartAPI(config);
    console.log('SmartAPI client initialized');
    
    // Login to get the feed token (required for WebSocket)
    console.log('\nLogging in...');
    const loginResponse = await smartApi.login('YOUR_PASSWORD', 'YOUR_TOTP');
    
    if (!loginResponse.status || !loginResponse.data?.feedToken) {
      console.error('Login failed or feed token not received:', loginResponse.message);
      return;
    }
    
    const feedToken = loginResponse.data.feedToken;
    console.log('Login successful, received feed token');
    
    // STEP 2: Initialize WebSocket client
    console.log('\nStep 2: Initializing WebSocket client');
    const ws = new SmartAPIWebSocket(
      config.apiKey!,     // API key
      config.clientId!,   // Client ID
      feedToken,          // Feed token from login
      loginResponse.data.jwtToken,  // JWT token for authentication
      DEBUG               // Pass debug flag directly to constructor
    );
    
    // STEP 3: Set up event handlers for WebSocket
    console.log('\nStep 3: Setting up WebSocket event handlers');
    
    // Handle connection event
    ws.on('connected', () => {
      console.log('WebSocket connected successfully');
    });
    
    // Handle disconnection event
    ws.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });
    
    // Handle error event
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Handle tick event (all ticks)
    ws.on('tick', (data) => {
      console.log('Received tick data:', data);
    });
    
    // STEP 4: Connect to WebSocket server
    console.log('\nStep 4: Connecting to WebSocket server');
    try {
      await ws.connect();
      console.log('Connected to WebSocket server');
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      return;
    }
    
    // STEP 5: Subscribe to market data for specific symbols
    console.log('\nStep 5: Subscribing to market data for specific symbols');
    
    // Example symbols (adjust as needed)
    const symbols = [
      { exchange: ExchangeType.NSE_CM, token: '3045' },   // SBIN
      { exchange: ExchangeType.NSE_CM, token: '1594' }    // INFY
    ];
    
    // Subscribe to each symbol with a unique correlation ID
    for (const symbol of symbols) {
      const correlationId = `${symbol.exchange}_${symbol.token}`;
      
      try {
        await ws.subscribe(
          correlationId,         // Unique correlation ID
          symbol.exchange,       // Exchange (NSE_CM, BSE_CM, etc.)
          symbol.token,          // Symbol token
          FeedMode.QUOTE         // Data mode (LTP, QUOTE, SNAP_QUOTE)
        );
        
        console.log(`Subscribed to ${symbol.exchange}:${symbol.token} with ID: ${correlationId}`);
        
        // Set up an event handler for this specific subscription
        ws.on(`tick:${correlationId}`, (tickData) => {
          console.log(`Tick for ${correlationId}:`, tickData);
        });
        
      } catch (error) {
        console.error(`Failed to subscribe to ${symbol.exchange}:${symbol.token}:`, error);
      }
      
      // Add a small delay between subscriptions to avoid rate limiting
      await sleep(1000);
    }
    
    // STEP 6: Demonstrate unsubscribe after some time
    console.log('\nStep 6: Will unsubscribe from the first symbol after 30 seconds');
    
    // Wait for 30 seconds
    await sleep(30000);
    
    // Unsubscribe from the first symbol
    if (symbols.length > 0) {
      const symbol = symbols[0];
      const correlationId = `${symbol.exchange}_${symbol.token}`;
      
      try {
        await ws.unsubscribe(correlationId, symbol.exchange, symbol.token);
        console.log(`Unsubscribed from ${symbol.exchange}:${symbol.token}`);
      } catch (error) {
        console.error(`Failed to unsubscribe from ${symbol.exchange}:${symbol.token}:`, error);
      }
    }
    
    // STEP 7: Demonstrate reconnection
    console.log('\nStep 7: Will demonstrate reconnection after 60 seconds');
    
    // Wait for 60 seconds
    await sleep(60000);
    
    // Disconnect and reconnect
    console.log('Disconnecting from WebSocket server...');
    ws.disconnect();
    
    console.log('Reconnecting to WebSocket server after 5 seconds...');
    await sleep(5000);
    
    try {
      await ws.connect();
      console.log('Reconnected to WebSocket server');
      
      // Re-subscribe to all symbols after reconnection
      for (const symbol of symbols) {
        const correlationId = `${symbol.exchange}_${symbol.token}`;
        
        try {
          await ws.subscribe(correlationId, symbol.exchange, symbol.token, FeedMode.QUOTE);
          console.log(`Re-subscribed to ${symbol.exchange}:${symbol.token}`);
        } catch (error) {
          console.error(`Failed to re-subscribe to ${symbol.exchange}:${symbol.token}:`, error);
        }
        
        // Add a small delay between subscriptions
        await sleep(1000);
      }
    } catch (error) {
      console.error('Failed to reconnect to WebSocket server:', error);
    }
    
    // STEP 8: Keep the connection alive
    console.log('\nStep 8: Keeping connection alive for 5 minutes');
    console.log('Press Ctrl+C to terminate the program');
    
    // Keep the connection alive for 5 minutes
    await sleep(5 * 60 * 1000);
    
    // STEP 9: Clean up and disconnect
    console.log('\nStep 9: Cleaning up and disconnecting');
    ws.disconnect();
    
    // Also logout from SmartAPI
    await smartApi.logout();
    console.log('Logged out from SmartAPI');
    
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('WebSocket real-time data example completed'));