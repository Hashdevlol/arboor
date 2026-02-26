# Arboor

**Cross-platform prediction market arbitrage scanner.**

Arboor scans Polymarket, Kalshi, and Predict.fun in real-time to find risk-free arbitrage opportunities. When prices diverge across platforms, you can lock in guaranteed profits.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

## How It Works

Prediction market arbitrage exploits price differences across platforms for the same event:

```
Platform A: YES @ 76¢  +  Platform B: NO @ 19¢  =  95¢ total cost
                                                    ↓
                                              Guaranteed $1 return
                                              = 5.26% profit
```

No matter the outcome, one position wins $1. Your cost was 95¢. Profit: 5¢.

## Features

- **Multi-platform scanning** - Polymarket, Kalshi, Predict.fun
- **Real-time alerts** - Telegram bot notifications
- **Dashboard** - Track live opportunities
- **Configurable thresholds** - Set minimum ROI (default: 3%)
- **Market matching** - Automatically pairs equivalent markets across platforms

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Hashdevlol/arboor.git
cd arboor

# Install dependencies
npm install

# Run the scanner
node scanner/multi-platform-scanner.js

# Or start the web dashboard
npm run dev
```

## Architecture

```
arboor/
├── scanner/
│   └── multi-platform-scanner.js   # Core arbitrage detection
├── src/
│   └── app/
│       ├── page.tsx                # Landing page
│       ├── dashboard/page.tsx      # Live opportunities dashboard
│       └── api/
│           ├── opportunities/      # REST API for arb data
│           └── telegram/webhook/   # Telegram bot webhook
└── package.json
```

## Scanner Usage

```javascript
const { MultiPlatformScanner } = require('./scanner/multi-platform-scanner');

const scanner = new MultiPlatformScanner({
  minSpread: 0.03,  // 3% minimum ROI
  onAlert: (arb) => {
    console.log(`Found ${arb.roi} arb on ${arb.asset}`);
  }
});

// Run continuous scanning
setInterval(() => scanner.scan(), 30000);
```

## API

### GET /api/opportunities

Returns current arbitrage opportunities:

```json
{
  "opportunities": [
    {
      "type": "KALSHI_NO_POLY_YES",
      "asset": "KXBTC-260226-T1200",
      "kalshiNo": 0.19,
      "polyYes": 0.76,
      "totalCost": 0.95,
      "roi": "5.26%",
      "closeTime": "2026-02-26T12:00:00Z"
    }
  ],
  "stats": {
    "active_arbs": 3,
    "avg_roi": 4.2,
    "total_today": 47
  }
}
```

## Telegram Bot

Get instant alerts by messaging [@ArboorBot](https://t.me/ArboorBot):

- `/start` - Subscribe to alerts
- `/status` - Current opportunities
- `/settings` - Configure alert thresholds

## Supported Markets

| Platform | Status | Markets |
|----------|--------|---------|
| Polymarket | ✅ Live | BTC, ETH, SOL 15-min |
| Kalshi | ✅ Live | BTC, ETH 15-min series |
| Predict.fun | 🔜 Soon | Crypto price predictions |

## Configuration

Environment variables:

```env
# Optional - for authenticated Kalshi access
KALSHI_API_KEY=your_key
KALSHI_API_SECRET=your_secret

# Telegram bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Minimum spread to alert (decimal)
MIN_SPREAD=0.03
```

## Risk Disclaimer

While cross-platform arbitrage is theoretically risk-free, execution risk exists:
- Slippage between platforms
- Order fill delays
- Platform withdrawal delays
- Liquidity constraints

Always verify opportunities manually before large positions.

## License

MIT

---

Built by [@0xhashlol](https://twitter.com/0xhashlol)
