# Angel One SmartAPI - TypeScript Library

A robust TypeScript client library for Angel One's SmartAPI trading platform. Perform stock market trading operations including authentication, order placement, portfolio management, and real-time market data access.

[![npm version](https://img.shields.io/npm/v/angelone-smartapi-ts.svg)](https://www.npmjs.com/package/angelone-smartapi-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- 💪 **Type Safety**: Written in TypeScript with full type definitions
- 🔐 **Authentication**: Login with password, TOTP, or automatic TOTP generation
- 📊 **Market Data**: Access market quotes, historical data, and real-time streaming
- 📝 **Order Management**: Place, modify, and cancel orders including bracket and cover orders
- 📂 **Portfolio**: Get positions, holdings, and funds information
- 🔔 **GTT**: Set up Good Till Triggered orders with precise conditions
- 💰 **Brokerage**: Calculate brokerage charges for trades
- 🔎 **Instruments**: Search and retrieve instrument details
- 🔄 **WebSockets**: Real-time market data streaming

## Installation

```bash
npm install angelone-smartapi-ts
```

or with yarn:

```bash
yarn add angelone-smartapi-ts
```

or with pnpm:

```bash
pnpm add angelone-smartapi-ts
```

## Quick Start

### Basic Authentication

```typescript
import { SmartAPI } from 'angelone-smartapi-ts';

// Initialize SmartAPI client
const smartApi = new SmartAPI({
  apiKey: 'YOUR_API_KEY',
  clientId: 'YOUR_CLIENT_ID',
  debug: true // Set to false in production
});

// Login with password (for accounts without 2FA)
async function login() {
  try {
    const loginResponse = await smartApi.login('YOUR_PASSWORD');
    console.log('Login successful:', loginResponse.status);
    
    // Get user profile
    const profile = await smartApi.getProfile();
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

login();
```

### Authentication with Manual TOTP

If you have two-factor authentication enabled on your Angel One account:

```typescript
import { SmartAPI } from 'angelone-smartapi-ts';

const smartApi = new SmartAPI({
  apiKey: 'YOUR_API_KEY',
  clientId: 'YOUR_CLIENT_ID'
});

async function loginWithTotp() {
  try {
    // You'll need to generate this code from your authenticator app
    const totp = '123456'; // Replace with your current TOTP code
    const loginResponse = await smartApi.login('YOUR_PASSWORD', totp);
    
    console.log('Login successful:', loginResponse.status);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

loginWithTotp();
```

### Authentication with Auto TOTP Generation

For automated systems, you can set up automatic TOTP generation using your TOTP secret:

```typescript
import { SmartAPI } from 'angelone-smartapi-ts';

// Initialize with your TOTP secret
const smartApi = new SmartAPI({
  apiKey: 'YOUR_API_KEY',
  clientId: 'YOUR_CLIENT_ID',
  totpSecret: 'YOUR_TOTP_SECRET' // The secret key used to generate TOTP codes
});

async function loginWithAutoTotp() {
  try {
    // No TOTP code needed - will be generated automatically
    const loginResponse = await smartApi.login('YOUR_PASSWORD');
    
    console.log('Login with auto TOTP successful:', loginResponse.status);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

loginWithAutoTotp();
```

> **Note**: You receive the TOTP secret only once when setting up 2FA with Angel One. Make sure to store this securely. Generate totp secret by going https://smartapi.angelbroking.com/enable-totp

## Market Data

### Getting LTP (Last Traded Price)

```typescript
// Get LTP for a single instrument
const ltpData = await smartApi.getLTP({
  exchange: 'NSE',
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885'
});

// Get multiple LTP values
const multiLtpData = await smartApi.getMultiLTP([
  {
    exchange: 'NSE',
    tradingSymbol: 'RELIANCE-EQ',
    symbolToken: '2885'
  },
  {
    exchange: 'NSE',
    tradingSymbol: 'INFY-EQ',
    symbolToken: '1594'
  }
]);
```

### Historical Data

```typescript
const historicalData = await smartApi.getHistoricalData({
  exchange: 'NSE',
  symbolToken: '2885',
  interval: 'ONE_DAY',
  fromDate: '2023-04-01 09:15',
  toDate: '2023-04-30 15:30'
});
```

## Order Management

### Placing Orders

```typescript
// Place a regular order
const orderResponse = await smartApi.placeOrder({
  variety: 'NORMAL',
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  transactionType: 'BUY',
  exchange: 'NSE',
  orderType: 'LIMIT',
  productType: 'INTRADAY',
  duration: 'DAY',
  price: '2100',
  squareoff: '0',
  stoploss: '0',
  quantity: '1'
});

// Place a bracket order
const bracketOrderResponse = await smartApi.placeBracketOrder({
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  transactionType: 'BUY',
  exchange: 'NSE',
  orderType: 'LIMIT',
  productType: 'INTRADAY',
  duration: 'DAY',
  price: '2100',
  squareoff: '10',
  stoploss: '5',
  quantity: '1'
});

// Place a cover order
const coverOrderResponse = await smartApi.placeCoverOrder({
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  transactionType: 'BUY',
  exchange: 'NSE',
  orderType: 'LIMIT',
  productType: 'INTRADAY',
  duration: 'DAY',
  price: '2100',
  coverPrice: '2050',
  quantity: '1'
});
```

### Order Management

```typescript
// Modify an existing order
const modifyResponse = await smartApi.modifyOrder({
  variety: 'NORMAL',
  orderType: 'LIMIT',
  orderID: '230428000000072',
  price: '2110',
  quantity: '1'
});

// Cancel an order
const cancelResponse = await smartApi.cancelOrder({
  variety: 'NORMAL',
  orderID: '230428000000072'
});

// Get order book
const orderBook = await smartApi.getOrderBook();

// Get trade book
const tradeBook = await smartApi.getTradeBook();
```

## Portfolio Management

```typescript
// Get current positions
const positions = await smartApi.getPositions();

// Get holdings
const holdings = await smartApi.getHoldings();

// Get all holdings including pledged holdings
const allHoldings = await smartApi.getAllHoldings();

// Get funds and margins
const funds = await smartApi.getFunds();

// Convert position (for example from INTRADAY to DELIVERY)
const convertResponse = await smartApi.convertPosition({
  exchange: 'NSE',
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  transactionType: 'BUY',
  positionType: 'DAY',
  quantityToConvert: '1',
  fromProductType: 'INTRADAY',
  toProductType: 'DELIVERY'
});
```

## WebSockets for Real-Time Data

```typescript
import { SmartAPI, SmartWebSocket } from 'angelone-smartapi-ts';

// First authenticate with SmartAPI
const smartApi = new SmartAPI({
  apiKey: 'YOUR_API_KEY',
  clientId: 'YOUR_CLIENT_ID'
});

// Login
await smartApi.login('YOUR_PASSWORD', 'YOUR_TOTP');

// Initialize WebSocket
const ws = new SmartWebSocket({
  feedToken: smartApi.auth.getFeedToken(),
  clientId: 'YOUR_CLIENT_ID',
  apiKey: 'YOUR_API_KEY',
  debug: true
});

// Connect to WebSocket
ws.connect()
  .then(() => {
    // Subscribe to tokens
    ws.subscribe([
      { action: 'SUBSCRIBE', feedType: 'LTP', scriptToken: '2885' },
      { action: 'SUBSCRIBE', feedType: 'DEPTH', scriptToken: '1594' }
    ]);
  })
  .catch(err => {
    console.error('WebSocket connection error:', err);
  });

// Handle messages
ws.on('message', message => {
  console.log('WebSocket message:', message);
});

// Handle connection close
ws.on('close', (code, reason) => {
  console.log('WebSocket closed:', code, reason);
});

// Handle errors
ws.on('error', error => {
  console.error('WebSocket error:', error);
});

// Disconnect when done
// ws.disconnect();
```

## GTT (Good Till Triggered) Orders

```typescript
// Create a GTT rule
const gttCreateResponse = await smartApi.createGTT({
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  exchange: 'NSE',
  productType: 'DELIVERY',
  transactionType: 'BUY',
  price: '2100',
  quantity: '1',
  triggerType: 'SINGLE',
  triggerPrice: '2090',
  limitPrice: '2100'
});

// Modify a GTT rule
const gttModifyResponse = await smartApi.modifyGTT({
  id: '123456',
  tradingSymbol: 'RELIANCE-EQ',
  symbolToken: '2885',
  exchange: 'NSE',
  productType: 'DELIVERY',
  transactionType: 'BUY',
  price: '2110',
  quantity: '1',
  triggerType: 'SINGLE',
  triggerPrice: '2100',
  limitPrice: '2110'
});

// Cancel a GTT rule
const gttCancelResponse = await smartApi.cancelGTT({
  id: '123456',
  symbolToken: '2885',
  exchange: 'NSE'
});

// Get GTT rule details
const gttDetails = await smartApi.getGTTDetails({ id: '123456' });

// Get list of GTT rules
const gttList = await smartApi.getGTTList();
```

## Error Handling

The library uses a consistent error handling pattern:

```typescript
try {
  const response = await smartApi.placeOrder({
    // Order parameters
  });
  
  if (response.status) {
    console.log('Order placed successfully:', response.data);
  } else {
    console.log('Order placement failed:', response.message);
  }
} catch (error) {
  console.error('An error occurred:', error);
}
```

## Token Management

The library handles token refresh automatically. You can also manually manage tokens:

```typescript
// Initialize with existing tokens
const smartApi = new SmartAPI({
  apiKey: 'YOUR_API_KEY',
  jwtToken: 'YOUR_JWT_TOKEN', 
  refreshToken: 'YOUR_REFRESH_TOKEN'
});

// Generate a new session with tokens
const sessionResponse = await smartApi.generateSession();
```

## License

[MIT](LICENSE)