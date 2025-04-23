import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  GTTCreateParams,
  GTTModifyParams,
  GTTCancelParams,
  GTTRuleListParams,
  GTTRuleData,
  Exchange,
  ProductType,
  GTTErrorCodes
} from '../../types';
import { Auth } from '../auth';
import * as http from '../../utils/http';

/**
 * GTT (Good Till Triggered) module for SmartAPI
 * Handles creating, modifying, and cancelling GTT rules
 */
export class GTT {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize GTT module
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
      console.log(`[SmartAPI:GTT] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Create GTT (Good Till Triggered) order rule
   * 
   * GTT orders allow you to set trigger conditions based on price movements.
   * When a trigger price is hit, your order will be automatically placed.
   * Currently supported only for NSE and BSE exchanges, with DELIVERY and MARGIN product types.
   * 
   * @param params GTT order creation parameters
   * @param options Network configuration options
   * @returns GTT rule creation response with rule ID
   */
  public async createRule(
    params: GTTCreateParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<{id: string}>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate exchange - only NSE and BSE supported
    if (params.exchange !== Exchange.NSE && params.exchange !== Exchange.BSE) {
      return {
        status: false,
        message: GTTErrorCodes.AB9010,
        errorcode: 'AB9010'
      };
    }

    // Validate product type - only DELIVERY and MARGIN supported
    if (params.producttype !== ProductType.DELIVERY && params.producttype !== ProductType.MARGIN) {
      return {
        status: false,
        message: GTTErrorCodes.AB9015,
        errorcode: 'AB9015'
      };
    }

    this.log('Creating GTT rule', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GTT_CREATE_RULE}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Create GTT rule failed', error);
      const retryOperation = () => this.createRule(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Modify an existing GTT rule
   * 
   * @param params GTT rule modification parameters
   * @param options Network configuration options
   * @returns GTT rule modification response with rule ID
   */
  public async modifyRule(
    params: GTTModifyParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<{id: string}>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate exchange - only NSE and BSE supported
    if (params.exchange !== Exchange.NSE && params.exchange !== Exchange.BSE) {
      return {
        status: false,
        message: GTTErrorCodes.AB9010,
        errorcode: 'AB9010'
      };
    }

    this.log('Modifying GTT rule', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GTT_MODIFY_RULE}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Modify GTT rule failed', error);
      const retryOperation = () => this.modifyRule(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Cancel/Delete a GTT rule
   * 
   * @param params GTT rule cancellation parameters
   * @param options Network configuration options
   * @returns GTT rule cancellation response with rule ID
   */
  public async cancelRule(
    params: GTTCancelParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<{id: string}>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Cancelling GTT rule', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GTT_CANCEL_RULE}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Cancel GTT rule failed', error);
      const retryOperation = () => this.cancelRule(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get details of a specific GTT rule
   * 
   * @param id GTT rule ID
   * @param options Network configuration options
   * @returns GTT rule details
   */
  public async getRuleDetails(
    id: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<GTTRuleData>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching GTT rule details', { id });

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GTT_RULE_DETAILS}`,
        { id },
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get GTT rule details failed', error);
      const retryOperation = () => this.getRuleDetails(id, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get list of GTT rules with pagination and status filtering options
   * 
   * @param params GTT rule list parameters with status filters and pagination
   * @param options Network configuration options
   * @returns List of GTT rules
   */
  public async getRuleList(
    params: GTTRuleListParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<GTTRuleData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching GTT rules list', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GTT_RULE_LIST}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get GTT rules list failed', error);
      const retryOperation = () => this.getRuleList(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}