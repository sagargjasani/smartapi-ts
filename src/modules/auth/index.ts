import { AxiosInstance } from 'axios';
import { API_URLS } from '../../constants/apiUrls';
import {
  SmartAPIConfig,
  ApiResponse,
  SessionData,
  LoginRequest,
  UserProfile
} from '../../types';
import * as http from '../../utils/http';
import { ERROR_CODES } from '../../constants/errorCodes';
import { authenticator } from 'otplib';

/**
 * Authentication module for SmartAPI
 * Handles login, session management, token refresh and logout
 */
export class Auth {
  private apiKey: string;
  private clientId?: string;
  private jwtToken?: string;
  private refreshToken?: string;
  private feedToken?: string;
  private debug: boolean;
  private httpClient: AxiosInstance;
  private lastTokenRefresh: number = 0;
  private minRefreshInterval: number = 60000; // Minimum 1 minute between token refresh attempts
  private totpSecret?: string;

  /**
   * Initialize authentication module
   */
  constructor(config: SmartAPIConfig, httpClient: AxiosInstance, debug: boolean = false) {
    this.apiKey = config.apiKey;
    this.clientId = config.clientId;
    this.jwtToken = config.jwtToken;
    this.refreshToken = config.refreshToken;
    this.debug = debug;
    this.httpClient = httpClient;
    this.totpSecret = config.totpSecret;
  }

  /**
   * Generate a TOTP code using the configured TOTP secret
   * @returns Generated TOTP code or undefined if no secret is set
   */
  public generateTOTP(): string | undefined {
    if (!this.totpSecret) {
      this.log('No TOTP secret configured');
      return undefined;
    }

    try {
      const token = authenticator.generate(this.totpSecret);
      this.log('TOTP generated successfully');
      return token;
    } catch (error) {
      this.log('Failed to generate TOTP', error);
      return undefined;
    }
  }

  /**
   * Set the TOTP secret key
   * @param secret The TOTP secret key
   */
  public setTOTPSecret(secret: string): void {
    this.totpSecret = secret;
    this.log('TOTP secret configured');
  }

  /**
   * Get common headers required for API requests
   * Headers conform to the SmartAPI documentation requirements
   * @param options Optional parameters to customize headers
   * @returns Headers object for API requests
   */
  public getHeaders(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': options?.clientLocalIP || '127.0.0.1',
      'X-ClientPublicIP': options?.clientPublicIP || '127.0.0.1',
      'X-MACAddress': options?.macAddress || '00:00:00:00:00:00',
      'X-PrivateKey': this.apiKey
    };

