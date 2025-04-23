/**
 * Portfolio Management Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Get holdings with portfolio summary
 * 2. Get detailed position information
 * 3. Convert positions between product types
 * 4. Get funds and margins information
 */

import { 
  SmartAPI, 
  SmartAPIConfig,
  ProductType,
  TransactionType,
  Exchange,
  Position
} from '../src';

// Set debug to true to see detailed logs
const DEBUG = true;

/**
 * Main function to demonstrate portfolio management
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

    // Example 1: Get basic holdings
    console.log('\n1. Getting basic holdings information');
    const holdingsResponse = await smartApi.getHoldings();
    console.log('Holdings count:', holdingsResponse.data?.length || 0);
    if (holdingsResponse.data && holdingsResponse.data.length > 0) {
      // Print first holding as an example
      console.log('Sample holding:', holdingsResponse.data[0]);
    }

    // Example 2: Get comprehensive holdings with portfolio summary
    console.log('\n2. Getting comprehensive holdings with portfolio summary');
    const allHoldingsResponse = await smartApi.getAllHoldings();
    console.log('All holdings response:');
    
    if (allHoldingsResponse.data) {
      // Individual holdings
      console.log('- Individual holdings count:', 
        allHoldingsResponse.data.holdings?.length || 0);
      
      // Portfolio summary
      if (allHoldingsResponse.data.totalholding) {
        const summary = allHoldingsResponse.data.totalholding;
        console.log('- Portfolio summary:');
        console.log('  Total investment value:', summary.totalinvvalue);
        console.log('  Total current value:', summary.totalholdingvalue);
        console.log('  Total PNL:', summary.totalprofitandloss);
        console.log('  PNL percentage:', summary.totalpnlpercentage, '%');
      }
    }

    // Example 3: Get position information
    console.log('\n3. Getting positions information');
    const positionsResponse = await smartApi.getPositions();
    console.log('Positions count:', positionsResponse.data?.length || 0);
    
    if (positionsResponse.data && positionsResponse.data.length > 0) {
      // Print first position as an example
      console.log('Sample position:', positionsResponse.data[0]);
    }

    // Example 4: Convert position (change product type)
    console.log('\n4. Converting position (product type)');
    
    // Check if we have positions to convert
    let positionToConvert: Position | undefined = undefined;
    if (positionsResponse.data && positionsResponse.data.length > 0) {
      // Find an intraday position that can be converted to delivery
      positionToConvert = positionsResponse.data.find(p => 
        p.producttype === 'INTRADAY' && p.netqty !== '0');
    }
    
    if (positionToConvert) {
      const conversionParams = {
        exchange: positionToConvert.exchange,
        symboltoken: positionToConvert.symboltoken,
        tradingsymbol: positionToConvert.tradingsymbol,
        oldproducttype: ProductType.INTRADAY,
        newproducttype: ProductType.DELIVERY,
        transactiontype: parseInt(positionToConvert.netqty) > 0 
          ? TransactionType.BUY 
          : TransactionType.SELL,
        quantity: Math.abs(parseInt(positionToConvert.netqty)),
        type: 'DAY' // Required field for position conversion
      };
      
      console.log('Conversion parameters:', conversionParams);
      const conversionResponse = await smartApi.convertPosition(conversionParams);
      console.log('Position conversion response:', conversionResponse);
    } else {
      console.log('No suitable position found for conversion demonstration');
      console.log('To convert a position, you would need:');
      console.log(`
      const conversionParams = {
        exchange: 'NSE',                // Exchange where the position is held
        symboltoken: '3045',            // Symbol token for the position
        tradingsymbol: 'SBIN-EQ',       // Trading symbol
        oldproducttype: ProductType.INTRADAY,     // Current product type
        newproducttype: ProductType.DELIVERY,     // Target product type
        transactiontype: TransactionType.BUY,     // Transaction type (BUY/SELL)
        quantity: 1,                    // Quantity to convert
        type: 'DAY'                     // Type (DAY required)
      };
      
      const conversionResponse = await smartApi.convertPosition(conversionParams);
      `);
    }

    // Example 5: Get funds and margin details (RMS limits)
    console.log('\n5. Getting funds and margin details (RMS data)');
    const fundsResponse = await smartApi.getFunds();
    
    if (fundsResponse.data) {
      console.log('Funds and margin information:');
      
      // Net cash available for trading
      if (fundsResponse.data.net) {
        console.log('- Net cash available for trading:', fundsResponse.data.net);
      }
      
      // Available margin for different segments
      console.log('- Available margins:');
      if (fundsResponse.data.availablelimitmargin) {
        console.log('  Equity segment limit margin:', fundsResponse.data.availablelimitmargin);
      }
      
      if (fundsResponse.data.availablecash) {
        console.log('  Available cash:', fundsResponse.data.availablecash);
      }
      
      // Other margin information
      console.log('- Additional margin information:');
      if (fundsResponse.data.utilisedspan) {
        console.log('  Utilized SPAN margin:', fundsResponse.data.utilisedspan);
      }
      
      if (fundsResponse.data.utilisedexposure) {
        console.log('  Utilized exposure:', fundsResponse.data.utilisedexposure);
      }
      
      if (fundsResponse.data.collateral) {
        console.log('  Collateral value:', fundsResponse.data.collateral);
      }
    } else {
      console.log('No funds data available');
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
main().then(() => console.log('Portfolio management example completed'));