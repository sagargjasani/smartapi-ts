import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { API_URLS } from '../constants/apiUrls';
import { ApiResponse, OrderStatusResponse, OrderStatusCode } from '../types';

/**
 * WebSocket connection states
 */
enum ConnectionState {
  CONNECTING = 0,
  CONNECTED = 1,
  DISCONNECTING = 2,
  DISCONNECTED = 3,
  ERROR = 4
}

/**
 * SmartAPI Order Status WebSocket client
 * Implementation based on Order Status WebSocket API documentation
 * Used for real-time order updates
 */
export class OrderStatusWebSocket extends EventEmitter {
  private jwtToken: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private debug: boolean = false;
  private isBrowser: boolean = false;
  private clientCode: string = '';

  /**
   * Initialize a new OrderStatusWebSocket client
   * @param jwtToken JWT token from login API (auth token)
   * @param debug Enable debug logging
   */
  constructor(jwtToken: string, debug: boolean = false) {
    super();
    this.jwtToken = jwtToken;
    this.wsUrl = API_URLS.ORDER_STATUS_WEBSOCKET;
    this.debug = debug;
    
    // Detect if we're running in a browser environment
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[OrderStatusWebSocket] ${message}`);
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  /**
   * Connect to the Order Status WebSocket server
   */
  public connect(): Promise<boolean> {
    this.log('Connecting to Order Status WebSocket server', this.wsUrl);
    
    return new Promise((resolve, reject) => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.log('Already connected');
        resolve(true);
        return;
      }

      this.connectionState = ConnectionState.CONNECTING;
      
      try {
        // We need to set Authorization header for authentication
        const options = {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`
          }
        };
        
        this.ws = new WebSocket(this.wsUrl, options);
        
        this.ws.on('open', () => {
          this.connectionState = ConnectionState.CONNECTED;
          this.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          this.emit('connected');
          resolve(true);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            // Parse the message as JSON
            if (typeof data === 'string') {
              // Check if it's a heartbeat/pong response
              if (data === 'pong') {
                this.log('Received heartbeat response');
                return;
              }
              
              try {
                const message = JSON.parse(data) as OrderStatusResponse;
                
                // Save client code from initial response
                if (message['order-status'] === OrderStatusCode.CONNECTED) {
                  this.clientCode = message['user-id'];
                  this.log('Connected successfully. Client code:', this.clientCode);
                }
                
                // Handle error responses
                if (message['status-code'] !== '200') {
                  this.log('Received error', message);
                  this.emit('error', {
                    code: message['status-code'],
                    message: message['error-message'] || 'Unknown error'
                  });
                  
                  // Handle specific error codes
                  if (message['status-code'] === '401') {
                    this.log('Authentication failed: Invalid authorization token');
                    this.disconnect();
                  } else if (message['status-code'] === '403') {
                    this.log('Authentication failed: Authorization token expired');
                    this.disconnect();
                  } else if (message['status-code'] === '429') {
                    this.log('Connection limit breached: Maximum 3 connections per client code');
                    this.disconnect();
                  }
                } else {
                  // Emit the appropriate event based on order status
                  this.log('Received order update', message);
                  this.emit('message', message);
                  
                  // Emit specific event for the order status
                  if (message['order-status'] && message['order-status'] !== OrderStatusCode.CONNECTED) {
                    this.emit('order-update', message);
                    
                    // Also emit specific event for the order status
                    this.emit(`order-${message['order-status']}`, message);
                    
                    // If there's an orderid, emit event with that too
                    if (message.orderData && message.orderData.orderid) {
                      this.emit(`order-${message.orderData.orderid}`, message);
                    }
                  }
                }
              } catch (e) {
                this.log('Unknown text message', data);
              }
            }
          } catch (e) {
            this.log('Failed to process WebSocket message', e);
          }
        });

        this.ws.on('error', (error: any) => {
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
      this.connect().catch(() => {
        // Error will be emitted by the connect method
      });
    }, this.reconnectInterval);
  }

  /**
   * Set up ping/pong heartbeat to keep the connection alive
   * According to the documentation, clients should send a ping message every 10 seconds
   */
  private setupHeartbeat(): void {
    this.clearHeartbeat();
    
    // Send ping every 10 seconds as required by the API docs
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('Sending ping');
        this.ws.send('ping');
      }
    }, 10000); // 10 seconds
  }

  /**
   * Clear the heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
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

    if (this.ws) {
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

  /**
   * Check if the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get the client code received in the connection response
   * @returns Client code or empty string if not connected yet
   */
  public getClientCode(): string {
    return this.clientCode;
  }

  /**
   * Set the JWT token (useful if token gets refreshed)
   * @param jwtToken New JWT token
   */
  public setJwtToken(jwtToken: string): void {
    this.jwtToken = jwtToken;
    // If we're connected, disconnect and reconnect with the new token
    if (this.isConnected()) {
      this.log('JWT Token updated, reconnecting...');
      this.disconnect();
      this.connect().catch(error => {
        this.log('Failed to reconnect with new token', error);
      });
    }
  }
}