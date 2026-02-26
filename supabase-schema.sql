-- Arboor Database Schema
-- Cross-platform prediction market arbitrage scanner

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE,
  telegram_username TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  plan TEXT DEFAULT 'free', -- free, pro, trader
  plan_expires_at TIMESTAMPTZ,
  
  -- Alert settings
  min_roi_alert DECIMAL(5,2) DEFAULT 3.00,
  alert_assets TEXT[] DEFAULT ARRAY['BTC', 'ETH'],
  alerts_enabled BOOLEAN DEFAULT true,
  last_alert_at TIMESTAMPTZ,
  
  -- Platform connections
  polymarket_wallet TEXT,
  kalshi_email TEXT,
  kalshi_api_key TEXT,
  
  -- Stats
  total_executions INTEGER DEFAULT 0,
  total_profit DECIMAL(12,2) DEFAULT 0
);

-- Arbitrage opportunities (historical + active)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Opportunity details
  asset TEXT NOT NULL, -- BTC, ETH, SOL, etc.
  arb_type TEXT NOT NULL, -- KALSHI_NO_POLY_YES, etc.
  
  -- Platform A (buy side)
  platform_a TEXT NOT NULL,
  side_a TEXT NOT NULL, -- YES or NO
  price_a DECIMAL(6,4) NOT NULL,
  market_id_a TEXT,
  
  -- Platform B (hedge side)
  platform_b TEXT NOT NULL,
  side_b TEXT NOT NULL,
  price_b DECIMAL(6,4) NOT NULL,
  market_id_b TEXT,
  
  -- Arb metrics
  total_cost DECIMAL(6,4) NOT NULL,
  expected_roi DECIMAL(6,4) NOT NULL,
  
  -- Timing
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, expired, executed
  
  -- Index for fast lookups
  CONSTRAINT valid_roi CHECK (expected_roi > 0)
);

-- User executions (when they take an arb)
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  opportunity_id UUID REFERENCES opportunities(id),
  
  -- Execution details
  amount_usd DECIMAL(10,2) NOT NULL,
  
  -- Platform A trade
  tx_hash_a TEXT,
  filled_price_a DECIMAL(6,4),
  
  -- Platform B trade  
  tx_hash_b TEXT,
  filled_price_b DECIMAL(6,4),
  
  -- Results
  actual_cost DECIMAL(10,2),
  actual_profit DECIMAL(10,2),
  actual_roi DECIMAL(6,4),
  
  -- Timing
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' -- pending, partial, complete, failed
);

-- Alert history
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  opportunity_id UUID REFERENCES opportunities(id),
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT DEFAULT 'telegram', -- telegram, email, webhook
  delivered BOOLEAN DEFAULT false
);

-- Platform sync status
CREATE TABLE IF NOT EXISTS platform_sync (
  platform TEXT PRIMARY KEY,
  last_sync TIMESTAMPTZ,
  markets_count INTEGER,
  status TEXT DEFAULT 'ok',
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_asset ON opportunities(asset);
CREATE INDEX IF NOT EXISTS idx_opportunities_roi ON opportunities(expected_roi DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_detected ON opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_user ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);

-- Views
CREATE OR REPLACE VIEW active_arbs AS
SELECT * FROM opportunities 
WHERE status = 'active' 
  AND closes_at > NOW()
ORDER BY expected_roi DESC;

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.telegram_id,
  COUNT(e.id) as total_trades,
  SUM(e.actual_profit) as total_profit,
  AVG(e.actual_roi) as avg_roi,
  MAX(e.executed_at) as last_trade
FROM users u
LEFT JOIN executions e ON e.user_id = u.id AND e.status = 'complete'
GROUP BY u.id
ORDER BY total_profit DESC;
