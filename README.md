# Angel One SmartAPI TypeScript Library

A comprehensive TypeScript wrapper for the Angel One SmartAPI broker API. This library provides a simple and intuitive interface to interact with Angel One's trading platform.

## Installation

```bash
pnpm add angelone-smartapi-ts
```

or using npm:

```bash
npm install angelone-smartapi-ts
```

or using yarn:

```bash
yarn add angelone-smartapi-ts
```

## Usage

### Initialize SmartAPI

```typescript
import { SmartAPI, SmartAPIConfig } from 'angelone-smartapi-ts';

// Configure the API client
const config: SmartAPIConfig = {
  apiKey: 'YOUR_API_KEY',
  clientId: 'YOUR_CLIENT_ID',
  debug: true // Enable for detailed logs
};

// Initialize
const smartApi = new SmartAPI(config);
```

### Authentication

```typescript
// Login with password (and optional TOTP)
const loginResponse = await smartApi.login('YOUR_PASSWORD', 'TOTP_IF_ENABLED');
console.log(loginResponse);

// Alternatively, if you already have tokens:
const sessionResponse = await smartApi.generateSession('YOUR_JWT_TOKEN', 'YOUR_REFRESH_TOKEN');
console.log(sessionResponse);
```

### Get User Profile

```typescript
const profileResponse = await smartApi.getProfile();
console.log(profileResponse);
```

### Place an Order

```typescript
import { OrderType, TransactionType, ProductType, Variety, OrderParams } from 'angelone-smartapi-ts';

// Prepare order parameters
const orderParams: OrderParams = {
  symboltoken: '3045',
  exchange: 'NSE',
  tradingsymbol: 'SBIN-EQ',
  quantity: 1,
  price: 0,
  producttype: ProductType.INTRADAY,
  transactiontype: TransactionType.BUY,
  ordertype: OrderType.MARKET,
  variety: Variety.NORMAL,
  validity: 'DAY'
};

// Place order
const orderResponse = await smartApi.placeOrder(orderParams);
console.log(orderResponse);
```

### Get Order Book

```typescript
const orderBook = await smartApi.getOrderBook();
console.log(orderBook);
```

### Get Holdings

```typescript
const holdings = await smartApi.getHoldings();
console.log(holdings);
```

### Get Positions

```typescript
const positions = await smartApi.getPositions();
console.log(positions);
```

### Get LTP (Last Traded Price)

```typescript
const ltpResponse = await smartApi.getLTP('NSE', '3045', 'SBIN-EQ');
console.log(ltpResponse);
```

### Logout

```typescript
const logoutResponse = await smartApi.logout();
console.log(logoutResponse);
```

## WebSocket for Real-time Market Data

```typescript
import { SmartAPIWebSocket, FeedMode } from 'angelone-smartapi-ts';

// Initialize WebSocket client
const ws = new SmartAPIWebSocket(
  'YOUR_API_KEY',
  'YOUR_CLIENT_ID',
  'YOUR_FEED_TOKEN',
  true // Enable debug logs
);

// Connect to WebSocket server
ws.connect()
  .then(() => {
    console.log('Connected to WebSocket server');

    // Subscribe to a symbol
    return ws.subscribe(
      'CORRELATION_ID', // Any unique ID for this subscription
      'NSE',            // Exchange
      '3045',           // Symbol token
      FeedMode.FULL     // Data mode (FULL, LTP, QUOTE)
    );
  })
  .then(() => {
    // Listen for market data ticks
    ws.on('tick', (data) => {
      console.log('Market data received:', data);
    });

    // Listen for specific subscription
    ws.on('tick:CORRELATION_ID', (data) => {
      console.log('Data for specific subscription:', data);
    });

    // Later, unsubscribe if needed
    setTimeout(() => {
      ws.unsubscribe('CORRELATION_ID', 'NSE', '3045')
        .then(() => console.log('Unsubscribed'))
        .catch(console.error);
    }, 60000);
  })
  .catch(console.error);

// Handle connection events
ws.on('connect', () => console.log('WebSocket connected'));
ws.on('disconnect', (reason) => console.log('WebSocket disconnected:', reason));
ws.on('error', (error) => console.log('WebSocket error:', error));
```

## Error Handling

All API methods return a consistent response structure:

```typescript
{
  status: boolean,   // true for success, false for failure
  message: string,   // Success or error message
  errorcode?: string, // Error code if applicable
  data?: any         // Response data if successful
}
```

### Comprehensive Error Codes

This library includes comprehensive error code handling with detailed information about each error:

```typescript
import { ERROR_CODES, isAuthenticationError, isOrderError, getErrorDescription } from 'angelone-smartapi-ts';

const response = await smartApi.placeOrder(orderParams);
if (!response.status) {
  // Check specific error types
  if (response.errorcode && isAuthenticationError(response.errorcode)) {
    console.log('Authentication error - please login again');
  } 
  else if (response.errorcode && isOrderError(response.errorcode)) {
    console.log(`Order error: ${getErrorDescription(response.errorcode)}`);
  }
  else {
    console.log(`Error: ${response.message}`);
  }
}
```

### Automatic Token Refresh

The library automatically handles token expiration by refreshing the token and retrying the operation when possible:

```typescript
// This will automatically refresh the token if expired and retry
const profileResponse = await smartApi.getProfile();

// Token refresh will only happen when needed, so you don't need to handle
// AG8002 (Token Expired) or AB8051 (Refresh Token Expired) errors manually
```

### Complete Error Code List

Here's the complete list of error codes available in the library:

| Error Code | Description |
|------------|-------------|
| AG8001 | Invalid Token |
| AG8002 | Token Expired |
| AG8003 | Token missing |
| AB8050 | Invalid Refresh Token |
| AB8051 | Refresh Token Expired |
| AB1000 | Invalid Email Or Password |
| AB1001 | Invalid Email |
| AB1002 | Invalid Password Length |
| AB1003 | Client Already Exists |
| AB1004 | Something Went Wrong, Please Try After Sometime |
| AB1005 | User Type Must Be USER |
| AB1006 | Client Is Block For Trading |
| AB1007 | AMX Error |
| AB1008 | Invalid Order Variety |
| AB1009 | Symbol Not Found |
| AB1010 | AMX Session Expired |
| AB1011 | Client not login |
| AB1012 | Invalid Product Type |
| AB1013 | Order not found |
| AB1014 | Trade not found |
| AB1015 | Holding not found |
| AB1016 | Position not found |
| AB1017 | Position conversion failed |
| AB1018 | Failed to get symbol details |
| AB4008 | ordertag length should be less than 20 characters |
| AB2000 | Error not specified |
| AB2001 | Internal Error, Please Try After Sometime |
| AB1031 | Old Password Mismatch |
| AB1032 | User Not Found |
| AB2002 | ROBO order is block |

## API Reference

For a complete list of API endpoints and parameters, please refer to the [Angel One SmartAPI documentation](https://smartapi.angelbroking.com/docs).

## License

MIT