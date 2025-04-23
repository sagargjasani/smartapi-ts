import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  ApiResponse,
  HistoricalDataParams,
  CandleData,
  HistoricalInterval,
  PostbackData,
  MarketDataMode,
  MarketQuoteRequest,
  MarketQuoteResponse,
  FullMarketData,
  OHLCMarketData,
  LTPMarketData,
  OptionGreeksParams,
  OptionGreekData,
  GainersLosersParams,
  GainersLosersResponse,
  GainersLosersDataType,
  ExpiryType,
  OIData
} from '../../types';
import { Auth } from '../auth';
import * as http from '../../utils/http';

/**
 * Miscellaneous market data module for SmartAPI
 * Handles data operations like historical candles, LTP, quotes, etc.
 */
export class MarketData {
  private auth: Auth;
  private httpClient: AxiosInstance;
  private debug: boolean;

  /**
   * Initialize market data module
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
      console.log(`[SmartAPI:MarketData] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Get market quotes using the new Live Market Data API
   * Supports three modes: LTP, OHLC, FULL
   * Supports up to 50 symbols in a single request
   * 
   * @param request Market quote request with mode and exchangeTokens
   * @param options Network configuration options
   * @returns Market quote data
   */
  public async getMarketQuote(
    request: MarketQuoteRequest,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<MarketQuoteResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate request
    if (!request.mode || !Object.values(MarketDataMode).includes(request.mode)) {
      return {
        status: false,
        message: 'Invalid mode. Must be one of LTP, OHLC, FULL.'
      };
    }

    if (!request.exchangeTokens || Object.keys(request.exchangeTokens).length === 0) {
      return {
        status: false,
        message: 'exchangeTokens cannot be empty'
      };
    }

    // Check if total symbols across all exchanges exceeds the limit (50)
    const totalSymbols = Object.values(request.exchangeTokens)
      .reduce((sum, tokens) => sum + tokens.length, 0);

    if (totalSymbols > 50) {
      return {
        status: false,
        message: 'Maximum 50 symbols allowed in a single request'
      };
    }

    this.log('Fetching market quote data', request);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.MARKET_QUOTE}`,
        request,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get market quote failed', error);
      const retryOperation = () => this.getMarketQuote(request, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get LTP data using the new Live Market Data API
   * Convenience method that uses the getMarketQuote with LTP mode
   * 
   * @param exchangeTokenMap Map of exchange to tokens (e.g., {"NSE": ["3045"], "BSE": ["500112"]})
   * @param options Network configuration options
   * @returns LTP data
   */
  public async getLTPData(
    exchangeTokenMap: Record<string, string[]>,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<MarketQuoteResponse>> {
    const request: MarketQuoteRequest = {
      mode: MarketDataMode.LTP,
      exchangeTokens: exchangeTokenMap
    };
    
    return this.getMarketQuote(request, options);
  }

  /**
   * Get OHLC data using the new Live Market Data API
   * Convenience method that uses the getMarketQuote with OHLC mode
   * 
   * @param exchangeTokenMap Map of exchange to tokens (e.g., {"NSE": ["3045"], "BSE": ["500112"]})
   * @param options Network configuration options
   * @returns OHLC data
   */
  public async getOHLCData(
    exchangeTokenMap: Record<string, string[]>,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<MarketQuoteResponse>> {
    const request: MarketQuoteRequest = {
      mode: MarketDataMode.OHLC,
      exchangeTokens: exchangeTokenMap
    };
    
    return this.getMarketQuote(request, options);
  }

  /**
   * Get full market data using the new Live Market Data API
   * Convenience method that uses the getMarketQuote with FULL mode
   * 
   * @param exchangeTokenMap Map of exchange to tokens (e.g., {"NSE": ["3045"], "BSE": ["500112"]})
   * @param options Network configuration options
   * @returns Full market data including depth
   */
  public async getFullQuote(
    exchangeTokenMap: Record<string, string[]>,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<MarketQuoteResponse>> {
    const request: MarketQuoteRequest = {
      mode: MarketDataMode.FULL,
      exchangeTokens: exchangeTokenMap
    };
    
    return this.getMarketQuote(request, options);
  }

  /**
   * Get last traded price for a symbol (Legacy method)
   * @deprecated Use getLTPData() instead which supports multiple symbols
   * @param exchange Exchange name (e.g., NSE, BSE)
   * @param symbolToken Symbol token
   * @param tradingSymbol Trading symbol
   * @param options Network configuration options
   * @returns LTP data
   */
  public async getLTP(
    exchange: string,
    symbolToken: string,
    tradingSymbol: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    const params = {
      exchange,
      symboltoken: symbolToken,
      tradingsymbol: tradingSymbol
    };

    this.log('Fetching LTP (Legacy)', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.LTP_DATA}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get LTP failed', error);
      const retryOperation = () => this.getLTP(exchange, symbolToken, tradingSymbol, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get last traded price for multiple symbols (Legacy method)
   * @deprecated Use getLTPData() instead which has better batching support
   * @param instruments Array of instruments (exchange, symboltoken, tradingsymbol)
   * @param options Network configuration options
   * @returns LTP data for multiple symbols
   */
  public async getMultiLTP(
    instruments: Array<{
      exchange: string;
      symboltoken: string;
      tradingsymbol: string;
    }>,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching multiple LTPs (Legacy)', instruments);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}/rest/secure/angelbroking/market/v1/getMultiLTP`,
        { instruments },
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get multiple LTPs failed', error);
      const retryOperation = () => this.getMultiLTP(instruments, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get comprehensive quote for symbols (Legacy method)
   * @deprecated Use getFullQuote() instead which supports multiple symbols
   * @param exchange Exchange name (e.g., NSE, BSE)
   * @param symbolToken Symbol token
   * @param tradingSymbol Trading symbol
   * @param options Network configuration options
   * @returns Quote data
   */
  public async getQuote(
    exchange: string,
    symbolToken: string,
    tradingSymbol: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    const params = {
      exchange,
      symboltoken: symbolToken,
      tradingsymbol: tradingSymbol
    };

    this.log('Fetching quote (Legacy)', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.QUOTE}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get quote failed', error);
      const retryOperation = () => this.getQuote(exchange, symbolToken, tradingSymbol, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get market quotes for multiple symbols (Legacy method)
   * @deprecated Use getFullQuote() instead which has better batching support
   * @param instruments Array of instruments (exchange, token)
   * @param options Network configuration options
   * @returns Market quotes for multiple symbols
   */
  public async getMultiQuotes(
    instruments: Array<{
      exchange: string;
      symboltoken: string;
      tradingsymbol: string;
    }>,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching multiple quotes (Legacy)', instruments);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}/rest/secure/angelbroking/market/v1/getMultiQuotes`,
        { instruments },
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get multiple quotes failed', error);
      const retryOperation = () => this.getMultiQuotes(instruments, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get historical candle data
   * @param params Historical data parameters
   * @param options Network configuration options
   * @returns Historical candle data
   */
  public async getHistoricalData(
    params: HistoricalDataParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<CandleData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching historical data', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.HISTORICAL_CANDLES}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get historical data failed', error);
      const retryOperation = () => this.getHistoricalData(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get historical candle data with automatic pagination
   * Handles large date ranges by splitting into smaller chunks
   * @param params Historical data parameters
   * @param maxCandlesPerRequest Maximum number of candles per request (default: 2000)
   * @param options Network configuration options
   * @returns Consolidated historical candle data
   */
  public async getHistoricalDataPaginated(
    params: HistoricalDataParams,
    maxCandlesPerRequest: number = 2000,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<CandleData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Parse input dates
    const fromDate = new Date(params.fromdate);
    const toDate = new Date(params.todate);
    
    // Calculate appropriate chunk size based on interval
    let chunkSizeMs = 0;
    switch (params.interval) {
      case HistoricalInterval.ONE_MINUTE:
        chunkSizeMs = maxCandlesPerRequest * 60 * 1000; // 1 minute in ms
        break;
      case HistoricalInterval.FIVE_MINUTE:
        chunkSizeMs = maxCandlesPerRequest * 5 * 60 * 1000;
        break;
      case HistoricalInterval.FIFTEEN_MINUTE:
        chunkSizeMs = maxCandlesPerRequest * 15 * 60 * 1000;
        break;
      case HistoricalInterval.THIRTY_MINUTE:
        chunkSizeMs = maxCandlesPerRequest * 30 * 60 * 1000;
        break;
      case HistoricalInterval.ONE_HOUR:
        chunkSizeMs = maxCandlesPerRequest * 60 * 60 * 1000;
        break;
      case HistoricalInterval.ONE_DAY:
        chunkSizeMs = maxCandlesPerRequest * 24 * 60 * 60 * 1000;
        break;
      default:
        chunkSizeMs = 30 * 24 * 60 * 60 * 1000; // 30 days for larger intervals
    }
    
    // Create chunks of date ranges
    const dateRanges: { start: Date; end: Date }[] = [];
    let currentStart = new Date(fromDate);
    
    while (currentStart < toDate) {
      const chunkEnd = new Date(currentStart.getTime() + chunkSizeMs);
      const actualEnd = chunkEnd < toDate ? chunkEnd : toDate;
      
      dateRanges.push({
        start: new Date(currentStart),
        end: new Date(actualEnd)
      });
      
      currentStart = new Date(actualEnd.getTime() + 1); // Start next chunk 1ms after end of current
    }
    
    // Format date as YYYY-MM-DD HH:mm
    const formatDate = (date: Date): string => {
      return date.toISOString().replace('T', ' ').substring(0, 16);
    };
    
    try {
      // Fetch data for each chunk
      const allResults: CandleData[] = [];
      
      for (const range of dateRanges) {
        const chunkParams = {
          ...params,
          fromdate: formatDate(range.start),
          todate: formatDate(range.end)
        };
        
        this.log('Fetching historical data chunk', chunkParams);
        
        const response = await this.getHistoricalData(chunkParams, options);
        
        if (response.status && response.data) {
          allResults.push(...response.data);
        } else {
          // Return error if any chunk fails
          return response;
        }
      }
      
      // Return consolidated results
      return {
        status: true,
        message: 'Historical data retrieved successfully',
        data: allResults
      };
    } catch (error) {
      this.log('Paginated historical data request failed', error);
      return http.handleApiError(error);
    }
  }
  
  /**
   * Get historical Open Interest data for F&O contracts
   * Provides historical OI data for live F&O contracts
   * 
   * @param params Historical data parameters (same as for getHistoricalData)
   * @param options Network configuration options
   * @returns Historical OI data
   */
  public async getHistoricalOIData(
    params: HistoricalDataParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OIData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate input parameters
    if (params.exchange !== 'NFO' && params.exchange !== 'BFO') {
      return {
        status: false,
        message: 'OI data is only available for derivatives segments (NFO, BFO)'
      };
    }

    this.log('Fetching historical OI data', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.HISTORICAL_OI}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get historical OI data failed', error);
      const retryOperation = () => this.getHistoricalOIData(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get historical Open Interest data with automatic pagination
   * Handles large date ranges by splitting into smaller chunks
   * 
   * @param params Historical data parameters
   * @param maxEntriesPerRequest Maximum number of entries per request based on interval
   * @param options Network configuration options
   * @returns Consolidated historical OI data
   */
  public async getHistoricalOIDataPaginated(
    params: HistoricalDataParams,
    maxEntriesPerRequest?: number,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OIData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }
    
    // Determine max entries based on interval if not provided
    if (maxEntriesPerRequest === undefined) {
      switch (params.interval) {
        case HistoricalInterval.ONE_MINUTE:
          maxEntriesPerRequest = 30 * 375; // 30 days of market hours
          break;
        case HistoricalInterval.THREE_MINUTE:
          maxEntriesPerRequest = 60 * 125; // 60 days of market hours
          break;
        case HistoricalInterval.FIVE_MINUTE:
          maxEntriesPerRequest = 100 * 75; // 100 days of market hours
          break;
        case HistoricalInterval.TEN_MINUTE:
          maxEntriesPerRequest = 100 * 38; // 100 days of market hours
          break;
        case HistoricalInterval.FIFTEEN_MINUTE:
          maxEntriesPerRequest = 200 * 25; // 200 days of market hours
          break;
        case HistoricalInterval.THIRTY_MINUTE:
          maxEntriesPerRequest = 200 * 13; // 200 days of market hours
          break;
        case HistoricalInterval.ONE_HOUR:
          maxEntriesPerRequest = 400 * 7; // 400 days of market hours
          break;
        case HistoricalInterval.ONE_DAY:
          maxEntriesPerRequest = 2000; // 2000 days per API doc
          break;
        default:
          maxEntriesPerRequest = 1000; // Default value
      }
    }

    // Parse input dates
    const fromDate = new Date(params.fromdate);
    const toDate = new Date(params.todate);
    
    // Calculate appropriate chunk size based on interval
    let chunkSizeMs = 0;
    switch (params.interval) {
      case HistoricalInterval.ONE_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 60 * 1000; // 1 minute in ms
        break;
      case HistoricalInterval.THREE_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 3 * 60 * 1000;
        break;
      case HistoricalInterval.FIVE_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 5 * 60 * 1000;
        break;
      case HistoricalInterval.TEN_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 10 * 60 * 1000;
        break;
      case HistoricalInterval.FIFTEEN_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 15 * 60 * 1000;
        break;
      case HistoricalInterval.THIRTY_MINUTE:
        chunkSizeMs = maxEntriesPerRequest * 30 * 60 * 1000;
        break;
      case HistoricalInterval.ONE_HOUR:
        chunkSizeMs = maxEntriesPerRequest * 60 * 60 * 1000;
        break;
      case HistoricalInterval.ONE_DAY:
        chunkSizeMs = maxEntriesPerRequest * 24 * 60 * 60 * 1000;
        break;
      default:
        chunkSizeMs = 30 * 24 * 60 * 60 * 1000; // 30 days for larger intervals
    }
    
    // Create chunks of date ranges
    const dateRanges: { start: Date; end: Date }[] = [];
    let currentStart = new Date(fromDate);
    
    while (currentStart < toDate) {
      const chunkEnd = new Date(currentStart.getTime() + chunkSizeMs);
      const actualEnd = chunkEnd < toDate ? chunkEnd : toDate;
      
      dateRanges.push({
        start: new Date(currentStart),
        end: new Date(actualEnd)
      });
      
      currentStart = new Date(actualEnd.getTime() + 1); // Start next chunk 1ms after end of current
    }
    
    // Format date as YYYY-MM-DD HH:mm
    const formatDate = (date: Date): string => {
      return date.toISOString().replace('T', ' ').substring(0, 16);
    };
    
    try {
      // Fetch data for each chunk
      const allResults: OIData[] = [];
      
      for (const range of dateRanges) {
        const chunkParams = {
          ...params,
          fromdate: formatDate(range.start),
          todate: formatDate(range.end)
        };
        
        this.log('Fetching historical OI data chunk', chunkParams);
        
        const response = await this.getHistoricalOIData(chunkParams, options);
        
        if (response.status && response.data) {
          allResults.push(...response.data);
        } else {
          // Return error if any chunk fails
          return response;
        }
      }
      
      // Return consolidated results
      return {
        status: true,
        message: 'Historical OI data retrieved successfully',
        data: allResults
      };
    } catch (error) {
      this.log('Paginated historical OI data request failed', error);
      return http.handleApiError(error);
    }
  }

  /**
   * Set up webhook configuration for real-time order updates
   * 
   * Note: The actual webhook URL must be registered when creating your API key in the Angel One dashboard.
   * This method provides information about webhook behavior and requirements.
   * 
   * @returns Object with webhook information and requirements
   */
  public getWebhookInfo(): ApiResponse<{url: string | null}> {
    // This only provides information about webhook settings
    // The webhook URL must be configured in the Angel One dashboard
    return {
      status: true,
      message: "Webhook information retrieved",
      data: {
        url: null,
      }
    };
  }

  /**
   * Parse webhook data received from Angel One postback
   * This is meant to be used in your webhook endpoint implementation
   * 
   * @param data Raw webhook payload as received from Angel One
   * @returns Parsed PostbackData object
   */
  public static parseWebhookData(data: any): PostbackData {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data) as PostbackData;
      }
      return data as PostbackData;
    } catch (error) {
      throw new Error('Invalid webhook data format');
    }
  }

  /**
   * Get Option Greeks (Delta, Gamma, Theta, Vega) and Implied Volatility
   * for specified underlying and expiry date
   * 
   * @param params Parameters containing the underlying name and expiry date
   * @param options Network configuration options
   * @returns Option greeks data for multiple strike prices
   */
  public async getOptionGreeks(
    params: OptionGreeksParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<OptionGreekData[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate request parameters
    if (!params.name || !params.expirydate) {
      return {
        status: false,
        message: 'Both name (underlying) and expirydate are required'
      };
    }

    this.log('Fetching option greeks data', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.OPTION_GREEKS}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get option greeks failed', error);
      const retryOperation = () => this.getOptionGreeks(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }

  /**
   * Get Top Gainers/Losers in derivatives segment
   * Provides data about top gainers and losers in derivatives segment based on price change or open interest.
   * 
   * @param params Parameters containing datatype and expirytype
   * @param options Network configuration options
   * @returns Top gainers or losers data based on the specified parameters
   */
  public async getGainersLosers(
    params: GainersLosersParams,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<GainersLosersResponse>> {
    if (!this.auth.isAuthenticated()) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    // Validate datatype parameter
    if (!params.datatype || !Object.values(GainersLosersDataType).includes(params.datatype)) {
      return {
        status: false,
        message: 'Invalid datatype. Must be one of PercPriceGainers, PercPriceLosers, PercOIGainers, or PercOILosers.'
      };
    }

    // Validate expirytype parameter
    if (!params.expirytype || !Object.values(ExpiryType).includes(params.expirytype)) {
      return {
        status: false,
        message: 'Invalid expirytype. Must be one of NEAR, NEXT, or FAR.'
      };
    }

    this.log('Fetching gainers/losers data', params);

    try {
      return await http.post(
        `${API_URLS.BASE_URL}${API_URLS.GAINERS_LOSERS}`,
        params,
        this.auth.getHeaders(options)
      );
    } catch (error) {
      this.log('Get gainers/losers data failed', error);
      const retryOperation = () => this.getGainersLosers(params, options);
      return this.auth.handleApiError(error, retryOperation);
    }
  }
}