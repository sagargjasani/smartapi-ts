import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  BrokerageCalculatorParams,
  BrokerageCalculatorResult,
  MarginCalculatorParams,
  MarginCalculatorResult
} from '../../types';
import { Auth } from '../auth';
import * as http from '../../utils/http';

/**
 * Brokerage module for SmartAPI
 * Handles brokerage calculation functionality
 */
export class Brokerage {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize brokerage module
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
      console.log(`[SmartAPI:Brokerage] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Calculate estimated brokerage charges for one or more orders
   * 
   * The Brokerage Calculator API is used to calculate brokerage charges, taxes and other fees
   * that will be incurred by the user when placing trades. This allows users to estimate
   * the total transaction cost before placing an order.
   * 
   * @param params Order parameters to calculate brokerage for
   * @param options Network configuration options
   * @returns Estimated brokerage charges and breakdown
   */
  public async calculate(
    params: BrokerageCalculatorParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<BrokerageCalculatorResult>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate that at least one order is provided
    if (!params.orders || params.orders.length === 0) {
      return {
        status: false,
        message: 'At least one order must be provided for brokerage calculation'
      };
    }

    this.log('Calculating brokerage', params);

    try {
      return await http.post<BrokerageCalculatorResult>(
        `${API_URLS.BASE_URL}${API_URLS.BROKERAGE_CALCULATOR}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Brokerage calculation failed', error);
      const retryOperation = () => this.calculate(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Calculate margin requirements for a basket of positions
   * 
   * The Margin Calculator API delivers real-time margin calculations for a basket of positions.
   * This helps in understanding the margin requirements for various trading scenarios.
   * 
   * @param params Position parameters to calculate margin for
   * @param options Network configuration options
   * @returns Calculated margin requirements
   */
  public async calculateMargin(
    params: MarginCalculatorParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<MarginCalculatorResult>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate that at least one position is provided
    if (!params.positions || params.positions.length === 0) {
      return {
        status: false,
        message: 'At least one position must be provided for margin calculation'
      };
    }

    // Validate that no more than 50 positions are provided (API limit)
    if (params.positions.length > 50) {
      return {
        status: false,
        message: 'Maximum 50 positions can be provided in a single request'
      };
    }

    // Set default orderType as "LIMIT" if not provided for any position
    params.positions = params.positions.map(position => {
      return {
        ...position,
        orderType: position.orderType || 'LIMIT'
      };
    });

    this.log('Calculating margin', params);

    try {
      return await http.post<MarginCalculatorResult>(
        `${API_URLS.BASE_URL}${API_URLS.MARGIN_CALCULATOR}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Margin calculation failed', error);
      const retryOperation = () => this.calculateMargin(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}