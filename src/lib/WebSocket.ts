import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { API_URLS } from '../constants/apiUrls';
import { ApiResponse } from '../types';

/**
 * WebSocket feed modes according to WebSocket Streaming 2.0 specification
 */
export enum FeedMode {
  LTP = 1,        // Last traded price only
  QUOTE = 2,      // Quote data (OHLC, LTP, etc.)
  SNAP_QUOTE = 3, // Snap quote (includes best 5 prices)
  DEPTH_20 = 4    // 20 depth (only for NSE_CM)
}

/**
 * Exchange types for WebSocket API
 */
export enum ExchangeType {
  NSE_CM = 1,  // NSE Cash Market
  NSE_FO = 2,  // NSE Futures & Options
  BSE_CM = 3,  // BSE Cash Market
  BSE_FO = 4,  // BSE Futures & Options
  MCX_FO = 5,  // MCX Futures & Options
  NCX_FO = 7,  // NCX Futures & Options 
  CDE_FO = 13  // CDE Futures & Options
}

/**
 * Action types for WebSocket commands
 */
enum Action {
  UNSUBSCRIBE = 0,
  SUBSCRIBE = 1
}

/**
 * WebSocket connection states
 */
enum ConnectionState {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTING = 3,
  DISCONNECTED = 4,
  ERROR = 5
}

/**
 * WebSocket client subscription data structure
 */
interface SubscriptionData {
  correlationId: string;
  exchangeType: ExchangeType;
  token: string;
  feedMode: FeedMode;
}

/**
 * WebSocket request payload structure based on WebSocket Streaming 2.0
 */
interface WebSocketRequest {
  correlationID: string;
  action: number;
  params: {
    mode: number;
    tokenList: Array<{
      exchangeType: number;
      tokens: string[];
    }>;
  };
}

/**
 * Authentication credentials structure
 */
interface AuthCredentials {
  apiKey: string;
  clientCode: string;
  feedToken: string;
  jwtToken: string;
}

/**
 * SmartAPI WebSocket client for real-time market data
 * Implementation based on WebSocket Streaming 2.0 specification
 */
export class SmartAPIWebSocket extends EventEmitter {
  private apiKey: string;
  private clientCode: string;
  private feedToken: string;
  private jwtToken: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private subscriptions: Map<string, SubscriptionData> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private debug: boolean = false;
  private pendingSubscriptions: Array<SubscriptionData> = [];
  private isBrowser: boolean = false;

