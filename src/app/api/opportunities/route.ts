// Real-time arbitrage opportunities API
import { NextResponse } from 'next/server';

const POLYMARKET_API = 'https://clob.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// BTC/ETH 15-min markets on Polymarket (will-price-go-up series)
const POLYMARKET_MARKETS = {
  BTC_UP: { name: 'BTC 15m Up', conditionPrefix: 'will-the-price-of-bitcoin' },
  ETH_UP: { name: 'ETH 15m Up', conditionPrefix: 'will-the-price-of-ethereum' }
};

interface ArbOpportunity {
  id: string;
  asset: string;
  arb_type: string;
  platform_a: string;
  side_a: string;
  price_a: number;
  platform_b: string;
  side_b: string;
  price_b: number;
  total_cost: number;
  expected_roi: number;
  closes_at: string;
  detected_at: string;
}

// Fetch active Kalshi crypto markets
async function fetchKalshiMarkets(ticker: string): Promise<any[]> {
  try {
    const res = await fetch(`${KALSHI_API}/markets?series_ticker=${ticker}&status=open`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.markets || [];
  } catch (e) {
    console.error(`Kalshi fetch error (${ticker}):`, e);
    return [];
  }
}

// Fetch Polymarket active crypto markets
async function fetchPolymarketCryptoMarkets(): Promise<any[]> {
  try {
    // Get active markets from gamma API
    const res = await fetch('https://gamma-api.polymarket.com/markets?closed=false&tag=crypto', {
      next: { revalidate: 10 }
    });
    
    if (!res.ok) return [];
    
    const markets = await res.json();
    
    // Filter for 15-min price prediction markets
    return markets.filter((m: any) => 
      m.question?.toLowerCase().includes('15 min') ||
      m.question?.toLowerCase().includes('15-min') ||
      m.question?.toLowerCase().includes('next 15')
    );
  } catch (e) {
    console.error('Polymarket fetch error:', e);
    return [];
  }
}

// Get best prices from orderbook
async function getPolymarketPrices(tokenId: string): Promise<{ ask: number; bid: number } | null> {
  try {
    const res = await fetch(`${POLYMARKET_API}/book?token_id=${tokenId}`, {
      next: { revalidate: 5 }
    });
    
    if (!res.ok) return null;
    
    const book = await res.json();
    return {
      ask: parseFloat(book.asks?.[0]?.price) || 1,
      bid: parseFloat(book.bids?.[0]?.price) || 0
    };
  } catch {
    return null;
  }
}

// Find arbitrage opportunities
async function findArbitrageOpportunities(): Promise<ArbOpportunity[]> {
  const opportunities: ArbOpportunity[] = [];
  const now = new Date();
  
  // Fetch markets in parallel
  const [kalshiBTC, kalshiETH, polymarkets] = await Promise.all([
    fetchKalshiMarkets('KXBTC'),
    fetchKalshiMarkets('KXETH'),
    fetchPolymarketCryptoMarkets()
  ]);

  // Process Kalshi BTC vs Polymarket
  for (const kalshiMarket of kalshiBTC) {
    const kalshiYes = (kalshiMarket.yes_ask || 50) / 100;
    const kalshiNo = (kalshiMarket.no_ask || 50) / 100;
    
    // Find matching Polymarket market
    const polyMatch = polymarkets.find((p: any) => 
      p.question?.toLowerCase().includes('bitcoin') ||
      p.question?.toLowerCase().includes('btc')
    );
    
    if (polyMatch?.tokens?.[0]) {
      const polyPrices = await getPolymarketPrices(polyMatch.tokens[0].token_id);
      
      if (polyPrices) {
        // Arb: Kalshi NO + Poly YES
        const totalCost1 = kalshiNo + polyPrices.ask;
        if (totalCost1 < 0.97) {
          const roi = ((1 - totalCost1) / totalCost1) * 100;
          opportunities.push({
            id: `btc-${Date.now()}-1`,
            asset: 'BTC/15m',
            arb_type: 'cross_platform',
            platform_a: 'Polymarket',
            side_a: 'YES',
            price_a: polyPrices.ask,
            platform_b: 'Kalshi',
            side_b: 'NO',
            price_b: kalshiNo,
            total_cost: totalCost1,
            expected_roi: roi,
            closes_at: kalshiMarket.close_time || new Date(now.getTime() + 900000).toISOString(),
            detected_at: now.toISOString()
          });
        }
        
        // Arb: Kalshi YES + Poly NO
        const polyNo = 1 - polyPrices.bid;
        const totalCost2 = kalshiYes + polyNo;
        if (totalCost2 < 0.97) {
          const roi = ((1 - totalCost2) / totalCost2) * 100;
          opportunities.push({
            id: `btc-${Date.now()}-2`,
            asset: 'BTC/15m',
            arb_type: 'cross_platform',
            platform_a: 'Kalshi',
            side_a: 'YES',
            price_a: kalshiYes,
            platform_b: 'Polymarket',
            side_b: 'NO',
            price_b: polyNo,
            total_cost: totalCost2,
            expected_roi: roi,
            closes_at: kalshiMarket.close_time || new Date(now.getTime() + 900000).toISOString(),
            detected_at: now.toISOString()
          });
        }
      }
    }
  }

  // Process Kalshi ETH vs Polymarket (similar logic)
  for (const kalshiMarket of kalshiETH) {
    const kalshiYes = (kalshiMarket.yes_ask || 50) / 100;
    const kalshiNo = (kalshiMarket.no_ask || 50) / 100;
    
    const polyMatch = polymarkets.find((p: any) => 
      p.question?.toLowerCase().includes('ethereum') ||
      p.question?.toLowerCase().includes('eth')
    );
    
    if (polyMatch?.tokens?.[0]) {
      const polyPrices = await getPolymarketPrices(polyMatch.tokens[0].token_id);
      
      if (polyPrices) {
        const totalCost1 = kalshiNo + polyPrices.ask;
        if (totalCost1 < 0.97) {
          const roi = ((1 - totalCost1) / totalCost1) * 100;
          opportunities.push({
            id: `eth-${Date.now()}-1`,
            asset: 'ETH/15m',
            arb_type: 'cross_platform',
            platform_a: 'Polymarket',
            side_a: 'YES',
            price_a: polyPrices.ask,
            platform_b: 'Kalshi',
            side_b: 'NO',
            price_b: kalshiNo,
            total_cost: totalCost1,
            expected_roi: roi,
            closes_at: kalshiMarket.close_time || new Date(now.getTime() + 900000).toISOString(),
            detected_at: now.toISOString()
          });
        }
        
        const polyNo = 1 - polyPrices.bid;
        const totalCost2 = kalshiYes + polyNo;
        if (totalCost2 < 0.97) {
          const roi = ((1 - totalCost2) / totalCost2) * 100;
          opportunities.push({
            id: `eth-${Date.now()}-2`,
            asset: 'ETH/15m',
            arb_type: 'cross_platform',
            platform_a: 'Kalshi',
            side_a: 'YES',
            price_a: kalshiYes,
            platform_b: 'Polymarket',
            side_b: 'NO',
            price_b: polyNo,
            total_cost: totalCost2,
            expected_roi: roi,
            closes_at: kalshiMarket.close_time || new Date(now.getTime() + 900000).toISOString(),
            detected_at: now.toISOString()
          });
        }
      }
    }
  }

  // Sort by ROI
  return opportunities.sort((a, b) => b.expected_roi - a.expected_roi);
}

export async function GET() {
  try {
    const opportunities = await findArbitrageOpportunities();
    
    // Calculate stats
    const stats = {
      active_arbs: opportunities.length,
      avg_roi: opportunities.length > 0 
        ? opportunities.reduce((sum, o) => sum + o.expected_roi, 0) / opportunities.length 
        : 0,
      total_today: opportunities.length, // Would track in DB for real count
      best_roi_today: opportunities.length > 0 ? opportunities[0].expected_roi : 0,
      platforms: {
        polymarket: 'connected',
        kalshi: opportunities.some(o => o.platform_b === 'Kalshi') ? 'connected' : 'pending',
        predictfun: 'pending'
      },
      last_scan: new Date().toISOString()
    };

    return NextResponse.json({
      opportunities,
      stats
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Scanner error:', error);
    
    // Return fallback with simulated data during API issues
    return NextResponse.json({
      opportunities: [],
      stats: {
        active_arbs: 0,
        avg_roi: 0,
        total_today: 0,
        best_roi_today: 0,
        platforms: {
          polymarket: 'error',
          kalshi: 'error',
          predictfun: 'pending'
        },
        last_scan: new Date().toISOString(),
        error: 'Scanner temporarily unavailable'
      }
    });
  }
}
