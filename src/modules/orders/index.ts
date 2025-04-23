import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  OrderParams,
  BracketOrderParams,
  CoverOrderParams,
  OrderResponse,
  ProductType,
  Variety,
  OrderDetails
} from '../../types';
import { Auth } from '../auth';
import { ERROR_CODES } from '../../constants/errorCodes';
import * as http from '../../utils/http';

/**
 * Orders module for SmartAPI
 * Handles placing, modifying, cancelling orders and fetching order details
 */
export class Orders {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize orders module
   */
  constructor(auth: Auth, httpClient: AxiosInstance, debug: boolean = false) {
    this.auth = auth;
    this.httpClient = httpClient;
    this.debug = debug;
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[SmartAPI:Orders] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Place a normal order
   * @param params Order parameters
   * @param options Network configuration options
   * @returns Order response with orderid and uniqueorderid
   */
  public async placeOrder(
    params: OrderParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Check order tag length to avoid AB4008 error
    if (params.ordertag && params.ordertag.length > 20) {
      return {
        status: false,
        message: ERROR_CODES.AB4008,
        errorcode: 'AB4008'
      };
    }

    this.log('Placing order', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.PLACE_ORDER}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Place order failed', error);
      const retryOperation = () => this.placeOrder(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Place a bracket order
   * A bracket order is a special order that includes an entry order along with target and stoploss orders
   * @param params Bracket order parameters
   * @param options Network configuration options
   * @returns Order response with orderid and uniqueorderid
   */
  public async placeBracketOrder(
    params: BracketOrderParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Bracket orders must use BO product type
    const bracketParams = {
      ...params,
      producttype: ProductType.BO,
      variety: Variety.ROBO // Bracket order requires ROBO variety per documentation
    };

    // Check order tag length to avoid AB4008 error
    if (bracketParams.ordertag && bracketParams.ordertag.length > 20) {
      return {
        status: false,
        message: ERROR_CODES.AB4008,
        errorcode: 'AB4008'
      };
    }

    this.log('Placing bracket order', bracketParams);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.PLACE_ORDER}`,
        bracketParams,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Place bracket order failed', error);
      const retryOperation = () => this.placeBracketOrder(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Place a cover order
   * A cover order is a special order that includes a stoploss order along with the main order
   * @param params Cover order parameters
   * @param options Network configuration options
   * @returns Order response with orderid and uniqueorderid
   */
  public async placeCoverOrder(
    params: CoverOrderParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Cover orders must use CO product type
    const coverParams = {
      ...params,
      producttype: ProductType.CO,
      variety: Variety.NORMAL // CO requires NORMAL variety
    };

    // Check order tag length to avoid AB4008 error
    if (coverParams.ordertag && coverParams.ordertag.length > 20) {
      return {
        status: false,
        message: ERROR_CODES.AB4008,
        errorcode: 'AB4008'
      };
    }

    this.log('Placing cover order', coverParams);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.PLACE_ORDER}`,
        coverParams,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Place cover order failed', error);
      const retryOperation = () => this.placeCoverOrder(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Modify an existing order
   * @param params Order parameters with order id
   * @param options Network configuration options
   * @returns Order modification response with orderid and uniqueorderid
   */
  public async modifyOrder(
    params: OrderParams & { orderid: string },
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Check order tag length to avoid AB4008 error
    if (params.ordertag && params.ordertag.length > 20) {
      return {
        status: false,
        message: ERROR_CODES.AB4008,
        errorcode: 'AB4008'
      };
    }

    this.log('Modifying order', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.MODIFY_ORDER}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Modify order failed', error);
      const retryOperation = () => this.modifyOrder(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Cancel an order
   * @param orderId Order ID to cancel
   * @param variety Order variety
   * @param options Network configuration options
   * @returns Order cancellation response with orderid and uniqueorderid
   */
  public async cancelOrder(
    orderId: string, 
    variety: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    const params = {
      orderid: orderId,
      variety
    };

    this.log('Cancelling order', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.CANCEL_ORDER}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Cancel order failed', error);
      const retryOperation = () => this.cancelOrder(orderId, variety, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get order book (list of orders)
   * @param options Network configuration options
   * @returns Order book
   */
  public async getOrderBook(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching order book');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.ORDER_BOOK}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get order book failed', error);
      const retryOperation = () => this.getOrderBook(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get details of a specific order by uniqueorderid
   * 
   * @param uniqueOrderId Unique order ID received in order responses
   * @param options Network configuration options
   * @returns Order details response
   */
  public async getOrderDetails(
    uniqueOrderId: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OrderDetails>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching order details', { uniqueOrderId });

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.ORDER_DETAILS}${uniqueOrderId}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get order details failed', error);
      const retryOperation = () => this.getOrderDetails(uniqueOrderId, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get trade book (list of trades/executions)
   * @param options Network configuration options
   * @returns Trade book
   */
  public async getTradeBook(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching trade book');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.TRADE_BOOK}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get trade book failed', error);
      const retryOperation = () => this.getTradeBook(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}