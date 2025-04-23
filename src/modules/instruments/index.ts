import { AxiosInstance } from 'axios';
import axios from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  InstrumentData,
  LtpData,
  LtpDataRequest,
  SearchScripRequest,
  SearchScripResult,
  IntradayScrip
} from '../../types';
import { Auth } from '../auth';
import * as http from '../../utils/http';

/**
 * Instruments module for SmartAPI
 * Handles operations related to market instruments, scrips and LTP data
 */
export class Instruments {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize instruments module
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
      console.log(`[SmartAPI:Instruments] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Fetch the complete instrument list with all tradable instruments
   * This provides a consolidated, import-ready JSON list of instruments across all exchanges
   * 
   * @returns Array of instrument data
   */
  public async getInstruments(): Promise<ApiResponse<InstrumentData[]>> {
    try {
      this.log('Fetching instrument master list');
      
      const response = await axios.get(API_URLS.INSTRUMENT_MASTER);
      
      if (Array.isArray(response.data)) {
        return {
          status: true,
          message: 'Instruments list fetched successfully',
          data: response.data as InstrumentData[]
        };
      } else {
        return {
          status: false,
          message: 'Invalid response format from instrument list API'
        };
      }
    } catch (error) {
      this.log('Fetch instruments list failed', error);
      return {
        status: false,
        message: `Failed to fetch instruments list: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Fetch LTP (Last Traded Price) data for a specific instrument
   * 
   * @param exchange Exchange name (e.g., NSE, BSE, NFO)
   * @param symbolToken Symbol token/ID
   * @param tradingSymbol Trading symbol
   * @param options Network configuration options
   * @returns Last traded price data
   */
  public async getLtp(
    exchange: string,
    symbolToken: string,
    tradingSymbol: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<LtpData>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    const params: LtpDataRequest = {
      exchange,
      symboltoken: symbolToken,
      tradingsymbol: tradingSymbol
    };

    this.log('Fetching LTP data', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.LTP_DATA}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get LTP data failed', error);
      const retryOperation = () => this.getLtp(exchange, symbolToken, tradingSymbol, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Search for scrips by name or keyword
   * 
   * @param exchange Exchange name (e.g., NSE, BSE, NFO)
   * @param searchQuery Search keyword or partial symbol name
   * @param options Network configuration options
   * @returns List of matching scrips with their tokens
   */
  public async searchScrip(
    exchange: string,
    searchQuery: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<SearchScripResult[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    if (!searchQuery || !exchange) {
      return {
        status: false,
        message: 'Exchange and search query are required'
      };
    }

    const params: SearchScripRequest = {
      exchange,
      searchscrip: searchQuery
    };

    this.log('Searching for scrips', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.SEARCH_SCRIP}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Search scrip failed', error);
      const retryOperation = () => this.searchScrip(exchange, searchQuery, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get list of NSE scrips allowed for intraday trading
   * This provides a list of scripts that are allowed for intraday (MIS) trading on NSE
   * along with their margin multipliers
   * 
   * @param options Network configuration options
   * @returns List of NSE scrips allowed for intraday trading with their margin multipliers
   */
  public async getNseIntradayScrips(
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<IntradayScrip[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching NSE intraday scrips');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.NSE_INTRADAY_SCRIPS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get NSE intraday scrips failed', error);
      const retryOperation = () => this.getNseIntradayScrips(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get list of BSE scrips allowed for intraday trading
   * This provides a list of scripts that are allowed for intraday (MIS) trading on BSE
   * along with their margin multipliers
   * 
   * @param options Network configuration options
   * @returns List of BSE scrips allowed for intraday trading with their margin multipliers
   */
  public async getBseIntradayScrips(
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<IntradayScrip[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching BSE intraday scrips');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.BSE_INTRADAY_SCRIPS}`,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get BSE intraday scrips failed', error);
      const retryOperation = () => this.getBseIntradayScrips(options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}