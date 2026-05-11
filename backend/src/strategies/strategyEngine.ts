/**
 * Strategy calculation engine for technical analysis
 * Implements various trading strategies and indicators
 */

export interface TechnicalIndicators {
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  ma?: { fast: number; slow: number };
  bollinger?: { upper: number; middle: number; lower: number };
  atr?: number;
}

export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  epoch?: number;
}

export interface StrategySignal {
  action: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  confidence: number; // 0-1
  reason: string;
}

export class StrategyEngine {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  static calculateRSI(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) {
      return 50; // Neutral
    }

    const closes = candles.map((c) => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = closes[closes.length - i] - closes[closes.length - i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(
    candles: CandleData[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ): { macd: number; signal: number; histogram: number } {
    const closes = candles.map((c) => c.close);

    if (closes.length < slowPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    const macd = fastEMA - slowEMA;

    const macdLine = candles
      .slice(-(slowPeriod - 1))
      .map((_, idx) => this.calculateEMA(closes.slice(0, closes.length - (slowPeriod - 1 - idx)), fastPeriod) -
        this.calculateEMA(closes.slice(0, closes.length - (slowPeriod - 1 - idx)), slowPeriod));

    const signal = this.calculateEMA(macdLine, signalPeriod);
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  /**
   * Calculate Moving Averages
   */
  static calculateMovingAverages(
    candles: CandleData[],
    fastPeriod: number = 10,
    slowPeriod: number = 20,
  ): { fast: number; slow: number } {
    const closes = candles.map((c) => c.close);

    if (closes.length < slowPeriod) {
      return { fast: closes[closes.length - 1], slow: closes[closes.length - 1] };
    }

    const fastMA = closes.slice(-fastPeriod).reduce((a, b) => a + b) / fastPeriod;
    const slowMA = closes.slice(-slowPeriod).reduce((a, b) => a + b) / slowPeriod;

    return { fast: fastMA, slow: slowMA };
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(
    candles: CandleData[],
    period: number = 20,
    stdDevMultiplier: number = 2,
  ): { upper: number; middle: number; lower: number } {
    const closes = candles.map((c) => c.close).slice(-period);

    if (closes.length < period) {
      const last = closes[closes.length - 1];
      return { upper: last, middle: last, lower: last };
    }

    const middle = closes.reduce((a, b) => a + b) / closes.length;
    const variance = closes.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / closes.length;
    const stdDev = Math.sqrt(variance);

    return {
      upper: middle + stdDevMultiplier * stdDev,
      middle,
      lower: middle - stdDevMultiplier * stdDev,
    };
  }

  /**
   * RSI Strategy Signal
   */
  static getRSISignal(rsi: number, oversoldThreshold: number = 30, overboughtThreshold: number = 70): StrategySignal {
    if (rsi < oversoldThreshold) {
      return {
        action: 'buy',
        strength: (oversoldThreshold - rsi) / oversoldThreshold,
        confidence: 0.7,
        reason: `RSI oversold (${rsi.toFixed(2)})`,
      };
    }

    if (rsi > overboughtThreshold) {
      return {
        action: 'sell',
        strength: (rsi - overboughtThreshold) / (100 - overboughtThreshold),
        confidence: 0.7,
        reason: `RSI overbought (${rsi.toFixed(2)})`,
      };
    }

    return { action: 'hold', strength: 0, confidence: 0.5, reason: 'RSI neutral' };
  }

  /**
   * MACD Strategy Signal
   */
  static getMACDSignal(macdData: { macd: number; signal: number; histogram: number }): StrategySignal {
    const { macd, signal, histogram } = macdData;

    if (histogram > 0 && macd > signal) {
      return {
        action: 'buy',
        strength: Math.min(Math.abs(histogram) * 10, 1),
        confidence: 0.75,
        reason: `MACD bullish crossover (hist: ${histogram.toFixed(4)})`,
      };
    }

    if (histogram < 0 && macd < signal) {
      return {
        action: 'sell',
        strength: Math.min(Math.abs(histogram) * 10, 1),
        confidence: 0.75,
        reason: `MACD bearish crossover (hist: ${histogram.toFixed(4)})`,
      };
    }

    return { action: 'hold', strength: 0, confidence: 0.5, reason: 'MACD neutral' };
  }

  /**
   * Moving Average Crossover Strategy Signal
   */
  static getMASignal(fast: number, slow: number, lastFast: number, lastSlow: number): StrategySignal {
    const currentGoldenCross = fast > slow;
    const previousGoldenCross = lastFast > lastSlow;

    if (currentGoldenCross && !previousGoldenCross) {
      return {
        action: 'buy',
        strength: Math.min((fast - slow) / slow, 1),
        confidence: 0.8,
        reason: `Golden cross (Fast: ${fast.toFixed(2)}, Slow: ${slow.toFixed(2)})`,
      };
    }

    if (!currentGoldenCross && previousGoldenCross) {
      return {
        action: 'sell',
        strength: Math.min((slow - fast) / slow, 1),
        confidence: 0.8,
        reason: `Death cross (Fast: ${fast.toFixed(2)}, Slow: ${slow.toFixed(2)})`,
      };
    }

    return { action: 'hold', strength: 0, confidence: 0.6, reason: 'MA trend continuing' };
  }

  /**
   * Bollinger Bands Strategy Signal
   */
  static getBBSignal(price: number, upper: number, middle: number, lower: number): StrategySignal {
    if (price <= lower) {
      return {
        action: 'buy',
        strength: (middle - price) / (middle - lower),
        confidence: 0.7,
        reason: `Price at lower band (${price.toFixed(2)})`,
      };
    }

    if (price >= upper) {
      return {
        action: 'sell',
        strength: (price - middle) / (upper - middle),
        confidence: 0.7,
        reason: `Price at upper band (${price.toFixed(2)})`,
      };
    }

    return { action: 'hold', strength: 0, confidence: 0.5, reason: 'Price within bands' };
  }

  /**
   * Candlestick Pattern Recognition
   */
  static detectCandlePattern(candles: CandleData[]): string {
    if (candles.length < 2) return 'insufficient-data';

    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    // Doji
    if (Math.abs(current.open - current.close) < (current.high - current.low) * 0.1) {
      return 'doji';
    }

    // Hammer
    if (current.close > current.open && current.low < current.open - (current.high - current.open) * 2) {
      return 'hammer';
    }

    // Hanging Man
    if (current.close < current.open && current.low < current.close - (current.close - current.low) * 2) {
      return 'hanging-man';
    }

    // Engulfing (bullish)
    if (
      current.close > current.open &&
      previous.close < previous.open &&
      current.open < previous.close &&
      current.close > previous.open
    ) {
      return 'bullish-engulfing';
    }

    // Engulfing (bearish)
    if (
      current.close < current.open &&
      previous.close > previous.open &&
      current.open > previous.close &&
      current.close < previous.open
    ) {
      return 'bearish-engulfing';
    }

    return 'none';
  }

  /**
   * Candlestick pattern signal
   */
  static getCandlePatternSignal(pattern: string): StrategySignal {
    const bullishPatterns = ['hammer', 'bullish-engulfing', 'morning-star'];
    const bearishPatterns = ['hanging-man', 'bearish-engulfing', 'evening-star'];

    if (bullishPatterns.includes(pattern)) {
      return {
        action: 'buy',
        strength: 0.8,
        confidence: 0.75,
        reason: `Bullish candle pattern: ${pattern}`,
      };
    }

    if (bearishPatterns.includes(pattern)) {
      return {
        action: 'sell',
        strength: 0.8,
        confidence: 0.75,
        reason: `Bearish candle pattern: ${pattern}`,
      };
    }

    return { action: 'hold', strength: 0, confidence: 0, reason: 'No pattern detected' };
  }

  /**
   * Private helper: Calculate EMA
   */
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b) / prices.length;
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) {
      return 0;
    }

    let sum = 0;

    for (let i = candles.length - period - 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = i > 0 ? candles[i - 1] : current;

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      );

      sum += tr;
    }

    return sum / period;
  }
}