    // Add authorization header if jwt token is available
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    return headers;
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[SmartAPI:Auth] ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Check if user is authenticated with a valid token
   * @returns Boolean indicating if authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.jwtToken;
  }

  /**
   * Get the JWT token
   * @returns Current JWT token
   */
  public getJwtToken(): string | undefined {
    return this.jwtToken;
  }

  /**
   * Get the feed token for WebSocket connections
   * @returns Feed token
   */
  public getFeedToken(): string | undefined {
    return this.feedToken;
  }

  /**
   * Get the refresh token
   * @returns Current refresh token
   */
  public getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  /**
   * Set tokens received from external sources (like publisher login)
   * @param jwtToken JWT token
   * @param refreshToken Refresh token
   * @param feedToken Feed token
   */
  public setTokens(jwtToken?: string, refreshToken?: string, feedToken?: string): void {
    if (jwtToken) this.jwtToken = jwtToken;
    if (refreshToken) this.refreshToken = refreshToken;
    if (feedToken) this.feedToken = feedToken;
  }

  /**
   * Authenticate user with Angel One API using password
   * @param password User's password
   * @param totp TOTP code from authenticator app for two-factor authentication
   *            (if not provided and totpSecret is set, will be generated automatically)
   * @param state Optional state variable for external applications
   * @param options Network configuration options
   * @returns Authentication result containing jwt token, refresh token and feed token
   */
  public async login(
    password: string, 
    totp?: string, 
    state?: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<SessionData>> {
    if (!this.clientId) {
      return {
        status: false,
        message: 'Client ID is not set. Please provide a client ID in the constructor.'
      };
    }

    const payload: LoginRequest = {
      clientcode: this.clientId,
      password,
    };

    // First check if TOTP was provided directly in the function call
    if (totp) {
      payload.totp = totp;
      this.log('Using provided TOTP code');
    } 
    // If no TOTP was provided, try to generate it from secret
    else if (this.totpSecret) {
      const generatedTotp = this.generateTOTP();
      if (generatedTotp) {
        payload.totp = generatedTotp;
        this.log('Using auto-generated TOTP code from secret');
      } else {
        this.log('Failed to generate TOTP despite having secret');
      }
    } else {
      this.log('No TOTP code provided or secret configured');
    }
    
    // Add state parameter if provided
    if (state) {
      payload.state = state;
    }

    this.log('Attempting login', { clientId: this.clientId });

    try {
      const response = await http.post<any>(
        `${API_URLS.BASE_URL}${API_URLS.LOGIN}`,
        payload,
        this.getHeaders(options)
      );

      if (response.status) {
        // Store the state variable if it was returned in the response
        if (response.data?.state) {
          this.log('State variable returned in login response', { state: response.data.state });
        }
        
        // Generate session with received tokens
        return this.generateSession(response.data?.jwtToken, response.data?.refreshToken);
      }

      return response;
    } catch (error) {
      this.log('Login failed', error);
      return http.handleApiError(error);
    }
  }

  /**
   * Generate a new session using refresh token
   * @param jwtToken JWT token (optional if already set in constructor)
   * @param refreshToken Refresh token (optional if already set in constructor)
   * @param options Network configuration options
   * @returns Session data containing new jwtToken, refreshToken and feedToken
   */
  public async generateSession(
    jwtToken?: string,
    refreshToken?: string,
    options?: {
      clientLocalIP?: string;
      clientPublicIP?: string;
      macAddress?: string;
    }
  ): Promise<ApiResponse<SessionData>> {
    // Use provided tokens or fall back to instance variables
    const jwt = jwtToken || this.jwtToken;
    const refresh = refreshToken || this.refreshToken;

    if (!refresh) {
      return {
        status: false,
        message: 'Refresh token is required for generating a new session'
      };
    }

    // Set or update tokens in instance
    if (jwt) {
      this.jwtToken = jwt;
    }
    this.refreshToken = refresh;

    this.log('Generating session with refresh token', { refreshToken: refresh });

    try {
      const response = await http.post<SessionData>(
        `${API_URLS.BASE_URL}${API_URLS.GENERATE_TOKEN}`,
        { refreshToken: refresh },
        this.getHeaders(options)
      );

      if (response.status && response.data) {
        // Update tokens with new session
        this.jwtToken = response.data.jwtToken;
        this.refreshToken = response.data.refreshToken;
        this.feedToken = response.data.feedToken;
        this.lastTokenRefresh = Date.now();
        
        this.log('Token refresh successful', {
          jwtTokenReceived: !!response.data.jwtToken,
          refreshTokenReceived: !!response.data.refreshToken,
          feedTokenReceived: !!response.data.feedToken
        });
      } else {
        this.log('Token refresh failed with API error', response);
      }

      return response;
    } catch (error) {
      this.log('Generate session failed', error);
      return http.handleApiError(error);
    }
  }

  /**
   * Logout the current user session
   * @param options Network configuration options
   * @returns Logout result
   */
  public async logout(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse> {
    if (!this.jwtToken) {
      return {
        status: false,
        message: 'Not logged in'
      };
    }

    if (!this.clientId) {
      return {
        status: false,
        message: 'Client ID not set. Cannot logout without client ID.'
      };
    }

    this.log('Attempting logout');

    try {
      // API requires clientcode parameter in the payload
      const payload = { clientcode: this.clientId };
      
      const response = await http.post(
        `${API_URLS.BASE_URL}${API_URLS.LOGOUT}`,
        payload,
        this.getHeaders(options)
      );

      if (response.status) {
        // Clear tokens on successful logout
        this.jwtToken = undefined;
        this.refreshToken = undefined;
        this.feedToken = undefined;
      }

      return response;
    } catch (error) {
      this.log('Logout failed', error);
      return http.handleApiError(error);
    }
  }

  /**
   * Get user profile information
   * @param options Network configuration options
   * @returns User profile data
   */
  public async getProfile(options?: {
    clientLocalIP?: string;
    clientPublicIP?: string;
    macAddress?: string;
  }): Promise<ApiResponse<UserProfile>> {
    if (!this.jwtToken) {
      return {
        status: false,
        message: 'Not authenticated. Please login first.'
      };
    }

    this.log('Fetching user profile');

    try {
      return await http.get(
        `${API_URLS.BASE_URL}${API_URLS.USER_PROFILE}`,
        this.getHeaders(options)
      );
    } catch (error) {
      this.log('Get profile failed', error);
      
      // Check if it's an authentication error and try to refresh token
      const errorResponse = http.handleApiError(error);
      if (errorResponse.errorcode && 
          (errorResponse.errorcode === 'AG8002' || errorResponse.errorcode === 'AB8051') && 
          this.refreshToken && 
          Date.now() - this.lastTokenRefresh > this.minRefreshInterval) {
        
        this.log('Token expired, attempting refresh');
        
        try {
          // Try to refresh the token
          const refreshResult = await this.generateSession();
          
          if (refreshResult.status) {
            this.log('Token refreshed successfully, retrying operation');
            // Token refreshed, retry the original operation
            return this.getProfile(options);
          }
        } catch (refreshError) {
          this.log('Token refresh failed', refreshError);
        }
      }
      
      return errorResponse;
    }
  }

  /**
   * Generate a publisher login URL for redirecting users to the SmartAPI login endpoint
   * @param redirectUrl URL to redirect after successful login (must be registered in your MyApps settings)
   * @param state Optional state variable to track session (will be returned in the redirect)
   * @returns The URL to redirect users for login
   */
  public getPublisherLoginUrl(redirectUrl?: string, state?: string): string {
    // Use the exact URL format specified in the documentation: https://smartapi.angelone.in/publisher-login?api_key=xxx&state=statevariable
    const baseUrl = 'https://smartapi.angelone.in/publisher-login';
    const queryParams = new URLSearchParams();
    
    queryParams.append('api_key', this.apiKey);
    
    if (state) {
      queryParams.append('state', state);
    }
    
    // After successful authentication, user will be redirected to this URL
    if (redirectUrl) {
      queryParams.append('redirect_url', redirectUrl);
    }
    
    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Handle API errors, attempting to refresh token if appropriate
   * @param error Original error
   * @param retryFn Function to retry after token refresh
   * @returns API response
   */
  public async handleApiError<T>(error: any, retryFn?: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    const errorResponse = http.handleApiError(error);
    
    // Check if token expired and we should refresh
    if (retryFn && 
        errorResponse.errorcode && 
        (errorResponse.errorcode === 'AG8002' || errorResponse.errorcode === 'AB8051') && 
        this.refreshToken && 
        Date.now() - this.lastTokenRefresh > this.minRefreshInterval) {
      
      this.log('Token expired, attempting refresh');
      
      try {
        // Try to refresh the token
        const refreshResult = await this.generateSession();
        
        if (refreshResult.status) {
          this.log('Token refreshed successfully, retrying operation');
          // Token refreshed, retry the original operation
          return retryFn();
        }
      } catch (refreshError) {
        this.log('Token refresh failed', refreshError);
      }
    }
    
    return errorResponse;
  }
}