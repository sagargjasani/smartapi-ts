import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  Holding,
  Position,
  RMSData,
  AllHoldingsResponse,
  PositionConversionParams
} from '../../types';
import { Auth } from '../auth';
import * as http from '../../utils/http';

/**
 * Portfolio module for SmartAPI
 * Handles positions, holdings, funds and related functionality
 */
export class Portfolio {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize portfolio module
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
      console.log(`[SmartAPI:Portfolio] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Get user's current positions
   * @param options Network configuration options
   * @returns Positions data
   */
  public async getPositions(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse<Position[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching positions');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.POSITIONS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get positions failed', error);
      const retryOperation = () => this.getPositions(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get user's holdings
   * @param options Network configuration options
   * @returns Holdings data
   */
  public async getHoldings(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse<Holding[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching holdings');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.HOLDINGS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get holdings failed', error);
      const retryOperation = () => this.getHoldings(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
  
  /**
   * Get all holdings with comprehensive portfolio summary
   * This endpoint offers a more comprehensive view of the entire investments, including 
   * individual stock holdings and a summary of total investments in the "totalholding" section
   * 
   * @param options Network configuration options
   * @returns All holdings data with portfolio summary
   */
  public async getAllHoldings(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse<AllHoldingsResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching all holdings with portfolio summary');

    try {
      return await http.get<AllHoldingsResponse>(
        `${API_URLS.BASE_URL}${API_URLS.ALL_HOLDINGS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get all holdings failed', error);
      const retryOperation = () => this.getAllHoldings(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
  
  /**
   * Get funds and margin details (RMS limits)
   * The GET Request to RMS returns fund, cash and margin information
   * of the user for equity and commodity segments.
   * 
   * @param options Network configuration options
   * @returns Funds and RMS data
   */
  public async getFunds(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse<RMSData>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching funds and RMS data');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.FUNDS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get funds failed', error);
      const retryOperation = () => this.getFunds(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Convert a position from one product type to another
   * For example, convert from INTRADAY to DELIVERY or vice versa
   * 
   * @param params Position conversion parameters
   * @param options Network configuration options
   * @returns Conversion response
   */
  public async convertPosition(
    params: PositionConversionParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<any>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Converting position', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.CONVERT_POSITION}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Position conversion failed', error);
      const retryOperation = () => this.convertPosition(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}