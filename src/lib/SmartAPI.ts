import axios, { AxiosInstance } from 'axios';
import { API_URLS } from '../constants/apiUrls';
import { SmartAPIConfig } from '../types';
import * as http from '../utils/http';

// Import modules
import { Auth } from '../modules/auth';
import { Orders } from '../modules/orders';
import { GTT } from '../modules/gtt';
import { Portfolio } from '../modules/portfolio';
import { Brokerage } from '../modules/brokerage';
import { MarketData } from '../modules/misc';
import { Instruments } from '../modules/instruments';

/**
 * SmartAPI client for interacting with Angel One broker API
 */
export class SmartAPI {
  private httpClient: AxiosInstance;
  private debug: boolean;

  // Module instances
  private _auth: Auth;
  private _orders: Orders;
  private _gtt: GTT;
  private _portfolio: Portfolio;
  private _brokerage: Brokerage;
  private _marketData: MarketData;
  private _instruments: Instruments;

  // Forward compatibility methods
  // These methods are bound in constructor after module initialization
  public login: typeof Auth.prototype.login;
  public generateSession: typeof Auth.prototype.generateSession;
  public getFeedToken: typeof Auth.prototype.getFeedToken;
  public logout: typeof Auth.prototype.logout;
  public getProfile: typeof Auth.prototype.getProfile;
  public placeOrder: typeof Orders.prototype.placeOrder;
  public placeBracketOrder: typeof Orders.prototype.placeBracketOrder;
  public placeCoverOrder: typeof Orders.prototype.placeCoverOrder;
  public modifyOrder: typeof Orders.prototype.modifyOrder;
  public cancelOrder: typeof Orders.prototype.cancelOrder;
  public getOrderBook: typeof Orders.prototype.getOrderBook;
  public getTradeBook: typeof Orders.prototype.getTradeBook;
  public getPositions: typeof Portfolio.prototype.getPositions;
  public getHoldings: typeof Portfolio.prototype.getHoldings;
  public getAllHoldings: typeof Portfolio.prototype.getAllHoldings;
  public getLTP: typeof MarketData.prototype.getLTP;
  public getMultiLTP: typeof MarketData.prototype.getMultiLTP;
  public getQuote: typeof MarketData.prototype.getQuote;
  public getMultiQuotes: typeof MarketData.prototype.getMultiQuotes;
  public getHistoricalData: typeof MarketData.prototype.getHistoricalData;
  public getHistoricalDataPaginated: typeof MarketData.prototype.getHistoricalDataPaginated;
  public getFunds: typeof Portfolio.prototype.getFunds;
  public createGTT: typeof GTT.prototype.createRule;
  public modifyGTT: typeof GTT.prototype.modifyRule;
  public cancelGTT: typeof GTT.prototype.cancelRule;
  public getGTTDetails: typeof GTT.prototype.getRuleDetails;
  public getGTTList: typeof GTT.prototype.getRuleList;
  public getPublisherLoginUrl: typeof Auth.prototype.getPublisherLoginUrl;
  public getWebhookInfo: typeof MarketData.prototype.getWebhookInfo;
  public calculateBrokerage: typeof Brokerage.prototype.calculate;
  public calculateMargin: typeof Brokerage.prototype.calculateMargin;
  public getOrderDetails: typeof Orders.prototype.getOrderDetails;
  public getOptionGreeks: typeof MarketData.prototype.getOptionGreeks;
  
  // New methods from Instruments module
  public getInstruments: typeof Instruments.prototype.getInstruments;
  public searchScrip: typeof Instruments.prototype.searchScrip;
  public getLtp: typeof Instruments.prototype.getLtp;
  public getNseIntradayScrips: typeof Instruments.prototype.getNseIntradayScrips;
  public getBseIntradayScrips: typeof Instruments.prototype.getBseIntradayScrips;
  
  // Static methods
  static parseWebhookData = MarketData.parseWebhookData;

