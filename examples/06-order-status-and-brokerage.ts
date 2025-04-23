/**
 * Order Status and Brokerage Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Connect to the Order Status WebSocket for real-time order updates
 * 2. Calculate brokerage charges for orders
 * 3. Calculate margin requirements
 */

import { 
  SmartAPI, 
  SmartAPIConfig,
  OrderStatusWebSocket,
  OrderType,
  ProductType,
  TransactionType,
  Exchange
} from '../src';

// Import order status enums from types
import { OrderStatusCode } from '../src/types';

// Set debug to true to see detailed logs
const DEBUG = true;

// This function is used to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to demonstrate order status and brokerage functionality
 */
async function main() {
  try {
    // Initialize SmartAPI
    const config: SmartAPIConfig = {
      apiKey: 'YOUR_API_KEY',
      clientId: 'YOUR_CLIENT_ID',
      debug: DEBUG,
    };
    
    const smartApi = new SmartAPI(config);
    console.log('SmartAPI client initialized');
    
    // Login first (required for all operations)
    console.log('\nLogging in...');
    const loginResponse = await smartApi.login('YOUR_PASSWORD', 'YOUR_TOTP');
    
    if (!loginResponse.status) {
      console.error('Login failed:', loginResponse.message);
      return;
    }
    console.log('Login successful');

    // Example 1: Calculate brokerage for orders
    console.log('\n1. Calculating brokerage for orders');

    // Calculate brokerage for an equity intraday order
    const brokerageCalculatorParams = {
      orders: [
        {
          product_type: 'INTRADAY', // Product type (INTRADAY, DELIVERY, etc.)
          transaction_type: 'BUY',   // Transaction type (BUY or SELL)
          quantity: '10',           // Quantity as string
          price: '450.00',           // Price as string
          exchange: 'NSE',          // Exchange
          symbol_name: 'SBIN-EQ',   // Symbol name
          token: '3045'             // Token
        }
      ]
    };
    
    const brokerageResponse = await smartApi.calculateBrokerage(brokerageCalculatorParams);
    console.log('Brokerage calculation response:', brokerageResponse);

    if (brokerageResponse.data && brokerageResponse.data.summary) {
      console.log('Total charges:', brokerageResponse.data.summary.total_charges);
      console.log('Trade value:', brokerageResponse.data.summary.trade_value);
      
      // Show charge breakup if available
      if (brokerageResponse.data.summary.breakup) {
        console.log('\nCharge breakup:');
        brokerageResponse.data.summary.breakup.forEach(item => {
          console.log(`- ${item.name}: ${item.amount}`);
        });
      }
    }

    // Example 2: Calculate margin requirement for a position
    console.log('\n2. Calculating margin requirement for a position');
    const marginCalculatorParams = {
      positions: [
        {
          exchange: 'NSE',
          qty: 10,
          price: 450.0, 
          productType: ProductType.INTRADAY,
          token: '3045',
          tradeType: TransactionType.BUY,
          orderType: OrderType.MARKET
        }
      ]
    };
    
    const marginResponse = await smartApi.calculateMargin(marginCalculatorParams);
    console.log('Margin calculation response:', marginResponse);

    if (marginResponse.data) {
      console.log('Total margin required:', marginResponse.data.totalMarginRequired);
      
      // Show margin components if available
      if (marginResponse.data.marginComponents) {
        console.log('\nMargin components:');
        const components = marginResponse.data.marginComponents;
        console.log('- Net premium:', components.netPremium);
        console.log('- SPAN margin:', components.spanMargin);
        console.log('- Margin benefit:', components.marginBenefit);
        console.log('- Delivery margin:', components.deliveryMargin);
        console.log('- Non-NFO margin:', components.nonNFOMargin);
        console.log('- Total options premium:', components.totOptionsPremium);
      }
    }

    // Example 3: Set up Order Status WebSocket for real-time order updates
    console.log('\n3. Setting up Order Status WebSocket for real-time order updates');
    const jwtToken = loginResponse.data?.jwtToken;
    
    if (!jwtToken) {
      console.error('JWT token not available');
      return;
    }

    // Initialize the Order Status WebSocket
    const orderStatusWs = new OrderStatusWebSocket(jwtToken, DEBUG);

    // Set up event handlers
    orderStatusWs.on('connected', () => {
      console.log('Order Status WebSocket connected');
      console.log('Client Code:', orderStatusWs.getClientCode());
    });

    orderStatusWs.on('disconnect', (reason) => {
      console.log('Order Status WebSocket disconnected:', reason);
    });

    orderStatusWs.on('error', (error) => {
      console.error('Order Status WebSocket error:', error);
    });

    // Handle order updates
    orderStatusWs.on('order-update', (data) => {
      console.log('Order update received:', data);
    });

    // Handle specific order statuses
    orderStatusWs.on(`order-${OrderStatusCode.OPEN}`, (data) => {
      console.log('Order opened:', data.orderData?.orderid);
    });

    orderStatusWs.on(`order-${OrderStatusCode.COMPLETE}`, (data) => {
      console.log('Order completed:', data.orderData?.orderid);
    });

    // Connect to the WebSocket server
    console.log('Connecting to Order Status WebSocket...');
    try {
      await orderStatusWs.connect();
    } catch (error) {
      console.error('Failed to connect to Order Status WebSocket:', error);
    }

    // Example 4: Place an order to see real-time order updates
    console.log('\n4. Placing an order to see real-time order updates');
    console.log('You can place an order using SmartAPI mobile app or website to see real-time updates here.');
    
    // Wait for 2 minutes to receive order updates
    console.log('Waiting for order updates for 2 minutes...');
    console.log('You can place orders during this time to see real-time updates.');
    console.log('Press Ctrl+C to terminate the program.');
    
    // Wait for 2 minutes
    await sleep(2 * 60 * 1000);
    
    // Disconnect from the WebSocket
    console.log('\nDisconnecting from Order Status WebSocket...');
    orderStatusWs.disconnect();
    
    // Logout
    console.log('\nLogging out...');
    await smartApi.logout();
    console.log('Logout successful');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('Order status and brokerage example completed'));