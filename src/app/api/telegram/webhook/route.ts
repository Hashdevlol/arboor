// Arboor Telegram Bot Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-load Supabase to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return null;
  
  supabase = createClient(url, key);
  return supabase;
}

function getTelegramApi(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return '';
  return `https://api.telegram.org/bot${token}`;
}

async function sendMessage(chatId: number, text: string, options: any = {}) {
  const api = getTelegramApi();
  if (!api) return;
  
  await fetch(`${api}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    })
  });
}

async function handleCommand(chatId: number, command: string, userId: number, username?: string) {
  const db = getSupabase();
  
  switch (command) {
    case '/start':
      // Register user
      if (db) {
        await db.from('users').upsert({
          telegram_id: userId.toString(),
          telegram_username: username,
          alerts_enabled: true,
          min_roi_alert: 3.0,
          created_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' });
      }

      await sendMessage(chatId, `
🎯 <b>Welcome to Arboor!</b>

Cross-platform prediction market arbitrage scanner.

I'll alert you when I find profitable arbitrage opportunities between:
• <b>Polymarket</b>
• <b>Kalshi</b>
• <b>Predict.fun</b>

<b>Commands:</b>
/status - View your settings
/alerts on/off - Toggle alerts
/minroi [%] - Set minimum ROI alert (default: 3%)
/scan - Force a scan now
/opportunities - Show current arbs
/stats - Your performance stats
/help - Show this message

🔔 You're now subscribed to alerts!
      `.trim());
      break;

    case '/status':
      if (!db) {
        await sendMessage(chatId, '⚠️ Database not configured.');
        return;
      }
      
      const { data: user } = await db
        .from('users')
        .select('*')
        .eq('telegram_id', userId.toString())
        .single();

      if (!user) {
        await sendMessage(chatId, '❌ Not registered. Send /start first.');
        return;
      }

      await sendMessage(chatId, `
📊 <b>Your Status</b>

🔔 Alerts: ${user.alerts_enabled ? '✅ ON' : '❌ OFF'}
📈 Min ROI: ${user.min_roi_alert}%
💰 Executions: ${user.total_executions || 0}
💵 Total Profit: $${(user.total_profit || 0).toFixed(2)}

Last alert: ${user.last_alert_at ? new Date(user.last_alert_at).toLocaleString() : 'Never'}
      `.trim());
      break;

    case '/opportunities':
    case '/scan':
      // Fetch from API instead of DB directly
      try {
        const res = await fetch('https://arboor.vercel.app/api/opportunities');
        const data = await res.json();
        const opps = data.opportunities || [];

        if (!opps.length) {
          await sendMessage(chatId, '🔍 No active arbitrage opportunities right now.\n\nScanner runs every 30 seconds.');
          return;
        }

        let msg = '🎯 <b>Active Arbitrage Opportunities</b>\n\n';
        for (const opp of opps.slice(0, 5)) {
          const timeLeft = Math.max(0, (new Date(opp.closes_at).getTime() - Date.now()) / 60000);
          msg += `<b>${opp.asset}</b> - ${opp.expected_roi.toFixed(1)}% ROI\n`;
          msg += `├ ${opp.platform_a} ${opp.side_a} @ ${(opp.price_a * 100).toFixed(0)}¢\n`;
          msg += `├ ${opp.platform_b} ${opp.side_b} @ ${(opp.price_b * 100).toFixed(0)}¢\n`;
          msg += `└ Closes in ${timeLeft.toFixed(0)}m\n\n`;
        }

        await sendMessage(chatId, msg, {
          reply_markup: {
            inline_keyboard: [[
              { text: '🌐 Open Dashboard', url: 'https://arboor.vercel.app/dashboard' }
            ]]
          }
        });
      } catch (e) {
        await sendMessage(chatId, '⚠️ Scanner temporarily unavailable. Try again shortly.');
      }
      break;

    case '/stats':
      if (!db) {
        await sendMessage(chatId, '⚠️ Database not configured.');
        return;
      }
      
      const { data: stats } = await db
        .from('executions')
        .select('profit, created_at')
        .eq('user_id', userId.toString());

      const totalProfit = stats?.reduce((sum: number, e: any) => sum + (e.profit || 0), 0) || 0;
      const wins = stats?.filter((e: any) => e.profit > 0).length || 0;
      const total = stats?.length || 0;

      await sendMessage(chatId, `
📈 <b>Your Performance</b>

Total Trades: ${total}
Wins: ${wins} (${total > 0 ? ((wins/total)*100).toFixed(0) : 0}%)
Total Profit: $${totalProfit.toFixed(2)}
Avg Profit/Trade: $${total > 0 ? (totalProfit/total).toFixed(2) : '0.00'}
      `.trim());
      break;

    case '/help':
      await sendMessage(chatId, `
🎯 <b>Arboor Commands</b>

/start - Register & subscribe to alerts
/status - View your current settings
/alerts on - Enable price alerts
/alerts off - Disable price alerts
/minroi 5 - Set minimum ROI to 5%
/scan - Force scan for opportunities
/opportunities - Show current arbs
/stats - Your performance statistics
/help - Show this message

<b>How it works:</b>
1. We scan Polymarket, Kalshi, and Predict.fun
2. When prices differ enough for guaranteed profit
3. You get an instant alert with the trade details
4. Execute on both platforms before prices converge

💡 <b>Tip:</b> Set /minroi higher (5-10%) for fewer, better alerts.
      `.trim());
      break;

    default:
      // Check for parameterized commands
      if (command.startsWith('/alerts')) {
        const setting = command.split(' ')[1]?.toLowerCase();
        if (setting === 'on' || setting === 'off') {
          if (db) {
            await db
              .from('users')
              .update({ alerts_enabled: setting === 'on' })
              .eq('telegram_id', userId.toString());
          }
          
          await sendMessage(chatId, `🔔 Alerts ${setting === 'on' ? 'enabled ✅' : 'disabled ❌'}`);
        } else {
          await sendMessage(chatId, 'Usage: /alerts on or /alerts off');
        }
        return;
      }

      if (command.startsWith('/minroi')) {
        const value = parseFloat(command.split(' ')[1]);
        if (!isNaN(value) && value >= 0 && value <= 100) {
          if (db) {
            await db
              .from('users')
              .update({ min_roi_alert: value })
              .eq('telegram_id', userId.toString());
          }
          
          await sendMessage(chatId, `📈 Minimum ROI alert set to ${value}%`);
        } else {
          await sendMessage(chatId, 'Usage: /minroi [0-100]\nExample: /minroi 5');
        }
        return;
      }

      await sendMessage(chatId, 'Unknown command. Send /help for available commands.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    
    // Handle messages
    if (update.message) {
      const { chat, from, text } = update.message;
      
      if (text?.startsWith('/')) {
        await handleCommand(chat.id, text.toLowerCase(), from.id, from.username);
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const { id, data, from, message } = update.callback_query;
      
      const api = getTelegramApi();
      if (api) {
        // Answer callback to remove loading state
        await fetch(`${api}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: id })
        });
      }

      // Handle callback data
      if (data?.startsWith('execute_')) {
        const oppId = data.replace('execute_', '');
        await sendMessage(message.chat.id, `⏳ Executing arbitrage ${oppId}...\n\nThis feature requires connected wallets. Visit the dashboard to set up execution.`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    bot: 'Arboor',
    endpoints: ['POST /api/telegram/webhook']
  });
}
