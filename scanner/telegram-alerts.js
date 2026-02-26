/**
 * Arboor Telegram Alert System
 * Sends real-time arb alerts to users
 */

require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.ARBOOR_TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

class TelegramAlerter {
  constructor(botToken) {
    this.token = botToken || TELEGRAM_BOT_TOKEN;
    this.api = `https://api.telegram.org/bot${this.token}`;
    this.subscribers = new Map(); // chatId -> settings
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const res = await fetch(`${this.api}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...options
        })
      });
      return await res.json();
    } catch (e) {
      console.error('Telegram send error:', e.message);
      return null;
    }
  }

  /**
   * Format an arb opportunity for Telegram
   */
  formatArbAlert(arb) {
    const emoji = parseFloat(arb.roi) >= 5 ? '🔥' : '🎯';
    const timeLeft = this.getTimeLeft(arb.closeTime);
    
    return `
${emoji} <b>ARB OPPORTUNITY</b> ${emoji}

<b>Asset:</b> ${arb.asset}
<b>Type:</b> ${arb.type.replace(/_/g, ' ')}
<b>ROI:</b> <code>${arb.roi}</code>

<b>Trade:</b>
• Kalshi ${arb.kalshiNo ? 'NO' : 'YES'} @ ${(arb.kalshiNo || arb.kalshiYes).toFixed(2)}¢
• Polymarket ${arb.polyYes ? 'YES' : 'NO'} @ ${(arb.polyYes || arb.polyNo).toFixed(2)}¢

<b>Total Cost:</b> $${arb.totalCost.toFixed(3)} → Returns $1.00
<b>Profit:</b> $${arb.profit.toFixed(3)} per $1

⏰ Closes in: ${timeLeft}

<i>Detected: ${new Date(arb.timestamp).toLocaleTimeString()}</i>
`.trim();
  }

  /**
   * Get human-readable time remaining
   */
  getTimeLeft(closeTime) {
    const now = Date.now();
    const close = new Date(closeTime).getTime();
    const diff = close - now;
    
    if (diff < 0) return 'EXPIRED';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  }

  /**
   * Alert all subscribers about an opportunity
   */
  async alertAll(arb) {
    const message = this.formatArbAlert(arb);
    const roi = parseFloat(arb.roi);
    
    for (const [chatId, settings] of this.subscribers) {
      // Check if this arb meets user's minimum ROI setting
      if (roi >= (settings.minRoi || 3)) {
        await this.sendMessage(chatId, message);
      }
    }
  }

  /**
   * Add a subscriber
   */
  subscribe(chatId, settings = {}) {
    this.subscribers.set(chatId, {
      minRoi: settings.minRoi || 3,
      assets: settings.assets || ['BTC', 'ETH', 'SOL'],
      ...settings
    });
  }

  /**
   * Handle incoming bot commands
   */
  async handleCommand(message) {
    const chatId = message.chat.id;
    const text = message.text || '';
    const [command, ...args] = text.split(' ');

    switch (command) {
      case '/start':
        this.subscribe(chatId);
        await this.sendMessage(chatId, `
🎯 <b>Welcome to Arboor!</b>

I'll alert you when I find arbitrage opportunities across:
• Polymarket
• Kalshi
• Predict.fun

<b>Commands:</b>
/status - Your subscription status
/minroi [%] - Set minimum ROI threshold (default: 3%)
/assets - Choose which assets to track
/stop - Pause alerts

Current settings: 3%+ ROI on BTC, ETH, SOL
        `.trim());
        break;

      case '/status':
        const settings = this.subscribers.get(chatId) || {};
        await this.sendMessage(chatId, `
📊 <b>Your Settings:</b>

Min ROI: ${settings.minRoi || 3}%
Assets: ${(settings.assets || ['BTC', 'ETH', 'SOL']).join(', ')}
Status: ${this.subscribers.has(chatId) ? '✅ Active' : '❌ Inactive'}
        `.trim());
        break;

      case '/minroi':
        const roi = parseFloat(args[0]);
        if (isNaN(roi) || roi < 1 || roi > 20) {
          await this.sendMessage(chatId, '❌ Invalid ROI. Use: /minroi 5 (for 5%)');
        } else {
          const current = this.subscribers.get(chatId) || {};
          this.subscribe(chatId, { ...current, minRoi: roi });
          await this.sendMessage(chatId, `✅ Min ROI set to ${roi}%`);
        }
        break;

      case '/stop':
        this.subscribers.delete(chatId);
        await this.sendMessage(chatId, '⏸️ Alerts paused. Use /start to resume.');
        break;

      default:
        await this.sendMessage(chatId, 'Unknown command. Try /start or /status');
    }
  }
}

module.exports = { TelegramAlerter };
