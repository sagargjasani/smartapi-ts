import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { getErrorDescription } from '../constants/errorCodes';

/**
 * Creates a configured axios instance for making HTTP requests
 * @param baseURL The base URL for all requests
 * @param headers The default headers to include with each request
 * @returns Axios instance
 */
export const createHttpClient = (baseURL: string, headers: Record<string, string> = {}) => {
  return axios.create({
    baseURL,
    headers
  });
};

/**
 * Handles API errors and formats error responses consistently
 * According to SmartAPI documentation format:
 * {
 *   "status": false,
 *   "message": "Error message",
 *   "errorcode": "ERROR_CODE",
 *   "data": null
 * }
 * @param error The error caught from an API request
 * @returns Formatted API error response
 */
export const handleApiError = (error: any): ApiResponse => {
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    let errorCode = error.response.data?.errorcode || String(error.response.status);
    let errorMessage = error.response.data?.message || 'API request failed';
    
    // Use our error descriptions if we have a known error code
    if (error.response.data?.errorcode) {
      const betterDescription = getErrorDescription(error.response.data.errorcode);
      if (betterDescription !== 'Unknown Error') {
        errorMessage = betterDescription;
      }
    }
    
    return {
      status: false,
      message: errorMessage,
      errorcode: errorCode,
      data: null // According to the documentation, failed responses have data: null
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: false,
      message: 'No response received from server',
      errorcode: 'NETWORK_ERROR',
      data: null
    };
  } else {
    // Error in setting up the request
    return {
      status: false,
      message: error.message || 'Unknown error occurred',
      errorcode: 'REQUEST_SETUP_ERROR',
      data: null
    };
  }
};

/**
 * Makes an HTTP GET request to the specified endpoint
 * @param url The endpoint URL
 * @param headers Additional headers to include
 * @param params Query parameters
 * @returns Promise with the API response
 */
export const get = async <T>(
  url: string,
  headers: Record<string, string> = {},
  params?: any
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      headers,
      params
    };
    
    const response: AxiosResponse = await axios.get(url, config);
    return response.data as ApiResponse<T>;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Makes an HTTP POST request to the specified endpoint
 * @param url The endpoint URL
 * @param data The request body data
 * @param headers Additional headers to include
 * @returns Promise with the API response
 */
export const post = async <T>(
  url: string,
  data: any,
  headers: Record<string, string> = {}
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      headers
    };
    
    const response: AxiosResponse = await axios.post(url, data, config);
    return response.data as ApiResponse<T>;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Makes an HTTP PUT request to the specified endpoint
 * @param url The endpoint URL
 * @param data The request body data
 * @param headers Additional headers to include
 * @returns Promise with the API response
 */
export const put = async <T>(
  url: string,
  data: any,
  headers: Record<string, string> = {}
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      headers
    };
    
    const response: AxiosResponse = await axios.put(url, data, config);
    return response.data as ApiResponse<T>;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Makes an HTTP DELETE request to the specified endpoint
 * @param url The endpoint URL
 * @param headers Additional headers to include
 * @param params Query parameters
 * @returns Promise with the API response
 */
export const del = async <T>(
  url: string,
  headers: Record<string, string> = {},
  params?: any
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      headers,
      params
    };
    
    const response: AxiosResponse = await axios.delete(url, config);
    return response.data as ApiResponse<T>;
  } catch (error) {
    return handleApiError(error);
  }
};