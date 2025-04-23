/**
 * Market Data Example for SmartAPI-TS
 * 
 * This example demonstrates how to:
 * 1. Get last traded price (LTP)
 * 2. Get market quotes in various modes
 * 3. Get historical candle data
 * 4. Get historical Open Interest (OI) data
 * 5. Get option greeks
 * 6. Get top gainers and losers
 * 7. Search for scrips
 * 8. Get intraday scrips
 */

import { 
  SmartAPI, 
  SmartAPIConfig, 
  HistoricalInterval,
  MarketData
} from '../src';

// Import the enums directly from the types file
import {
  MarketDataMode,
  GainersLosersDataType,
  ExpiryType
} from '../src/types';

// Set debug to true to see detailed logs
const DEBUG = true;

/**
 * Main function to demonstrate market data operations
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

    // Example 1: Get Last Traded Price (LTP) - single symbol
    console.log('\n1. Getting LTP for a single symbol (Legacy method)');
    const ltpResponse = await smartApi.getLTP('NSE', '3045', 'SBIN-EQ');
    console.log('LTP response:', ltpResponse);

    // Example 2: Get LTP data for multiple symbols
    console.log('\n2. Getting LTP for multiple symbols (Preferred method)');
    const ltpMultiResponse = await smartApi.marketData.getLTPData({
      'NSE': ['3045', '1594'], // SBIN, INFY
      'BSE': ['500112', '500209'] // SBIN, INFY on BSE
    });
    console.log('Multiple LTP response:', ltpMultiResponse);

    // Example 3: Get OHLC data
    console.log('\n3. Getting OHLC data for symbols');
    const ohlcResponse = await smartApi.marketData.getOHLCData({
      'NSE': ['3045'], // SBIN
      'BSE': ['500112'] // SBIN on BSE
    });
    console.log('OHLC data response:', ohlcResponse);

    // Example 4: Get full market data with depth
    console.log('\n4. Getting full market data with depth');
    const fullQuoteResponse = await smartApi.marketData.getFullQuote({
      'NSE': ['3045'], // SBIN
    });
    console.log('Full quote response:', fullQuoteResponse);

    // Example 5: Get historical candle data
    console.log('\n5. Getting historical candle data');
    const now = new Date();
    const pastDate = new Date();
    pastDate.setMonth(now.getMonth() - 1); // One month ago
    
    const historicalDataParams = {
      exchange: 'NSE',
      symboltoken: '3045', // SBIN
      interval: HistoricalInterval.ONE_DAY,
      fromdate: pastDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      todate: now.toISOString().split('T')[0]
    };
    
    const historicalResponse = await smartApi.getHistoricalData(historicalDataParams);
    console.log('Historical data response:', historicalResponse);

    // Example 6: Get historical data with pagination (for large date ranges)
    console.log('\n6. Getting historical data with pagination');
    const longPastDate = new Date();
    longPastDate.setFullYear(now.getFullYear() - 1); // One year ago
    
    const paginatedParams = {
      ...historicalDataParams,
      fromdate: longPastDate.toISOString().split('T')[0],
    };
    
    const paginatedHistoricalResponse = await smartApi.getHistoricalDataPaginated(paginatedParams);
    console.log('Paginated historical data count:', paginatedHistoricalResponse.data?.length || 0);

    // Example 7: Get historical Open Interest data (for F&O)
    console.log('\n7. Getting historical Open Interest data');
    const oiParams = {
      exchange: 'NFO',
      symboltoken: '58665', // Example: NIFTY 50 futures
      interval: HistoricalInterval.ONE_DAY,
      fromdate: pastDate.toISOString().split('T')[0],
      todate: now.toISOString().split('T')[0]
    };
    
    const oiResponse = await smartApi.marketData.getHistoricalOIData(oiParams);
    console.log('Historical OI data response:', oiResponse);

    // Example 8: Get option greeks
    console.log('\n8. Getting option greeks');
    const optionGreeksParams = {
      name: 'BANKNIFTY', // Underlying
      expirydate: '2025-05-29' // Replace with a valid expiry date
    };
    
    const greeksResponse = await smartApi.getOptionGreeks(optionGreeksParams);
    console.log('Option greeks response:', greeksResponse);

    // Example 9: Get top gainers
    console.log('\n9. Getting top gainers');
    const gainersParams = {
      datatype: GainersLosersDataType.PRICE_GAINERS, // Price Gainers
      expirytype: ExpiryType.NEAR // Current month expiry
    };
    
    const gainersResponse = await smartApi.marketData.getGainersLosers(gainersParams);
    console.log('Top gainers response:', gainersResponse);

    // Example 10: Get top losers
    console.log('\n10. Getting top losers');
    const losersParams = {
      datatype: GainersLosersDataType.PRICE_LOSERS, // Price Losers
      expirytype: ExpiryType.NEAR // Current month expiry
    };
    
    const losersResponse = await smartApi.marketData.getGainersLosers(losersParams);
    console.log('Top losers response:', losersResponse);

    // Example 11: Search for scrips
    console.log('\n11. Searching for scrips');
    const searchResponse = await smartApi.searchScrip('NSE', 'SBIN');
    console.log('Search scrip response:', searchResponse);

    // Example 12: Get NSE intraday scrips
    console.log('\n12. Getting NSE intraday scrips');
    const nseIntradayResponse = await smartApi.getNseIntradayScrips();
    console.log('NSE intraday scrips count:', nseIntradayResponse.data?.length || 0);

    // Example 13: Get BSE intraday scrips
    console.log('\n13. Getting BSE intraday scrips');
    const bseIntradayResponse = await smartApi.getBseIntradayScrips();
    console.log('BSE intraday scrips count:', bseIntradayResponse.data?.length || 0);

    // Example 14: Get instrument list
    console.log('\n14. Getting instrument list');
    console.log('Note: This can take some time as it downloads a large JSON file');
    const instrumentResponse = await smartApi.getInstruments();
    console.log('Instrument list count:', instrumentResponse.data?.length || 0);

    // Logout
    console.log('\nLogging out...');
    await smartApi.logout();
    console.log('Logout successful');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
main().then(() => console.log('Market data example completed'));