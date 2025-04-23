/**
 * SmartAPI client configuration
 */
export interface SmartAPIConfig {
  /**
   * API key provided by Angel One
   */
  apiKey: string;

  /**
   * Client code/user id for Angel One
   */
  clientId?: string;
  
  /**
   * Password for authentication
   */
  password?: string;

  /**
   * Two-factor authentication PIN
   */
  totp?: string;
  
  /**
   * TOTP secret key for automatic generation of TOTP codes
   */
  totpSecret?: string;
  
  /**
   * JWT token for authenticated API calls
   */
  jwtToken?: string;
  
  /**
   * Refresh token for renewing JWT token
   */
  refreshToken?: string;
  
  /**
   * Feedback email (optional)
   */
  feedbackEmail?: string;

  /**
   * Debug mode flag
   */
  debug?: boolean;
}

/**
 * API response format
 */
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  errorcode?: string;
  data?: T;
}

/**
 * User session data
 */
export interface SessionData {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
  state?: string;  // State variable returned in response
}

/**
 * Login request payload
 */
export interface LoginRequest {
  clientcode: string;
  password: string;
  totp?: string;
  state?: string;  // Optional state variable for external applications
}

/**
 * Order types
 */
export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOPLOSS_LIMIT = 'STOPLOSS_LIMIT',
  STOPLOSS_MARKET = 'STOPLOSS_MARKET'
}

/**
 * Transaction types
 */
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

/**
 * Product types
 */
export enum ProductType {
  DELIVERY = 'DELIVERY',    // Cash & Carry for equity (CNC)
  CARRYFORWARD = 'CARRYFORWARD', // Normal for futures and options (NRML)
  MARGIN = 'MARGIN',       // Margin Delivery
  INTRADAY = 'INTRADAY',   // Margin Intraday Squareoff (MIS)
  BO = 'BO',                // Bracket Order (Only for ROBO variety)
  CO = 'CO'                // Cover Order
}

/**
 * Order varieties
 */
export enum Variety {
  NORMAL = 'NORMAL',       // Normal Order (Regular)
  STOPLOSS = 'STOPLOSS',   // Stop loss order
  ROBO = 'ROBO'            // ROBO (Bracket Order)
}

/**
 * Order validity types
 */
export enum Validity {
  DAY = 'DAY',            // Regular Order
  IOC = 'IOC'             // Immediate or Cancel
}

/**
 * Exchange types
 */
export enum Exchange {
  NSE = 'NSE',
  BSE = 'BSE',
  NFO = 'NFO', // NSE Futures & Options
  BFO = 'BFO', // BSE Futures & Options
  CDS = 'CDS', // Currency Derivatives
  MCX = 'MCX'  // Multi Commodity Exchange
}

/**
 * Order request payload
 */
export interface OrderParams {
  symboltoken: string;
  exchange: string;
  tradingsymbol: string;
  quantity: number;
  price: number;
  producttype: ProductType;
  transactiontype: TransactionType;
  ordertype: OrderType;
  variety: Variety;
  triggerprice?: number;
  squareoff?: number;
  stoploss?: number;
  ordertag?: string;
  validity?: Validity;
  disclosedquantity?: number;
}

/**
 * Bracket Order parameters
 */
export interface BracketOrderParams extends OrderParams {
  squareoff: number;      // Target price difference from entry price
  stoploss: number;       // Stoploss price difference from entry price
  trailingStoploss?: number; // Optional trailing stoploss points
}

/**
 * Cover Order parameters
 */
export interface CoverOrderParams extends OrderParams {
  triggerprice: number;   // Stoploss trigger price
}

/**
 * Historical data request parameters
 */
export interface HistoricalDataParams {
  exchange: string;
  symboltoken: string;
  interval: HistoricalInterval;
  fromdate: string;
  todate: string;
}

/**
 * Historical data intervals
 */
