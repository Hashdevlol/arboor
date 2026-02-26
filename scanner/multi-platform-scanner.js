/**
 * Arboor Multi-Platform Arbitrage Scanner
 * Scans Polymarket + Kalshi + Predict.fun for arb opportunities
 */

const POLYMARKET_API = 'https://clob.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// Market mappings - same underlying asset across platforms
const MARKET_PAIRS = {
  'BTC_15M': {
    polymarket: {
      upToken: '0x...', // Fill with actual token IDs
      downToken: '0x...',
      conditionId: null // Will be fetched dynamically
    },
    kalshi: {
      ticker: 'KXBTC', // Kalshi BTC 15-min series
      seriesPattern: /^KXBTC-\d{6}-T\d{4}$/
    }
  },
  'ETH_15M': {
    polymarket: {
      upToken: '0x...',
      downToken: '0x...',
      conditionId: null
    },
    kalshi: {
      ticker: 'KXETH',
      seriesPattern: /^KXETH-\d{6}-T\d{4}$/
    }
  }
};

class MultiPlatformScanner {
  constructor(config = {}) {
    this.minSpread = config.minSpread || 0.03; // 3% minimum
    this.alertCallback = config.onAlert || console.log;
    this.opportunities = [];
  }

  /**
   * Fetch Polymarket orderbook for a token
   */
  async getPolymarketOdds(tokenId) {
    try {
      const res = await fetch(`${POLYMARKET_API}/book?token_id=${tokenId}`);
      const book = await res.json();
      
      // Best ask = what we'd pay to buy YES
      const bestAsk = book.asks?.[0]?.price || null;
      // Best bid = what we'd get selling YES
      const bestBid = book.bids?.[0]?.price || null;
      
      return { bestAsk, bestBid, book };
    } catch (e) {
      console.error('Polymarket fetch error:', e.message);
      return null;
    }
  }

  /**
   * Fetch Kalshi event prices
   */
  async getKalshiOdds(seriesPrefix) {
    try {
      // Get active events in series
      const res = await fetch(`${KALSHI_API}/events?series_ticker=${seriesPrefix}&status=open`);
      const data = await res.json();
      
      const opportunities = [];
      
      for (const event of data.events || []) {
        // Get markets for this event
        const marketsRes = await fetch(`${KALSHI_API}/markets?event_ticker=${event.event_ticker}`);
        const marketsData = await marketsRes.json();
        
        for (const market of marketsData.markets || []) {
          opportunities.push({
            ticker: market.ticker,
            title: market.title,
            yesPrice: market.yes_ask / 100, // Kalshi uses cents
            noPrice: market.no_ask / 100,
            closeTime: market.close_time,
            volume: market.volume
          });
        }
      }
      
      return opportunities;
    } catch (e) {
      console.error('Kalshi fetch error:', e.message);
      return [];
    }
  }

  /**
   * Scan Predict.fun markets
   */
  async getPredictFunOdds() {
    try {
      // Predict.fun uses similar API structure
      const res = await fetch('https://api.predict.fun/v1/markets?category=crypto&status=open');
      const data = await res.json();
      
      return data.markets?.map(m => ({
        id: m.id,
        title: m.title,
        yesPrice: m.yes_price,
        noPrice: m.no_price,
        closeTime: m.close_time
      })) || [];
    } catch (e) {
      console.error('Predict.fun fetch error:', e.message);
      return [];
    }
  }

  /**
   * Find arbitrage opportunities across platforms
   * 
   * Arb exists when:
   * Platform A: YES @ 70¢ + Platform B: NO @ 25¢ = 95¢ cost for guaranteed $1
   * Profit = 5¢ per $1 wagered = 5.26% ROI
   */
  findArbitrage(polyOdds, kalshiOdds, predictOdds) {
    const opportunities = [];
    
    // Compare Polymarket YES vs Kalshi NO
    for (const kalshi of kalshiOdds) {
      // Simple arb: If Kalshi NO + Poly YES < 1.00, there's profit
      const totalCost = kalshi.noPrice + (polyOdds?.bestAsk || 1);
      
      if (totalCost < (1 - this.minSpread)) {
        const profit = 1 - totalCost;
        const roi = (profit / totalCost) * 100;
        
        opportunities.push({
          type: 'KALSHI_NO_POLY_YES',
          asset: kalshi.ticker,
          kalshiNo: kalshi.noPrice,
          polyYes: polyOdds.bestAsk,
          totalCost,
          profit,
          roi: roi.toFixed(2) + '%',
          closeTime: kalshi.closeTime,
          timestamp: new Date().toISOString()
        });
      }
      
      // Reverse: Kalshi YES + Poly NO
      const reverseCost = kalshi.yesPrice + (1 - (polyOdds?.bestBid || 0));
      
      if (reverseCost < (1 - this.minSpread)) {
        const profit = 1 - reverseCost;
        const roi = (profit / reverseCost) * 100;
        
        opportunities.push({
          type: 'KALSHI_YES_POLY_NO',
          asset: kalshi.ticker,
          kalshiYes: kalshi.yesPrice,
          polyNo: 1 - polyOdds.bestBid,
          totalCost: reverseCost,
          profit,
          roi: roi.toFixed(2) + '%',
          closeTime: kalshi.closeTime,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return opportunities;
  }

  /**
   * Run a full scan across all platforms
   */
  async scan() {
    console.log(`[${new Date().toISOString()}] Starting multi-platform scan...`);
    
    // Fetch from all platforms in parallel
    const [kalshiBTC, kalshiETH] = await Promise.all([
      this.getKalshiOdds('KXBTC'),
      this.getKalshiOdds('KXETH')
    ]);
    
    // For now, use placeholder Polymarket data (will wire up real tokens)
    const mockPolyOdds = {
      bestAsk: 0.76,
      bestBid: 0.74
    };
    
    // Find arbs
    const btcArbs = this.findArbitrage(mockPolyOdds, kalshiBTC, []);
    const ethArbs = this.findArbitrage(mockPolyOdds, kalshiETH, []);
    
    const allArbs = [...btcArbs, ...ethArbs];
    
    // Alert on new opportunities
    for (const arb of allArbs) {
      if (parseFloat(arb.roi) >= this.minSpread * 100) {
        this.alertCallback(arb);
      }
    }
    
    this.opportunities = allArbs;
    return allArbs;
  }
}

module.exports = { MultiPlatformScanner };

// CLI mode
if (require.main === module) {
  const scanner = new MultiPlatformScanner({
    minSpread: 0.03,
    onAlert: (arb) => {
      console.log('\n🎯 ARB OPPORTUNITY FOUND:');
      console.log(JSON.stringify(arb, null, 2));
    }
  });
  
  scanner.scan().then(arbs => {
    console.log(`\nFound ${arbs.length} opportunities`);
  });
}
