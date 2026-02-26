// Arboor Dashboard - Live Arbitrage Scanner
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  platforms?: {
    polymarket: string;
    kalshi: string;
    predictfun: string;
  };
  last_scan?: string;
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
    const interval = setInterval(fetchData, 10000);
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
    if (roi >= 3) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getAssetEmoji = (asset: string): string => {
    if (asset.includes('BTC')) return '₿';
    if (asset.includes('ETH')) return 'Ξ';
    if (asset.includes('SOL')) return '◎';
    return '🔷';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-blue-900/10" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                Arboor
              </span>
            </Link>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs">
              Dashboard
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Scanner Active
            </div>
            {lastUpdate && (
              <span className="text-gray-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Active Arbs" value={stats.active_arbs} icon="🎯" />
          <StatCard title="Avg ROI" value={`${stats.avg_roi.toFixed(1)}%`} icon="📈" />
          <StatCard title="Found Today" value={stats.total_today} icon="🔍" />
          <StatCard title="Best ROI" value={`${stats.best_roi_today.toFixed(1)}%`} icon="🏆" highlight />
        </div>

        {/* Opportunities Table */}
        <div className="bg-gray-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Live Opportunities</h2>
              <p className="text-gray-500 text-sm">Refreshes every 10 seconds</p>
            </div>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 rounded-lg text-blue-400 text-sm transition-colors"
            >
              Refresh Now
            </button>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Scanning markets...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400 mb-2">No active arbitrage opportunities right now</p>
              <p className="text-gray-500 text-sm">Scanner running continuously. Check back soon!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trade</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ROI</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Closes</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getAssetEmoji(opp.asset)}</span>
                          <div>
                            <span className="font-semibold">{opp.asset}</span>
                            <span className="block text-xs text-gray-500">{opp.arb_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-400 font-medium">{opp.platform_a}</span>
                            <span className="text-gray-500">{opp.side_a}</span>
                            <span className="text-white font-mono">{(opp.price_a * 100).toFixed(0)}¢</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-400 font-medium">{opp.platform_b}</span>
                            <span className="text-gray-500">{opp.side_b}</span>
                            <span className="text-white font-mono">{(opp.price_b * 100).toFixed(0)}¢</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono">{(opp.total_cost * 100).toFixed(0)}¢</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-bold text-lg ${getRoiColor(opp.expected_roi)}`}>
                          +{opp.expected_roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-400 font-mono">{getTimeLeft(opp.closes_at)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25">
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

        {/* Platform Status */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <PlatformCard 
            name="Polymarket" 
            status={stats.platforms?.polymarket || 'connected'} 
          />
          <PlatformCard 
            name="Kalshi" 
            status={stats.platforms?.kalshi || 'pending'} 
          />
          <PlatformCard 
            name="Predict.fun" 
            status={stats.platforms?.predictfun || 'pending'} 
          />
        </div>

        {/* Telegram CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-blue-900/30 rounded-2xl p-8 border border-blue-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Get Instant Alerts</h3>
              <p className="text-gray-400">
                Receive arbitrage opportunities directly in Telegram the moment they appear.
              </p>
            </div>
            <a 
              href="https://t.me/ArboorBot"
              target="_blank"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all whitespace-nowrap"
            >
              <span>📱</span>
              <span>Open Telegram Bot</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, highlight = false }: { 
  title: string; 
  value: string | number; 
  icon: string;
  highlight?: boolean 
}) {
  return (
    <div className={`relative p-6 rounded-2xl bg-gray-900/50 border backdrop-blur-sm transition-all hover:border-blue-500/30 ${
      highlight ? 'border-blue-500/30' : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${highlight ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function PlatformCard({ name, status }: { name: string; status: string }) {
  const statusConfig: Record<string, { color: string; bg: string; text: string }> = {
    connected: { color: 'bg-green-400', bg: 'bg-green-500/10', text: 'text-green-400' },
    pending: { color: 'bg-yellow-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    error: { color: 'bg-red-400', bg: 'bg-red-500/10', text: 'text-red-400' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="p-4 rounded-xl bg-gray-900/50 border border-white/5 flex items-center justify-between backdrop-blur-sm">
      <span className="font-medium text-gray-300">{name}</span>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
        <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'connected' ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-medium capitalize ${config.text}`}>{status}</span>
      </div>
    </div>
  );
}