export enum HistoricalInterval {
  ONE_MINUTE = 'ONE_MINUTE',
  THREE_MINUTE = 'THREE_MINUTE',
  FIVE_MINUTE = 'FIVE_MINUTE',
  TEN_MINUTE = 'TEN_MINUTE',
  FIFTEEN_MINUTE = 'FIFTEEN_MINUTE',
  THIRTY_MINUTE = 'THIRTY_MINUTE',
  ONE_HOUR = 'ONE_HOUR',
  ONE_DAY = 'ONE_DAY'
}

/**
 * Historical candle data structure
 */
export interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Historical OI data structure
 */
export interface OIData {
  time: string;
  oi: number;
}

/**
 * Holdings data structure
 */
export interface Holding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  t1quantity: number;
  realisedquantity: number;
  quantity: number;
  authorisedquantity: number;
  product: string;
  collateralquantity: number | null;
  collateraltype: string | null;
  haircut: number;
  averageprice: number;
  ltp: number;
  symboltoken: string;
  close: number;
  profitandloss: number;
  pnlpercentage: number;
}

/**
 * Total holdings summary data structure
 */
export interface TotalHolding {
  totalholdingvalue: number;
  totalinvvalue: number;
  totalprofitandloss: number;
  totalpnlpercentage: number;
}

/**
 * Complete holdings response structure
 */
export interface AllHoldingsResponse {
  holdings: Holding[];
  totalholding: TotalHolding;
}

/**
 * Position data structure
 */
export interface Position {
  exchange: string;
  symboltoken: string;
  producttype: string;
  tradingsymbol: string;
  symbolname: string;
  instrumenttype: string;
  priceden: string;
  pricenum: string;
  genden: string;
  gennum: string;
  precision: string;
  multiplier: string;
  boardlotsize: string;
  buyqty: string;
  sellqty: string;
  buyamount: string;
  sellamount: string;
  symbolgroup: string;
  strikeprice: string;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cfbuyqty: string;
  cfsellqty: string;
  cfbuyamount: string;
  cfsellamount: string;
  buyavgprice: string;
  sellavgprice: string;
  avgnetprice: string;
  netvalue: string;
  netqty: string;
  totalbuyvalue: string;
  totalsellvalue: string;
  cfbuyavgprice: string;
  cfsellavgprice: string;
  totalbuyavgprice: string;
  totalsellavgprice: string;
  netprice: string;
}

/**
 * Position conversion parameters
 */
export interface PositionConversionParams {
  exchange: string;
  symboltoken: string;
  oldproducttype: ProductType;
  newproducttype: ProductType;
  tradingsymbol: string;
  symbolname?: string;
  instrumenttype?: string;
  priceden?: string;
  pricenum?: string;
  genden?: string;
  gennum?: string;
  precision?: string;
  multiplier?: string;
  boardlotsize?: string;
  buyqty?: string;
  sellqty?: string;
  buyamount?: string;
  sellamount?: string;
  transactiontype: TransactionType;
  quantity: number;
  type: string;
}

/**
 * User profile data structure
 */
export interface UserProfile {
  clientcode: string;
  name: string;
  email: string;
  mobileno: string;
  exchanges: string[];
  products: string[];
  lastlogintime: string;
  brokerid: string;
}

/**
 * RMS (Risk Management System) / Funds data structure
 */
export interface RMSData {
  net: string;
  availablecash: string;
  availableintradaypayin: string;
  availablelimitmargin: string;
  collateral: string;
  m2munrealized: string;
  m2mrealized: string;
  utiliseddebits: string;
  utilisedspan: string;
  utilisedoptionpremium: string;
  utilisedholdingsales: string;
  utilisedexposure: string;
  utilisedturnover: string;
  utilisedpayout: string;
}

/**
 * Postback/Webhook data structure for real-time order updates
 * This matches the webhook data format shown in the official documentation
 */
export interface PostbackData {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  ordertag: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  parentorderid: string;
  clientcode: string;
}

/**
 * Order response data with uniqueorderid
 */
export interface OrderResponse {
  script?: string;
  orderid: string;
  uniqueorderid: string;
  exchangeorderid?: string;
}

/**
 * Order details response data
 */
