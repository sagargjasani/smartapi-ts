/**
 * Order Management Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Place different types of orders (market, limit, SL, bracket, cover)
 * 2. Modify existing orders
 * 3. Cancel orders
 * 4. Get order book
 * 5. Get trade book
 * 6. Get order details
 * 7. Create, modify and cancel GTT (Good Till Triggered) orders
 */

import { 
  SmartAPI, 
  SmartAPIConfig,
  OrderParams,
  BracketOrderParams,
  CoverOrderParams, 
  OrderType,
  TransactionType,
  ProductType,
  Variety,
  Validity,
  Exchange,
} from '../src';

// Import the GTTStatus enum directly from types
import { GTTStatus } from '../src/types';

// Set debug to true to see detailed logs
const DEBUG = true;

/**
 * Main function to demonstrate order management
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
    // Replace with actual credentials
    console.log('\nLogging in...');
    const loginResponse = await smartApi.login('YOUR_PASSWORD', 'YOUR_TOTP');
    
    if (!loginResponse.status) {
      console.error('Login failed:', loginResponse.message);
      return;
    }
    console.log('Login successful');

    // Example 1: Place a market order
    console.log('\n1. Placing a market order');
    const marketOrderParams: OrderParams = {
      symboltoken: '3045',             // SBIN
      exchange: Exchange.NSE,          // NSE
      tradingsymbol: 'SBIN-EQ',        // Trading symbol
      quantity: 1,                     // Quantity to buy/sell
      price: 0,                        // Price (0 for market order)
      producttype: ProductType.INTRADAY, // INTRADAY (MIS)
      transactiontype: TransactionType.BUY, // BUY
      ordertype: OrderType.MARKET,     // MARKET
      variety: Variety.NORMAL,         // NORMAL
      validity: Validity.DAY,          // DAY
      ordertag: 'API_TEST_ORDER',      // Optional tag for your reference
      disclosedquantity: 0             // Optional disclosed quantity
    };
    
    const marketOrderResponse = await smartApi.placeOrder(marketOrderParams);
    console.log('Market order response:', marketOrderResponse);
    const orderId = marketOrderResponse.data?.orderid;
    
    // Example 2: Place a limit order
    console.log('\n2. Placing a limit order');
    const limitOrderParams: OrderParams = {
      ...marketOrderParams,
      ordertype: OrderType.LIMIT,      // LIMIT
      price: 450.00,                    // Set a limit price
    };
    
    const limitOrderResponse = await smartApi.placeOrder(limitOrderParams);
    console.log('Limit order response:', limitOrderResponse);
    const limitOrderId = limitOrderResponse.data?.orderid;
    
    // Example 3: Place a stop-loss order
    console.log('\n3. Placing a stop-loss limit order');
    const stopLossOrderParams: OrderParams = {
      ...marketOrderParams,
      ordertype: OrderType.STOPLOSS_LIMIT, // STOPLOSS_LIMIT
      price: 445.00,                   // Limit price
      triggerprice: 447.00,            // Trigger price
    };
    
    const slOrderResponse = await smartApi.placeOrder(stopLossOrderParams);
    console.log('Stop-loss order response:', slOrderResponse);
    
    // Example 4: Place a bracket order (BO)
    console.log('\n4. Placing a bracket order');
    const bracketOrderParams: BracketOrderParams = {
      ...marketOrderParams,
      ordertype: OrderType.LIMIT,      // LIMIT
      price: 445.00,                   // Limit price
      squareoff: 10,                   // Target profit points
      stoploss: 5,                     // Stop loss points
      variety: Variety.ROBO,           // ROBO variety for bracket orders
      trailingStoploss: 1              // Optional trailing stoploss points
    };
    
    const boOrderResponse = await smartApi.placeBracketOrder(bracketOrderParams);
    console.log('Bracket order response:', boOrderResponse);
    
    // Example 5: Place a cover order (CO)
    console.log('\n5. Placing a cover order');
    const coverOrderParams: CoverOrderParams = {
      ...marketOrderParams,
      ordertype: OrderType.LIMIT,       // LIMIT
      price: 445.00,                    // Limit price
      triggerprice: 440.00,             // Stop loss trigger price
      variety: Variety.NORMAL           // Normal variety for cover orders
    };
    
    const coOrderResponse = await smartApi.placeCoverOrder(coverOrderParams);
    console.log('Cover order response:', coOrderResponse);
    
    // Example 6: Modify an existing order
    console.log('\n6. Modifying an existing order');
    if (limitOrderId) {
      // Copy all original parameters plus the orderid
      const modifyParams: OrderParams & { orderid: string } = {
        ...limitOrderParams,
        orderid: limitOrderId,
        price: 455.00,                  // New price
        quantity: 1,                    // New quantity
      };
      
      const modifyResponse = await smartApi.modifyOrder(modifyParams);
      console.log('Modify order response:', modifyResponse);
    } else {
      console.log('No order ID available to modify');
    }
    
    // Example 7: Get order book
    console.log('\n7. Getting order book');
    const orderBookResponse = await smartApi.getOrderBook();
    console.log('Order book response:', orderBookResponse);
    
    // Example 8: Get trade book
    console.log('\n8. Getting trade book');
    const tradeBookResponse = await smartApi.getTradeBook();
    console.log('Trade book response:', tradeBookResponse);
    
    // Example 9: Get order details
    console.log('\n9. Getting order details');
    if (orderId) {
      const orderDetailsResponse = await smartApi.getOrderDetails(orderId);
      console.log('Order details response:', orderDetailsResponse);
    } else {
      console.log('No order ID available to get details');
    }
    
    // Example 10: Cancel an order
    console.log('\n10. Cancelling an order');
    if (limitOrderId) {
      // Cancel order requires variety parameter
      const cancelResponse = await smartApi.cancelOrder(limitOrderId, Variety.NORMAL);
      console.log('Cancel order response:', cancelResponse);
    } else {
      console.log('No order ID available to cancel');
    }
    
    // Example 11: Create a GTT (Good Till Triggered) rule
    console.log('\n11. Creating a GTT rule');
    const gttCreateParams = {
      tradingsymbol: 'SBIN-EQ',
      symboltoken: '3045',
      exchange: Exchange.NSE,
      producttype: ProductType.DELIVERY,
      transactiontype: TransactionType.BUY,
      price: '440',
      qty: '1',
      triggerprice: '430',              // Buy when price falls to 430
      disclosedqty: '0',
    };
    
    const gttCreateResponse = await smartApi.createGTT(gttCreateParams);
    console.log('GTT create response:', gttCreateResponse);
    const gttId = gttCreateResponse.data?.id;
    
    // Example 12: Modify a GTT rule
    console.log('\n12. Modifying a GTT rule');
    if (gttId) {
      const gttModifyParams = {
        id: gttId,
        symboltoken: '3045',
        exchange: Exchange.NSE,
        triggerprice: '425',           // New trigger price
        qty: '2',                      // New quantity
        price: '440',                  // Order price
        disclosedqty: '0'              // Disclosed quantity
      };
      
      const gttModifyResponse = await smartApi.modifyGTT(gttModifyParams);
      console.log('GTT modify response:', gttModifyResponse);
    } else {
      console.log('No GTT ID available to modify');
    }
    
    // Example 13: Get GTT rule details
    console.log('\n13. Getting GTT rule details');
    if (gttId) {
      // Fix: Pass the ID directly as a string, not as an object
      const gttDetailsResponse = await smartApi.getGTTDetails(gttId);
      console.log('GTT details response:', gttDetailsResponse);
    } else {
      console.log('No GTT ID available to get details');
    }
    
    // Example 14: Get list of GTT rules
    console.log('\n14. Getting GTT rule list');
    const gttListParams = {
      status: [GTTStatus.ACTIVE],     // Array of statuses to filter
      page: 1,                        // Page number
      count: 10                       // Number of records per page
    };
    
    const gttListResponse = await smartApi.getGTTList(gttListParams);
    console.log('GTT list response:', gttListResponse);
    
    // Example 15: Cancel a GTT rule
    console.log('\n15. Cancelling a GTT rule');
    if (gttId) {
      const gttCancelParams = {
        id: gttId,
        symboltoken: '3045',
        exchange: Exchange.NSE
      };
      const gttCancelResponse = await smartApi.cancelGTT(gttCancelParams);
      console.log('GTT cancel response:', gttCancelResponse);
    } else {
      console.log('No GTT ID available to cancel');
    }
    
    // Logout
    console.log('\nLogging out...');
    await smartApi.logout();
    console.log('Logout successful');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('Order management example completed'));