  /**
   * Initialize a new SmartAPI client
   * @param config SmartAPI configuration
   */
  constructor(config: SmartAPIConfig) {
    this.debug = config.debug || false;
    
    // Initialize HTTP client with base URL
    this.httpClient = http.createHttpClient(API_URLS.BASE_URL);
    
    // Initialize all modules
    this._auth = new Auth(config, this.httpClient, this.debug);
    this._orders = new Orders(this._auth, this.httpClient, this.debug);
    this._gtt = new GTT(this._auth, this.httpClient, this.debug);
    this._portfolio = new Portfolio(this._auth, this.httpClient, this.debug);
    this._brokerage = new Brokerage(this._auth, this.httpClient, this.debug);
    this._marketData = new MarketData(this._auth, this.httpClient, this.debug);
    this._instruments = new Instruments(this._auth, this.httpClient, this.debug);
    
    // Bind forward compatibility methods after modules are initialized
    this.login = this._auth.login.bind(this._auth);
    this.generateSession = this._auth.generateSession.bind(this._auth);
    this.getFeedToken = this._auth.getFeedToken.bind(this._auth);
    this.logout = this._auth.logout.bind(this._auth);
    this.getProfile = this._auth.getProfile.bind(this._auth);
    this.placeOrder = this._orders.placeOrder.bind(this._orders);
    this.placeBracketOrder = this._orders.placeBracketOrder.bind(this._orders);
    this.placeCoverOrder = this._orders.placeCoverOrder.bind(this._orders);
    this.modifyOrder = this._orders.modifyOrder.bind(this._orders);
    this.cancelOrder = this._orders.cancelOrder.bind(this._orders);
    this.getOrderBook = this._orders.getOrderBook.bind(this._orders);
    this.getTradeBook = this._orders.getTradeBook.bind(this._orders);
    this.getPositions = this._portfolio.getPositions.bind(this._portfolio);
    this.getHoldings = this._portfolio.getHoldings.bind(this._portfolio);
    this.getAllHoldings = this._portfolio.getAllHoldings.bind(this._portfolio);
    this.getLTP = this._marketData.getLTP.bind(this._marketData);
    this.getMultiLTP = this._marketData.getMultiLTP.bind(this._marketData);
    this.getQuote = this._marketData.getQuote.bind(this._marketData);
    this.getMultiQuotes = this._marketData.getMultiQuotes.bind(this._marketData);
    this.getHistoricalData = this._marketData.getHistoricalData.bind(this._marketData);
    this.getHistoricalDataPaginated = this._marketData.getHistoricalDataPaginated.bind(this._marketData);
    this.getFunds = this._portfolio.getFunds.bind(this._portfolio);
    this.createGTT = this._gtt.createRule.bind(this._gtt);
    this.modifyGTT = this._gtt.modifyRule.bind(this._gtt);
    this.cancelGTT = this._gtt.cancelRule.bind(this._gtt);
    this.getGTTDetails = this._gtt.getRuleDetails.bind(this._gtt);
    this.getGTTList = this._gtt.getRuleList.bind(this._gtt);
    this.getPublisherLoginUrl = this._auth.getPublisherLoginUrl.bind(this._auth);
    this.getWebhookInfo = this._marketData.getWebhookInfo.bind(this._marketData);
    this.calculateBrokerage = this._brokerage.calculate.bind(this._brokerage);
    this.calculateMargin = this._brokerage.calculateMargin.bind(this._brokerage);
    this.getOrderDetails = this._orders.getOrderDetails.bind(this._orders);
    this.getOptionGreeks = this._marketData.getOptionGreeks.bind(this._marketData);
    
    // Bind new instruments methods
    this.getInstruments = this._instruments.getInstruments.bind(this._instruments);
    this.searchScrip = this._instruments.searchScrip.bind(this._instruments);
    this.getLtp = this._instruments.getLtp.bind(this._instruments);
    this.getNseIntradayScrips = this._instruments.getNseIntradayScrips.bind(this._instruments);
    this.getBseIntradayScrips = this._instruments.getBseIntradayScrips.bind(this._instruments);
  }

  /**
   * Authentication module
   * Handles login, session management, logout, and user profile
   */
  get auth() {
    return this._auth;
  }

  /**
   * Orders module
   * Handles placing, modifying, cancelling orders and fetching order details
   */
  get orders() {
    return this._orders;
  }

  /**
   * GTT (Good Till Triggered) module
   * Handles creating, modifying, and cancelling GTT rules
   */
  get gtt() {
    return this._gtt;
  }

  /**
   * Portfolio module
   * Handles positions, holdings, funds and related functionality
   */
  get portfolio() {
    return this._portfolio;
  }

  /**
   * Brokerage module
   * Handles brokerage calculation
   */
  get brokerage() {
    return this._brokerage;
  }

  /**
   * Market Data module
   * Handles data operations like historical candles, LTP, quotes, etc.
   */
  get marketData() {
    return this._marketData;
  }

  /**
   * Instruments module
   * Handles operations related to market instruments, scrips and LTP data
   */
  get instruments() {
    return this._instruments;
  }
}