export interface OrderDetails {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid?: string;
  ordertag?: string;
}

/**
 * GTT Rule Status types
 */
export enum GTTStatus {
  NEW = 'NEW',
  CANCELLED = 'CANCELLED',
  ACTIVE = 'ACTIVE',
  SENTTOEXCHANGE = 'SENTTOEXCHANGE',
  FORALL = 'FORALL'
}

/**
 * GTT Create Rule Request parameters 
 */
export interface GTTCreateParams {
  tradingsymbol: string;    // Trading symbol (e.g., "SBIN-EQ")
  symboltoken: string;      // Symbol token (e.g., "3045")
  exchange: Exchange;       // Exchange (only NSE and BSE supported)
  transactiontype: TransactionType; // BUY or SELL
  producttype: ProductType; // Currently only DELIVERY and MARGIN supported
  price: string;            // Order price
  qty: string;              // Order quantity
  triggerprice: string;     // Trigger price
  disclosedqty: string;     // Disclosed quantity
}

/**
 * GTT Modify Rule Request parameters
 */
export interface GTTModifyParams {
  id: string;               // GTT Rule ID
  symboltoken: string;      // Symbol token
  exchange: Exchange;       // Exchange
  price: string;            // Order price
  qty: string;              // Order quantity
  triggerprice: string;     // Trigger price
  disclosedqty: string;     // Disclosed quantity
}

/**
 * GTT Cancel Rule Request parameters
 */
export interface GTTCancelParams {
  id: string;               // GTT Rule ID
  symboltoken: string;      // Symbol token
  exchange: Exchange;       // Exchange
}

/**
 * GTT Rule Details Request parameters
 */
export interface GTTRuleDetailsParams {
  id: string;               // GTT Rule ID
}

/**
 * GTT Rule List Request parameters
 */
export interface GTTRuleListParams {
  status: GTTStatus[];      // Array of statuses to filter
  page: number;             // Page number for pagination
  count: number;            // Number of records per page
}

/**
 * GTT Rule Response structure
 */
export interface GTTRuleData {
  id: string;               // Rule ID
  status: string;           // Rule status (e.g., "NEW", "CANCELLED")
  createddate: string;      // Creation date
  updateddate: string;      // Last update date
  expirydate: string;       // Expiry date
  clientid: string;         // Client ID
  tradingsymbol: string;    // Trading symbol
  symboltoken: string;      // Symbol token
  exchange: string;         // Exchange
  transactiontype: string;  // Transaction type
  producttype: string;      // Product type
  price: string;            // Order price
  qty: string;              // Order quantity
  triggerprice: string;     // Trigger price
  disclosedqty: string;     // Disclosed quantity
}

/**
 * GTT Error Codes
 */
export enum GTTErrorCodes {
  AB9000 = 'Internal Server Error',
  AB9001 = 'Invalid Parameters',
  AB9002 = 'Method Not Allowed',
  AB9003 = 'Invalid Client ID',
  AB9004 = 'Invalid Status Array Size',
  AB9005 = 'Invalid Session ID',
  AB9006 = 'Invalid Order Quantity',
  AB9007 = 'Invalid Disclosed Quantity',
  AB9008 = 'Invalid Price',
  AB9009 = 'Invalid Trigger Price',
  AB9010 = 'Invalid Exchange Segment',
  AB9011 = 'Invalid Symbol Token',
  AB9012 = 'Invalid Trading Symbol',
  AB9013 = 'Invalid Rule ID',
  AB9014 = 'Invalid Order Side',
  AB9015 = 'Invalid Product Type',
  AB9016 = 'Invalid Time Period',
  AB9017 = 'Invalid Page Value',
  AB9018 = 'Invalid Count Value'
}

/**
 * Brokerage Calculator Order parameters
 * Used to estimate brokerage charges for orders
 */
export interface BrokerageCalculatorOrder {
  /**
   * Product type (e.g., "DELIVERY", "INTRADAY")
   */
  product_type: string;
  
  /**
   * Transaction type (BUY or SELL)
   */
  transaction_type: string;
  
