/**
 * Angelone SmartAPI TypeScript Library
 * A TypeScript wrapper for the Angelone SmartAPI broker API
 */

// Export main SmartAPI client class
export { SmartAPI } from './lib/SmartAPI';

// Export WebSocket client for real-time market data
export { SmartAPIWebSocket, FeedMode } from './lib/WebSocket';

// Export WebSocket client for real-time order updates
export { OrderStatusWebSocket } from './lib/OrderStatusWebSocket';

// Export individual modules for advanced usage
export { Auth } from './modules/auth';
export { Orders } from './modules/orders';
export { GTT } from './modules/gtt';
export { Portfolio } from './modules/portfolio';
export { Brokerage } from './modules/brokerage';
export { MarketData } from './modules/misc';

// Export types for public use
export {
  SmartAPIConfig,
  ApiResponse,
  SessionData,
  OrderParams,
  BracketOrderParams,
  CoverOrderParams,
  HistoricalDataParams,
  CandleData,
  OrderType,
  TransactionType,
  ProductType,
  Variety,
  Validity,
  Exchange,
  HistoricalInterval,
  Holding,
  Position,
  GTTCreateParams,
  GTTModifyParams,
  GTTCancelParams,
  GTTRuleListParams,
  GTTRuleData,
  GTTStatus,
  GTTErrorCodes,
  BrokerageCalculatorParams,
  BrokerageCalculatorOrder,
  BrokerageCalculatorResult,
  OrderChargesSummary,
  ChargeBreakupItem,
  PositionConversionParams,
  RMSData,
  AllHoldingsResponse,
  PostbackData,
  UserProfile,
  OrderDetails,
  OrderResponse,
  MarginCalculatorParams,
  MarginCalculatorPosition,
  MarginCalculatorResult,
  MarginComponents,
  OrderStatusResponse,
  OrderStatusCode,
  OrderStatusData
} from './types';

// Export API URLs for reference
export { API_URLS } from './constants/apiUrls';

// Export error codes and utilities
export {
  ERROR_CODES,
  ErrorCategory,
  getErrorCategory,
  isAuthenticationError,
  isUserError,
  isOrderError,
  getErrorDescription
} from './constants/errorCodes';