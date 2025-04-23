/**
 * SmartAPI Error Codes
 * Error responses come with the name of the exception generated internally by the API server.
 * These can be used to define corresponding exceptions in your code.
 */

/**
 * Error codes and their descriptions from official Angel One SmartAPI documentation
 */
export const ERROR_CODES = {
  // Authentication errors
  AG8001: 'Invalid Token',
  AG8002: 'Token Expired',
  AG8003: 'Token missing',
  AB8050: 'Invalid Refresh Token',
  AB8051: 'Refresh Token Expired',
  
  // Login and user errors
  AB1000: 'Invalid Email Or Password',
  AB1001: 'Invalid Email',
  AB1002: 'Invalid Password Length',
  AB1003: 'Client Already Exists',
  AB1004: 'Something Went Wrong, Please Try After Sometime',
  AB1005: 'User Type Must Be USER',
  AB1006: 'Client Is Block For Trading',
  AB1031: 'Old Password Mismatch',
  AB1032: 'User Not Found',
  
  // Order errors
  AB1007: 'AMX Error',
  AB1008: 'Invalid Order Variety',
  AB1009: 'Symbol Not Found',
  AB1010: 'AMX Session Expired',
  AB1011: 'Client not login',
  AB1012: 'Invalid Product Type',
  AB1013: 'Order not found',
  AB1014: 'Trade not found',
  AB1015: 'Holding not found',
  AB1016: 'Position not found',
  AB1017: 'Position conversion failed',
  AB1018: 'Failed to get symbol details',
  AB4008: 'ordertag length should be less than 20 characters',
  AB2002: 'ROBO order is block',
  
  // Generic errors
  AB2000: 'Error not specified',
  AB2001: 'Internal Error, Please Try After Sometime'
};

/**
 * Error code categories
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  USER = 'USER',
  ORDER = 'ORDER',
  GENERIC = 'GENERIC'
}

/**
 * Get the category of an error code
 * @param errorCode Error code to categorize
 * @returns Error category
 */
export function getErrorCategory(errorCode: string): ErrorCategory {
  if (errorCode.startsWith('AG80') || errorCode.startsWith('AB805')) {
    return ErrorCategory.AUTHENTICATION;
  } else if (errorCode.startsWith('AB10') && parseInt(errorCode.substr(4, 2)) <= 6 || 
            errorCode === 'AB1031' || errorCode === 'AB1032') {
    return ErrorCategory.USER;
  } else if (errorCode.startsWith('AB10') && parseInt(errorCode.substr(4, 2)) > 6 || 
            errorCode === 'AB4008' || errorCode === 'AB2002') {
    return ErrorCategory.ORDER;
  } else {
    return ErrorCategory.GENERIC;
  }
}

/**
 * Check if an error is an authentication error
 * @param errorCode Error code to check
 * @returns True if the error is an authentication error
 */
export function isAuthenticationError(errorCode: string): boolean {
  return getErrorCategory(errorCode) === ErrorCategory.AUTHENTICATION;
}

/**
 * Check if an error is a user-related error
 * @param errorCode Error code to check
 * @returns True if the error is a user-related error
 */
export function isUserError(errorCode: string): boolean {
  return getErrorCategory(errorCode) === ErrorCategory.USER;
}

/**
 * Check if an error is an order-related error
 * @param errorCode Error code to check
 * @returns True if the error is an order-related error
 */
export function isOrderError(errorCode: string): boolean {
  return getErrorCategory(errorCode) === ErrorCategory.ORDER;
}

/**
 * Get the description for an error code
 * @param errorCode Error code to get description for
 * @returns Error description or "Unknown Error" if not found
 */
export function getErrorDescription(errorCode: string): string {
  return ERROR_CODES[errorCode as keyof typeof ERROR_CODES] || 'Unknown Error';
}