  /**
   * Quantity of securities
   */
  quantity: string;
  
  /**
   * Price per security
   */
  price: string;
  
  /**
   * Exchange (NSE, BSE, etc.)
   */
  exchange: string;
  
  /**
   * Symbol name
   */
  symbol_name: string;
  
  /**
   * Security token
   */
  token: string;
}

/**
 * Brokerage Calculator Request parameters
 */
export interface BrokerageCalculatorParams {
  /**
   * Array of orders to calculate charges for
   */
  orders: BrokerageCalculatorOrder[];
}

/**
 * Charge breakup item structure for Brokerage Calculator
 */
export interface ChargeBreakupItem {
  /**
   * Name of the charge (e.g., "Exchange Transaction Charges")
   */
  name: string;
  
  /**
   * Amount of the charge
   */
  amount: number;
  
  /**
   * Optional message
   */
  msg: string;
  
  /**
   * Optional further breakdown of the charge
   */
  breakup: ChargeBreakupItem[];
}

/**
 * Charge summary structure for individual orders
 */
export interface OrderChargesSummary {
  /**
   * Total charges for the order
   */
  total_charges: number;
  
  /**
   * Total trade value
   */
  trade_value: number;
  
  /**
   * Breakdown of charges
   */
  breakup: ChargeBreakupItem[];
}

/**
 * Brokerage Calculator Response data structure
 */
export interface BrokerageCalculatorResult {
  /**
   * Summary of all charges
   */
  summary: OrderChargesSummary;
  
  /**
   * Individual breakdown for each order
   */
  charges: OrderChargesSummary[];
}

/**
 * Margin Calculator Position parameters for request
 */
export interface MarginCalculatorPosition {
  /**
   * Exchange type - NSE, BSE, NFO, BFO, CDS, MCX
   */
  exchange: string;
  
  /**
   * Quantity. In the NFO segment it denotes the no. of units in a lot
   */
  qty: number;
  
  /**
   * Price of the security
   */
  price: number;
  
  /**
   * Product type - DELIVERY, CARRYFORWARD, MARGIN, INTRADAY, BO
   */
  productType: ProductType | string;
  
  /**
   * Symbol/token being traded
   */
  token: string;
  
  /**
   * Trade type - BUY, SELL
   */
  tradeType: TransactionType | string;
  
  /**
   * Order type - LIMIT, MARKET, STOPLOSS_LIMIT, STOPLOSS_MARKET
   * Default value is "LIMIT"
   */
  orderType?: OrderType | string;
}

/**
 * Margin Calculator Request parameters
 */
export interface MarginCalculatorParams {
  /**
   * Array of positions to calculate margin for
   * Can contain up to 50 positions in a single request
   */
  positions: MarginCalculatorPosition[];
}

/**
 * Margin Components structure in response
 */
export interface MarginComponents {
  /**
   * Net premium
   */
  netPremium: number;
  
  /**
   * SPAN margin
   */
  spanMargin: number;
  
  /**
   * Margin benefit
   */
  marginBenefit: number;
  
  /**
   * Delivery margin
   */
  deliveryMargin: number;
  
  /**
   * Non-NFO margin
   */
  nonNFOMargin: number;
  
  /**
   * Total options premium
   */
  totOptionsPremium: number;
}

/**
 * Margin Calculator Response data structure
 */
export interface MarginCalculatorResult {
  /**
   * Total margin required for the positions
   */
  totalMarginRequired: number;
  
  /**
   * Breakdown of different margin components
   */
  marginComponents: MarginComponents;
}

/**
 * Option Greeks Request Parameters
 */
export interface OptionGreeksParams {
  /**
   * The underlying stock/index name
   */
  name: string;
  
  /**
   * Expiry date in format like "25JAN2024"
   */
  expirydate: string;
}

/**
 * Option Greeks data for a particular strike price
 */
export interface OptionGreekData {
  /**
   * The underlying stock/index name
   */
  name: string;
  
  /**
   * Expiry date
   */
  expiry: string;
  
