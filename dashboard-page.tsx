// src/app/page.tsx - Arboor Dashboard
'use client';

import { useState, useEffect } from 'react';

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

interface Stats {
  active_arbs: number;
  avg_roi: number;
  total_today: number;
  best_roi_today: number;
}

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [stats, setStats] = useState<Stats>({
    active_arbs: 0,
    avg_roi: 0,
    total_today: 0,
    best_roi_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setStats(data.stats || stats);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const getTimeLeft = (closeTime: string) => {
    const diff = new Date(closeTime).getTime() - Date.now();
    if (diff < 0) return 'EXPIRED';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 5) return 'text-green-400';
    if (roi >= 3) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Arboor
            </h1>
            <p className="text-gray-400 text-sm">Cross-platform prediction market arbitrage</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Arbs" value={stats.active_arbs} />
        <StatCard title="Avg ROI" value={`${stats.avg_roi.toFixed(1)}%`} />
        <StatCard title="Found Today" value={stats.total_today} />
        <StatCard title="Best ROI" value={`${stats.best_roi_today.toFixed(1)}%`} highlight />
      </div>

      {/* Opportunities Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Live Opportunities</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
            Scanning markets...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No active arbitrage opportunities right now.
            <br />
            <span className="text-sm">Scanner running every 30 seconds.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ROI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Closes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getAssetEmoji(opp.asset)}</span>
                        <span className="font-medium">{opp.asset}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="text-blue-400">
                          {opp.platform_a} {opp.side_a} @ {(opp.price_a * 100).toFixed(0)}¢
                        </div>
                        <div className="text-purple-400">
                          {opp.platform_b} {opp.side_b} @ {(opp.price_b * 100).toFixed(0)}¢
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-bold text-lg ${getRoiColor(opp.expected_roi)}`}>
                        {opp.expected_roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-400">{getTimeLeft(opp.closes_at)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Execute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Platforms Status */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <PlatformCard name="Polymarket" status="connected" />
        <PlatformCard name="Kalshi" status="pending" />
        <PlatformCard name="Predict.fun" status="connected" />
      </div>

      {/* Telegram Bot CTA */}
      <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Get Instant Alerts</h3>
            <p className="text-gray-400">Receive arb opportunities directly in Telegram</p>
          </div>
          <a 
            href="https://t.me/ArboorBot"
            target="_blank"
            className="bg-blue-500 hover:bg-blue-400 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            📱 Open Telegram Bot
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`bg-gray-900 rounded-xl p-4 border ${highlight ? 'border-purple-500' : 'border-gray-800'}`}>
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-purple-400' : ''}`}>{value}</div>
    </div>
  );
}

function PlatformCard({ name, status }: { name: string; status: 'connected' | 'pending' | 'error' }) {
  const statusColors = {
    connected: 'bg-green-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-gray-400 capitalize">{status}</span>
      </div>
    </div>
  );
}

function getAssetEmoji(asset: string): string {
  const emojis: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'SOL': '◎',
    'XRP': '✕'
  };
  return emojis[asset] || '🔷';
}