  /**
   * Initialize a new SmartAPIWebSocket client
   * @param apiKey API key provided by Angel One
   * @param clientCode Client code/user id for Angel One
   * @param feedToken Feed token for WebSocket authentication
   * @param jwtToken JWT token from login API (auth token)
   * @param debug Enable debug logging
   */
  constructor(
    apiKey: string, 
    clientCode: string, 
    feedToken: string, 
    jwtToken: string,
    debug: boolean = false
  ) {
    super();
    this.apiKey = apiKey;
    this.clientCode = clientCode;
    this.feedToken = feedToken;
    this.jwtToken = jwtToken;
    this.wsUrl = API_URLS.WEBSOCKET;
    this.debug = debug;
    
    // Detect if we're running in a browser environment
    this.isBrowser = typeof window !== 'undefined';
    
    if (this.isBrowser) {
      // For browser environments, we need to append authentication as query parameters
      this.wsUrl = `${this.wsUrl}?clientCode=${this.clientCode}&feedToken=${this.feedToken}&apiKey=${this.apiKey}`;
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[SmartAPIWebSocket] ${message}`);
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): Promise<boolean> {
    this.log('Connecting to WebSocket server', this.wsUrl);
    
    return new Promise((resolve, reject) => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.log('Already connected');
        resolve(true);
        return;
      }

      this.connectionState = ConnectionState.CONNECTING;
      
      try {
        // In node.js environment, we use headers for authentication
        const options = this.isBrowser ? {} : {
          headers: {
            'Authorization': this.jwtToken,
            'x-api-key': this.apiKey,
            'x-client-code': this.clientCode,
            'x-feed-token': this.feedToken
          }
        };
        
        this.ws = new WebSocket(this.wsUrl, options);
        
        this.ws.on('open', () => {
          this.connectionState = ConnectionState.CONNECTED;
          this.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          
          // Process pending subscriptions after successful connection
          this.processPendingSubscriptions();
          
          this.emit('connected');
          resolve(true);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            // First check if it's a text message
            if (typeof data === 'string') {
              // Check if it's a heartbeat response
              if (data === 'pong') {
                this.log('Received heartbeat response');
                return;
              }
              
              // Try to parse as JSON (could be an error response)
              try {
                const message = JSON.parse(data);
                if (message.errorCode || message.errorMessage) {
                  this.log('Received error', message);
                  this.emit('error', message);
                } else {
                  this.log('Received text message', message);
                  this.emit('message', message);
                }
              } catch (e) {
                this.log('Unknown text message', data);
              }
            } else {
              // Binary data - needs to be parsed based on subscription mode
              this.parseBinaryMessage(data as Buffer);
            }
          } catch (e) {
            this.log('Failed to process WebSocket message', e);
          }
        });

        this.ws.on('error', (error:any) => {
          this.log('WebSocket error', error);
          this.connectionState = ConnectionState.ERROR;
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', (code: number, reason: string) => {
          this.log('WebSocket closed', { code, reason });
          this.clearHeartbeat();
          this.connectionState = ConnectionState.DISCONNECTED;
          this.emit('disconnect', { code, reason });
          
          // Attempt reconnection
          this.attemptReconnect();
        });
      } catch (error) {
        this.log('Failed to create WebSocket connection', error);
        this.connectionState = ConnectionState.ERROR;
        this.emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Maximum reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect().then(() => {
        // Resubscribe to all active subscriptions
        this.resubscribe();
      }).catch(() => {
        // Error will be emitted by the connect method
      });
    }, this.reconnectInterval);
  }

  /**
   * Set up heartbeat to keep the connection alive
   */
  private setupHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('Sending heartbeat');
        this.ws.send('ping'); // Send 'ping' as text every 30 seconds
      }
    }, 30000); // 30 seconds
  }

  /**
   * Clear the heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Parse binary message received from WebSocket
   * @param data Binary data buffer
   */
  private parseBinaryMessage(data: Buffer): void {
    try {
      // First byte indicates the subscription mode
      const mode = data.readInt8(0);
      // Second byte is the exchange type
      const exchangeType = data.readInt8(1);
      
      // Token is a string (up to 25 bytes, null-terminated)
      let token = '';
      for (let i = 0; i < 25; i++) {
        const charCode = data.readUInt8(2 + i);
        if (charCode === 0) break; // null terminator
        token += String.fromCharCode(charCode);
      }
      
      // Create a base tick object
      const tick: any = {
        mode,
        exchangeType,
        token,
      };

      // Sequence number
      if (data.length >= 35) {
        tick.sequenceNumber = data.readBigInt64LE(27);
      }
      
      // Exchange timestamp
      if (data.length >= 43) {
        tick.exchangeTimestamp = Number(data.readBigInt64LE(35));
      }
      
      // Parse the rest based on the mode
      if (mode === FeedMode.LTP) {
        // LTP mode - packet size = 51 bytes
        if (data.length >= 51) {
          tick.lastTradedPrice = Number(data.readInt32LE(43));
        }
      } 
      else if (mode === FeedMode.QUOTE) {
        // Quote mode - packet size = 123 bytes
        if (data.length >= 51) {
          tick.lastTradedPrice = Number(data.readInt32LE(43));
        }
        if (data.length >= 59) {
          tick.lastTradedQuantity = Number(data.readBigInt64LE(51));
        }
        if (data.length >= 67) {
          tick.averageTradedPrice = Number(data.readBigInt64LE(59));
        }
        if (data.length >= 75) {
          tick.volumeTradedForTheDay = Number(data.readBigInt64LE(67));
        }
        if (data.length >= 83) {
          tick.totalBuyQuantity = data.readDoubleLE(75);
        }
        if (data.length >= 91) {
          tick.totalSellQuantity = data.readDoubleLE(83);
        }
        if (data.length >= 99) {
          tick.openPrice = Number(data.readBigInt64LE(91));
        }
        if (data.length >= 107) {
          tick.highPrice = Number(data.readBigInt64LE(99));
        }
        if (data.length >= 115) {
          tick.lowPrice = Number(data.readBigInt64LE(107));
        }
        if (data.length >= 123) {
          tick.closePrice = Number(data.readBigInt64LE(115));
        }
      } 
      else if (mode === FeedMode.SNAP_QUOTE) {
        // Snap Quote mode - packet size = 379 bytes
        if (data.length >= 51) {
          tick.lastTradedPrice = Number(data.readInt32LE(43));
        }
        if (data.length >= 59) {
          tick.lastTradedQuantity = Number(data.readBigInt64LE(51));
        }
        if (data.length >= 67) {
          tick.averageTradedPrice = Number(data.readBigInt64LE(59));
        }
        if (data.length >= 75) {
          tick.volumeTradedForTheDay = Number(data.readBigInt64LE(67));
        }
        if (data.length >= 83) {
          tick.totalBuyQuantity = data.readDoubleLE(75);
        }
        if (data.length >= 91) {
          tick.totalSellQuantity = data.readDoubleLE(83);
        }
        if (data.length >= 99) {
          tick.openPrice = Number(data.readBigInt64LE(91));
        }
        if (data.length >= 107) {
          tick.highPrice = Number(data.readBigInt64LE(99));
        }
        if (data.length >= 115) {
          tick.lowPrice = Number(data.readBigInt64LE(107));
        }
        if (data.length >= 123) {
          tick.closePrice = Number(data.readBigInt64LE(115));
        }
        if (data.length >= 131) {
          tick.lastTradedTimestamp = Number(data.readBigInt64LE(123));
        }
        if (data.length >= 139) {
          tick.openInterest = Number(data.readBigInt64LE(131));
        }
        if (data.length >= 147) {
          // Open interest change % is a dummy field according to docs
          tick.openInterestChangePercent = data.readDoubleLE(139);
        }
        
        // Best 5 data - 10 packets of 20 bytes each (5 buy + 5 sell)
        if (data.length >= 347) {
          tick.bestBids = [];
          tick.bestAsks = [];
          
          for (let i = 0; i < 10; i++) {
            const offset = 147 + (i * 20);
            const isBuy = data.readInt16LE(offset) === 1;
            const quantity = Number(data.readBigInt64LE(offset + 2));
            const price = Number(data.readBigInt64LE(offset + 10));
            const numOrders = data.readInt16LE(offset + 18);
            
            const entry = {
              quantity,
              price,
              numOrders
            };
            
            if (isBuy) {
              tick.bestBids.push(entry);
            } else {
              tick.bestAsks.push(entry);
            }
          }
        }
        
        if (data.length >= 355) {
          tick.upperCircuitLimit = Number(data.readBigInt64LE(347));
        }
        if (data.length >= 363) {
          tick.lowerCircuitLimit = Number(data.readBigInt64LE(355));
        }
        if (data.length >= 371) {
          tick.fiftyTwoWeekHighPrice = Number(data.readBigInt64LE(363));
        }
        if (data.length >= 379) {
          tick.fiftyTwoWeekLowPrice = Number(data.readBigInt64LE(371));
        }
      }
      else if (mode === FeedMode.DEPTH_20) {
        // Depth 20 mode - only available for NSE_CM
        if (exchangeType === ExchangeType.NSE_CM && data.length >= 443) {
          if (data.length >= 35) {
            tick.exchangeTimestamp = Number(data.readBigInt64LE(27));
          }
          if (data.length >= 43) {
            // dummy placeholder field
            tick.dummyPlaceholder = Number(data.readBigInt64LE(35));
          }
          
          // Best 20 bids and asks
          tick.bestBids = [];
          tick.bestAsks = [];
          
          // Parse best 20 bids (43 + 200 = 243)
          for (let i = 0; i < 20; i++) {
            const offset = 43 + (i * 10);
            const quantity = data.readInt32LE(offset);
            const price = data.readInt32LE(offset + 4);
            const numOrders = data.readInt16LE(offset + 8);
            
            tick.bestBids.push({
              quantity,
              price,
              numOrders
            });
          }
          
          // Parse best 20 asks (243 + 200 = 443)
          for (let i = 0; i < 20; i++) {
            const offset = 243 + (i * 10);
            const quantity = data.readInt32LE(offset);
            const price = data.readInt32LE(offset + 4);
            const numOrders = data.readInt16LE(offset + 8);
            
            tick.bestAsks.push({
              quantity,
              price,
              numOrders
            });
          }
        }
      }

      // Normalize price values (divide by 100 or 10000000 as per documentation)
      if (tick.lastTradedPrice !== undefined) {
        // For currencies, divide by 10000000 (7 zeros), for everything else divide by 100
        const divisor = exchangeType === ExchangeType.CDE_FO ? 10000000 : 100;
        tick.lastTradedPrice = tick.lastTradedPrice / divisor;
        
        if (tick.openPrice !== undefined) tick.openPrice = tick.openPrice / divisor;
        if (tick.highPrice !== undefined) tick.highPrice = tick.highPrice / divisor;
        if (tick.lowPrice !== undefined) tick.lowPrice = tick.lowPrice / divisor;
        if (tick.closePrice !== undefined) tick.closePrice = tick.closePrice / divisor;
        if (tick.upperCircuitLimit !== undefined) tick.upperCircuitLimit = tick.upperCircuitLimit / divisor;
        if (tick.lowerCircuitLimit !== undefined) tick.lowerCircuitLimit = tick.lowerCircuitLimit / divisor;
        if (tick.fiftyTwoWeekHighPrice !== undefined) tick.fiftyTwoWeekHighPrice = tick.fiftyTwoWeekHighPrice / divisor;
        if (tick.fiftyTwoWeekLowPrice !== undefined) tick.fiftyTwoWeekLowPrice = tick.fiftyTwoWeekLowPrice / divisor;
        
        // Normalize prices in best bids/asks
        if (tick.bestBids) {
          tick.bestBids.forEach((bid: any) => {
            bid.price = bid.price / divisor;
          });
        }
        
        if (tick.bestAsks) {
          tick.bestAsks.forEach((ask: any) => {
            ask.price = ask.price / divisor;
          });
        }
      }

      // Emit the parsed tick
      this.log('Parsed tick data', tick);
      this.emit('tick', tick);
      
      // Emit on subscription-specific channel
      const key = this.getSubscriptionKey(exchangeType, token);
      const subscription = this.subscriptions.get(key);
      if (subscription) {
        this.emit(`tick:${subscription.correlationId}`, tick);
      }
    } catch (error) {
      this.log('Error parsing binary message:', error);
    }
  }

  /**
   * Process any pending subscriptions after successful connection
   */
  private processPendingSubscriptions(): void {
    if (this.pendingSubscriptions.length === 0) {
      return;
    }

    this.log(`Processing ${this.pendingSubscriptions.length} pending subscriptions`);
    
    // Group pending subscriptions by mode and exchange
    const subscriptionGroups = new Map<string, SubscriptionData[]>();
    
    for (const sub of this.pendingSubscriptions) {
      const groupKey = `${sub.feedMode}`;
      if (!subscriptionGroups.has(groupKey)) {
        subscriptionGroups.set(groupKey, []);
      }
      subscriptionGroups.get(groupKey)!.push(sub);
    }
    
    // Process each group
    for (const [groupKey, subs] of subscriptionGroups.entries()) {
      const correlationId = `pending-${groupKey}-${Date.now()}`;
      const feedMode = subs[0].feedMode;
      
      // Group by exchange type
      const exchangeTokens = new Map<ExchangeType, string[]>();
      
      for (const sub of subs) {
        if (!exchangeTokens.has(sub.exchangeType)) {
          exchangeTokens.set(sub.exchangeType, []);
        }
        exchangeTokens.get(sub.exchangeType)!.push(sub.token);
        
        // Save subscription
        const key = this.getSubscriptionKey(sub.exchangeType, sub.token);
        this.subscriptions.set(key, sub);
      }
      
      // Build token list
      const tokenList = Array.from(exchangeTokens.entries()).map(([exchangeType, tokens]) => ({
        exchangeType,
        tokens
      }));
      
      // Send subscription request
      this.sendSubscriptionRequest(correlationId, feedMode, tokenList);
    }
    
    // Clear pending subscriptions
    this.pendingSubscriptions = [];
  }

  /**
   * Send subscription/unsubscription request
   * @param correlationId Correlation ID for the request
   * @param feedMode Feed mode
   * @param tokenList List of exchange and token pairs
   * @param action Action (SUBSCRIBE or UNSUBSCRIBE)
   */
  private sendSubscriptionRequest(
    correlationId: string,
    feedMode: FeedMode,
    tokenList: Array<{exchangeType: ExchangeType, tokens: string[]}>,
    action: Action = Action.SUBSCRIBE
  ): void {
    // Check connection
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot send request - WebSocket not connected');
      return;
    }
    
    // Check for depth20 limitations
    if (feedMode === FeedMode.DEPTH_20) {
      let totalTokens = 0;
      for (const item of tokenList) {
        if (item.exchangeType === ExchangeType.NSE_CM) {
          totalTokens += item.tokens.length;
        }
      }
      
      if (totalTokens > 50) {
        this.log('Error: Depth20 mode has a limit of 50 tokens per connection');
        this.emit('error', {
          errorCode: 'E1002',
          errorMessage: 'Invalid Request. Subscription Limit Exceeded.',
          correlationID: correlationId
        });
        return;
      }
    }
    
    // Create request payload
    const request: WebSocketRequest = {
      correlationID: correlationId,
      action: action,
      params: {
        mode: feedMode,
        tokenList: tokenList.map(item => ({
          exchangeType: item.exchangeType,
          tokens: item.tokens
        }))
      }
    };

    this.log('Sending request', request);

    try {
      this.ws.send(JSON.stringify(request));
    } catch (error) {
      this.log('Error sending request', error);
    }
  }

  /**
   * Generate a subscription key from exchange type and token
   * @param exchangeType Exchange type
   * @param token Symbol token
   * @returns Subscription key
   */
  private getSubscriptionKey(exchangeType: ExchangeType, token: string): string {
    return `${exchangeType}:${token}`;
  }

  /**
   * Subscribe to market data for a symbol
   * @param correlationId Client-defined correlation ID for this subscription
   * @param exchangeType Exchange type
   * @param token Symbol token
   * @param feedMode Feed mode (LTP, QUOTE, SNAP_QUOTE, DEPTH_20)
   * @returns Subscription result
   */
  public subscribe(
    correlationId: string,
    exchangeType: ExchangeType,
    token: string,
    feedMode: FeedMode = FeedMode.LTP
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // Check if we're attempting to use DEPTH_20 for non-NSE_CM exchange
      if (feedMode === FeedMode.DEPTH_20 && exchangeType !== ExchangeType.NSE_CM) {
        reject({
          status: false,
          message: '20-Depth Mode is available only for NSE_CM segment'
        });
        return;
      }
      
      // If not connected yet, queue the subscription for later
      if (this.connectionState !== ConnectionState.CONNECTED) {
        this.log('Not connected yet, queuing subscription', {
          correlationId, exchangeType, token, feedMode
        });
        
        this.pendingSubscriptions.push({
          correlationId,
          exchangeType,
          token,
          feedMode
        });
        
        // If not connected, initiate connection
        if (this.connectionState === ConnectionState.DISCONNECTED) {
          this.connect().catch(error => {
            reject(error);
          });
        }
        
        resolve({ status: true, message: 'Subscription queued' });
        return;
      }

      const key = this.getSubscriptionKey(exchangeType, token);
      
      // Save subscription data
      this.subscriptions.set(key, {
        correlationId,
        exchangeType,
        token,
        feedMode
      });

      // Send subscription request
      this.sendSubscriptionRequest(
        correlationId,
        feedMode,
        [{ exchangeType, tokens: [token] }]
      );
      
      resolve({ status: true, message: 'Subscription request sent' });
    });
  }

  /**
   * Subscribe to multiple symbols at once
   * @param correlationId Client-defined correlation ID for this subscription batch
   * @param symbols Array of {exchangeType, token} objects
   * @param feedMode Feed mode (LTP, QUOTE, SNAP_QUOTE, DEPTH_20)
   * @returns Subscription result
   */
  public subscribeMultiple(
    correlationId: string,
    symbols: Array<{exchangeType: ExchangeType, token: string}>,
    feedMode: FeedMode = FeedMode.LTP
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // If DEPTH_20 mode, ensure all symbols are NSE_CM
      if (feedMode === FeedMode.DEPTH_20) {
        const nonNseSymbol = symbols.find(s => s.exchangeType !== ExchangeType.NSE_CM);
        if (nonNseSymbol) {
          reject({
            status: false,
            message: '20-Depth Mode is available only for NSE_CM segment'
          });
          return;
        }
        
        if (symbols.length > 50) {
          reject({
            status: false,
            message: 'For 20-Depth Mode, the maximum limit is 50 tokens per connection'
          });
          return;
        }
      }
      
      if (this.connectionState !== ConnectionState.CONNECTED) {
        this.log('Not connected yet, queuing multiple subscriptions');
        
        // Queue individual subscriptions
        for (const symbol of symbols) {
          this.pendingSubscriptions.push({
            correlationId: `${correlationId}-${symbol.exchangeType}-${symbol.token}`,
            exchangeType: symbol.exchangeType,
            token: symbol.token,
            feedMode
          });
        }
        
        // If not connected, initiate connection
        if (this.connectionState === ConnectionState.DISCONNECTED) {
          this.connect().catch(error => {
            reject(error);
          });
        }
        
        resolve({ status: true, message: 'Multiple subscriptions queued' });
        return;
      }

      // Group symbols by exchange type
      const exchangeTokens = new Map<ExchangeType, string[]>();
      
      for (const symbol of symbols) {
        const key = this.getSubscriptionKey(symbol.exchangeType, symbol.token);
        
        // Save subscription 
        this.subscriptions.set(key, {
          correlationId: `${correlationId}-${symbol.exchangeType}-${symbol.token}`,
          exchangeType: symbol.exchangeType,
          token: symbol.token,
          feedMode
        });
        
        if (!exchangeTokens.has(symbol.exchangeType)) {
          exchangeTokens.set(symbol.exchangeType, []);
        }
        exchangeTokens.get(symbol.exchangeType)!.push(symbol.token);
      }
      
      // Build token list
      const tokenList = Array.from(exchangeTokens.entries()).map(([exchangeType, tokens]) => ({
        exchangeType,
        tokens
      }));
      
      // Send subscription request
      this.sendSubscriptionRequest(correlationId, feedMode, tokenList);
      
      resolve({ status: true, message: 'Multiple subscription request sent' });
    });
  }

  /**
   * Unsubscribe from market data for a symbol
   * @param correlationId Client-defined correlation ID for this unsubscription
   * @param exchangeType Exchange type
   * @param token Symbol token
   * @returns Unsubscription result
   */
  public unsubscribe(
    correlationId: string,
    exchangeType: ExchangeType,
    token: string
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        const error = { status: false, message: 'WebSocket is not connected' };
        reject(error);
        return;
      }

      const key = this.getSubscriptionKey(exchangeType, token);
      
      // Check if subscription exists
      if (!this.subscriptions.has(key)) {
        // According to the docs, unsubscribing from tokens which are not subscribed
        // will be gracefully ignored by the server, so we'll just log a warning
        this.log('Unsubscription warning - not explicitly subscribed');
      }

      // Send unsubscription request
      this.sendSubscriptionRequest(
        correlationId,
        FeedMode.LTP, // doesn't matter for unsubscription
        [{ exchangeType, tokens: [token] }],
        Action.UNSUBSCRIBE
      );
      
      // Remove from subscriptions map
      this.subscriptions.delete(key);
      
      resolve({ status: true, message: 'Unsubscription request sent' });
    });
  }

  /**
   * Unsubscribe from multiple symbols at once
   * @param correlationId Client-defined correlation ID for this unsubscription batch
   * @param symbols Array of {exchangeType, token} objects
   * @returns Unsubscription result
   */
  public unsubscribeMultiple(
    correlationId: string,
    symbols: Array<{exchangeType: ExchangeType, token: string}>
  ): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        const error = { status: false, message: 'WebSocket is not connected' };
        reject(error);
        return;
      }

      // Group symbols by exchange type
      const exchangeTokens = new Map<ExchangeType, string[]>();
      
      for (const symbol of symbols) {
        const key = this.getSubscriptionKey(symbol.exchangeType, symbol.token);
        
        // Remove from subscriptions map
        this.subscriptions.delete(key);
        
        if (!exchangeTokens.has(symbol.exchangeType)) {
          exchangeTokens.set(symbol.exchangeType, []);
        }
        exchangeTokens.get(symbol.exchangeType)!.push(symbol.token);
      }
      
      // Build token list
      const tokenList = Array.from(exchangeTokens.entries()).map(([exchangeType, tokens]) => ({
        exchangeType,
        tokens
      }));
      
      // Send unsubscription request
      this.sendSubscriptionRequest(
        correlationId,
        FeedMode.LTP, // doesn't matter for unsubscription
        tokenList,
        Action.UNSUBSCRIBE
      );
      
      resolve({ status: true, message: 'Multiple unsubscription request sent' });
    });
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribe(): void {
    if (this.subscriptions.size === 0) {
      return;
    }

    this.log(`Resubscribing to ${this.subscriptions.size} symbols`);

    // Group subscriptions by feed mode for efficiency
    const subscriptionsByMode = new Map<FeedMode, Map<ExchangeType, string[]>>();
    
    for (const subscription of this.subscriptions.values()) {
      const { feedMode, exchangeType, token } = subscription;
      
      if (!subscriptionsByMode.has(feedMode)) {
        subscriptionsByMode.set(feedMode, new Map<ExchangeType, string[]>());
      }
      
      const exchangeMap = subscriptionsByMode.get(feedMode)!;
      
      if (!exchangeMap.has(exchangeType)) {
        exchangeMap.set(exchangeType, []);
      }
      
      exchangeMap.get(exchangeType)!.push(token);
    }
    
    // Subscribe to each group by mode
    for (const [mode, exchangeMap] of subscriptionsByMode.entries()) {
      // For DEPTH_20 mode, we need to enforce the 50 token limit
      if (mode === FeedMode.DEPTH_20) {
        // Count NSE_CM tokens
        let nseCmTokens: string[] = [];
        if (exchangeMap.has(ExchangeType.NSE_CM)) {
          nseCmTokens = exchangeMap.get(ExchangeType.NSE_CM)!;
        }
        
        // If we have more than 50, split them
        if (nseCmTokens.length > 50) {
          for (let i = 0; i < nseCmTokens.length; i += 50) {
            const batch = nseCmTokens.slice(i, i + 50);
            const batchId = `resubscribe-depth20-${i/50}`;
            
            this.sendSubscriptionRequest(
              batchId,
              mode,
              [{ exchangeType: ExchangeType.NSE_CM, tokens: batch }]
            );
          }
        } else if (nseCmTokens.length > 0) {
          this.sendSubscriptionRequest(
            `resubscribe-depth20`,
            mode,
            [{ exchangeType: ExchangeType.NSE_CM, tokens: nseCmTokens }]
          );
        }
      } else {
        // For other modes, we can batch by exchange type
        const tokenList = Array.from(exchangeMap.entries()).map(([exchangeType, tokens]) => ({
          exchangeType,
          tokens
        }));
        
        // Each subscription can have at most 1000 tokens, but we'll batch by 200 to be safe
        const batchSize = 200;
        let batchCounter = 0;
        
        while (tokenList.length > 0) {
          const batch: {exchangeType: ExchangeType, tokens: string[]}[] = [];
          let totalTokenCount = 0;
          
          // Take exchanges one by one until we hit the batch size
          while (tokenList.length > 0 && totalTokenCount < batchSize) {
            const exchange = tokenList[0];
            
            if (exchange.tokens.length + totalTokenCount <= batchSize) {
              // Can take the whole exchange
              batch.push(tokenList.shift()!);
              totalTokenCount += exchange.tokens.length;
            } else {
              // Need to split the exchange
              const tokensForBatch = exchange.tokens.splice(0, batchSize - totalTokenCount);
              batch.push({
                exchangeType: exchange.exchangeType,
                tokens: tokensForBatch
              });
              totalTokenCount += tokensForBatch.length;
            }
          }
          
          if (batch.length > 0) {
            const batchId = `resubscribe-mode${mode}-${batchCounter++}`;
            this.sendSubscriptionRequest(batchId, mode, batch);
          }
        }
      }
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      this.log('Already disconnected');
      return;
    }

    this.log('Disconnecting');
    this.connectionState = ConnectionState.DISCONNECTING;
    this.clearHeartbeat();

    // Clear pending subscriptions
    this.pendingSubscriptions = [];

    if (this.ws) {
      // Clear subscriptions
      this.subscriptions.clear();

      // Close the connection
      try {
        this.ws.close();
      } catch (error) {
        this.log('Error closing WebSocket', error);
      }
      
      this.ws = null;
      this.connectionState = ConnectionState.DISCONNECTED;
      this.emit('disconnect', { reason: 'User initiated disconnect' });
    }
  }
}