  /**
   * Option strike price
   */
  strikePrice: string;
  
  /**
   * Option type (CE - Call, PE - Put)
   */
  optionType: string;
  
  /**
   * Delta - Rate of change of option price with respect to underlying price
   */
  delta: string;
  
  /**
   * Gamma - Rate of change of Delta with respect to underlying price
   */
  gamma: string;
  
  /**
   * Theta - Rate of change of option price with respect to time decay
   */
  theta: string;
  
  /**
   * Vega - Rate of change of option price with respect to volatility
   */
  vega: string;
  
  /**
   * Implied Volatility
   */
  impliedVolatility: string;
  
  /**
   * Trade volume for the option
   */
  tradeVolume: string;
}

/**
 * Option Greeks Response
 */
export interface OptionGreeksResponse {
  /**
   * Array of option greek data for different strike prices
   */
  data: OptionGreekData[];
}

/**
 * Market Data Mode types
 */
export enum MarketDataMode {
  LTP = 'LTP',
  OHLC = 'OHLC',
  FULL = 'FULL'
}

/**
 * Market Quote Request for the Live Market Data API
 */
export interface MarketQuoteRequest {
  /**
   * Mode of data to fetch: LTP, OHLC, or FULL
   */
  mode: MarketDataMode;
  
  /**
   * Map of exchange to array of token strings
   * Example: { "NSE": ["3045", "881"], "NFO": ["58662"] }
   */
  exchangeTokens: Record<string, string[]>;
}

/**
 * Depth information for market data (buy/sell orders)
 */
export interface MarketDepth {
  price: number;
  quantity: number;
  orders: number;
}

/**
 * Full Market Data response for a symbol
 */
export interface FullMarketData {
  exchange: string;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastTradeQty?: number;
  exchFeedTime?: string;
  exchTradeTime?: string;
  netChange?: number;
  percentChange?: number;
  avgPrice?: number;
  tradeVolume?: number;
  opnInterest?: number;
  lowerCircuit?: number;
  upperCircuit?: number;
  totBuyQuan?: number;
  totSellQuan?: number;
  '52WeekLow'?: number;
  '52WeekHigh'?: number;
  depth?: {
    buy: MarketDepth[];
    sell: MarketDepth[];
  };
}

/**
 * OHLC Market Data response for a symbol
 */
export interface OHLCMarketData {
  exchange: string;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * LTP Market Data response for a symbol
 */
export interface LTPMarketData {
  exchange: string;
  tradingSymbol: string;
  symbolToken: string;
  ltp: number;
}

/**
 * Unfetched data response with error information
 */
export interface UnfetchedMarketData {
  exchange: string;
  symbolToken: string;
  message: string;
  errorCode: string;
}

/**
 * Market Quote Response for the Live Market Data API
 */
export interface MarketQuoteResponse {
  fetched: Array<FullMarketData | OHLCMarketData | LTPMarketData>;
  unfetched: UnfetchedMarketData[];
}

/**
 * Data types for Gainers/Losers API
 */
export enum GainersLosersDataType {
  /**
   * Percentage price gainers
   */
  PRICE_GAINERS = 'PercPriceGainers',
  
  /**
   * Percentage price losers
   */
  PRICE_LOSERS = 'PercPriceLosers',
  
  /**
   * Percentage open interest losers
   */
  OI_LOSERS = 'PercOILosers',
  
  /**
   * Percentage open interest gainers
   */
  OI_GAINERS = 'PercOIGainers'
}

/**
 * Expiry type for Gainers/Losers API
 */
export enum ExpiryType {
  /**
   * Current month expiry
   */
  NEAR = 'NEAR',
  
  /**
   * Next month expiry
   */
  NEXT = 'NEXT',
  
  /**
   * Month after next month expiry
   */
  FAR = 'FAR'
}

/**
 * Request parameters for Gainers/Losers API
 */
export interface GainersLosersParams {
  /**
   * Type of data to fetch (Price or OI, Gainers or Losers)
   */
  datatype: GainersLosersDataType;
  
