/**
 * API URLs for Angel One SmartAPI
 * Root API endpoint: https://apiconnect.angelone.in
 */
export const API_URLS = {
  BASE_URL: 'https://apiconnect.angelone.in',
  LOGIN: '/rest/auth/angelbroking/user/v1/loginByPassword',
  LOGOUT: '/rest/secure/angelbroking/user/v1/logout',
  GENERATE_TOKEN: '/rest/auth/angelbroking/jwt/v1/generateTokens',
  USER_PROFILE: '/rest/secure/angelbroking/user/v1/getProfile',
  FUNDS: '/rest/secure/angelbroking/user/v1/getRMS',
  HOLDINGS: '/rest/secure/angelbroking/portfolio/v1/getHolding',
  ALL_HOLDINGS: '/rest/secure/angelbroking/portfolio/v1/getAllHolding',
  POSITIONS: '/rest/secure/angelbroking/order/v1/getPosition',
  CONVERT_POSITION: '/rest/secure/angelbroking/order/v1/convertPosition',
  PLACE_ORDER: '/rest/secure/angelbroking/order/v1/placeOrder',
  MODIFY_ORDER: '/rest/secure/angelbroking/order/v1/modifyOrder',
  CANCEL_ORDER: '/rest/secure/angelbroking/order/v1/cancelOrder',
  ORDER_BOOK: '/rest/secure/angelbroking/order/v1/getOrderBook',
  TRADE_BOOK: '/rest/secure/angelbroking/order/v1/getTradeBook',
  ORDER_DETAILS: '/rest/secure/angelbroking/order/v1/details/',  // Individual order endpoint
  
  // Updated market data endpoints
  MARKET_QUOTE: '/rest/secure/angelbroking/market/v1/quote/',  // Supports multiple modes: LTP, OHLC, FULL
  LTP_DATA: '/rest/secure/angelbroking/market/v1/getLTP',      // Legacy LTP endpoint (kept for backward compatibility)
  QUOTE: '/rest/secure/angelbroking/market/v1/getQuote',       // Legacy Quote endpoint (kept for backward compatibility)
  
  // Historical data endpoints
  HISTORICAL_CANDLES: '/rest/secure/angelbroking/historical/v1/getCandleData',
  HISTORICAL_OI: '/rest/secure/angelbroking/historical/v1/getOIData',  // New endpoint for historical Open Interest data
  WEBSOCKET: 'wss://smartapisocket.angelone.in/smart-stream',
  ORDER_STATUS_WEBSOCKET: 'wss://tns.angelone.in/smart-order-update',  // Order status updates websocket
  
  // GTT API endpoints
  GTT_CREATE_RULE: '/rest/secure/angelbroking/gtt/v1/createRule',
  GTT_MODIFY_RULE: '/rest/secure/angelbroking/gtt/v1/modifyRule',
  GTT_CANCEL_RULE: '/rest/secure/angelbroking/gtt/v1/cancelRule',
  GTT_RULE_DETAILS: '/rest/secure/angelbroking/gtt/v1/ruleDetails',
  GTT_RULE_LIST: '/rest/secure/angelbroking/gtt/v1/ruleList',
  
  // Option Greeks API endpoint
  OPTION_GREEKS: '/rest/secure/angelbroking/marketData/v1/optionGreek',
  
  // Brokerage Calculator API endpoint
  BROKERAGE_CALCULATOR: '/rest/secure/angelbroking/brokerage/v1/estimateCharges',
  
  // Margin Calculator API endpoint
  MARGIN_CALCULATOR: '/rest/secure/angelbroking/margin/v1/batch',
  
  // Gainers/Losers API endpoint
  GAINERS_LOSERS: '/rest/secure/angelbroking/marketData/v1/gainersLosers',

  // Instrument API endpoints
  INSTRUMENT_MASTER: 'https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json',
  SEARCH_SCRIP: '/rest/secure/angelbroking/order/v1/searchScrip',
  NSE_INTRADAY_SCRIPS: '/rest/secure/angelbroking/marketData/v1/nseIntraday',
  BSE_INTRADAY_SCRIPS: '/rest/secure/angelbroking/marketData/v1/bseIntraday'
};