  /**
   * Expiry type (NEAR, NEXT, or FAR)
   */
  expirytype: ExpiryType;
}

/**
 * Single item data structure for Gainers/Losers API response
 */
export interface GainersLosersItem {
  /**
   * Trading symbol of the contract
   */
  tradingSymbol: string;
  
  /**
   * Percentage change in price or open interest
   */
  percentChange: number;
  
  /**
   * Symbol token/ID
   */
  symbolToken: number;
  
  /**
   * Open interest value
   */
  opnInterest: number;
  
  /**
   * Net change in open interest
   */
  netChangeOpnInterest: number;
}

/**
 * Response data structure for Gainers/Losers API
 */
export interface GainersLosersResponse {
  data: GainersLosersItem[];
}

/**
 * Order Status Codes returned by WebSocket
 */
export enum OrderStatusCode {
  CONNECTED = 'AB00',           // after-successful connection
  OPEN = 'AB01',                // open
  CANCELLED = 'AB02',           // cancelled
  REJECTED = 'AB03',            // rejected
  MODIFIED = 'AB04',            // modified
  COMPLETE = 'AB05',            // complete
  AMO_RECEIVED = 'AB06',        // after market order req received
  AMO_CANCELLED = 'AB07',       // cancelled after market order
  AMO_MODIFY_RECEIVED = 'AB08', // modify after market order req received
  OPEN_PENDING = 'AB09',        // open pending
  TRIGGER_PENDING = 'AB10',     // trigger pending
  MODIFY_PENDING = 'AB11'       // modify pending
}

/**
 * Order Status WebSocket Response structure
 */
export interface OrderStatusResponse {
  'user-id': string;            // Client code
  'status-code': string;        // HTTP status code
  'order-status': string;       // Order status code (AB00, AB01, etc.)
  'error-message': string;      // Error message if any
  orderData: OrderStatusData;   // Order details
}

/**
 * Order data structure for Order Status WebSocket
 */
export interface OrderStatusData {
  variety: string;
  ordertype: string;
  ordertag: string;
  producttype: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  duration: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  parentorderid: string;
}

/**
 * Instrument data structure from master list
 */
export interface InstrumentData {
  token: string;           // Symbol token/ID
  symbol: string;          // Trading symbol with exchange suffix (e.g., "RELIANCE-EQ")
  name: string;            // Company/instrument name
  expiry: string;          // Expiry date (for derivatives)
  strike: string;          // Strike price (for options)
  lotsize: string;         // Lot size
  instrumenttype: string;  // Type of instrument (e.g., EQ, FUT, CE, PE)
  exch_seg: string;        // Exchange segment (e.g., nse_cm, nfo)
  tick_size: string;       // Value of a single price tick
}

/**
 * LTP Data request parameters
 */
export interface LtpDataRequest {
  exchange: string;        // Exchange name (e.g., NSE, BSE)
  symboltoken: string;     // Symbol token/ID
  tradingsymbol: string;   // Trading symbol
}

/**
 * LTP Data response structure
 */
export interface LtpData {
  exchange: string;        // Exchange name
  tradingsymbol: string;   // Trading symbol
  symboltoken: string;     // Symbol token/ID
  open: string;            // Open price
  high: string;            // High price
  low: string;             // Low price
  close: string;           // Close price
  ltp: string;             // Last traded price
}

/**
 * Search Scrip request parameters
 */
export interface SearchScripRequest {
  exchange: string;        // Exchange name (e.g., NSE, BSE)
  searchscrip: string;     // Search string/keyword
}

/**
 * Search Scrip result item
 */
export interface SearchScripResult {
  exchange: string;        // Exchange name
  tradingsymbol: string;   // Trading symbol
  symboltoken: string;     // Symbol token/ID
}

/**
 * Intraday scrips data structure
 */
export interface IntradayScrip {
  Exchange: string;        // Exchange name (e.g., NSE, BSE)
  SymbolName: string;      // Symbol name
  Multiplier: string;      // Margin multiplier for intraday trading
}