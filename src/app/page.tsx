// Arboor Landing Page - Blue/Black/White Theme
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [stats, setStats] = useState({ activeArbs: 0, avgRoi: 0, totalToday: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Fetch live stats
    fetch('/api/opportunities')
      .then(r => r.json())
      .then(d => setStats({
        activeArbs: d.stats?.active_arbs || 0,
        avgRoi: d.stats?.avg_roi || 0,
        totalToday: d.stats?.total_today || 0
      }))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-blue-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/5 rounded-full blur-2xl animate-float" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              Arboor
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
            <a href="https://t.me/ArboorBot" className="text-gray-400 hover:text-white transition-colors text-sm">
              Telegram
            </a>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Scanning Active
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Cross-Platform
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                Arbitrage Scanner
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Find risk-free profits across Polymarket, Kalshi, and Predict.fun. 
              Get instant alerts when price discrepancies create guaranteed returns.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/dashboard"
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <span className="relative z-10">Open Dashboard</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              </Link>
              <a 
                href="https://t.me/ArboorBot"
                className="px-8 py-4 border border-white/10 hover:border-blue-500/50 rounded-xl font-semibold text-lg transition-all hover:bg-white/5"
              >
                📱 Telegram Alerts
              </a>
            </div>

            {/* Live Stats */}
            <div className="flex items-center justify-center gap-12 text-center">
              <div className="animate-fade-in-up animation-delay-200">
                <div className="text-4xl font-bold text-blue-400">{stats.activeArbs}</div>
                <div className="text-sm text-gray-500 mt-1">Live Opportunities</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="animate-fade-in-up animation-delay-400">
                <div className="text-4xl font-bold text-white">{stats.avgRoi.toFixed(1)}%</div>
                <div className="text-sm text-gray-500 mt-1">Avg ROI</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="animate-fade-in-up animation-delay-600">
                <div className="text-4xl font-bold text-blue-400">{stats.totalToday}</div>
                <div className="text-sm text-gray-500 mt-1">Found Today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Arbitrage profits from price differences across prediction markets. 
            When two platforms disagree on odds, you can lock in guaranteed returns.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Scan Markets',
                desc: 'We continuously monitor Polymarket, Kalshi, and Predict.fun for price discrepancies on the same events.',
                icon: '🔍'
              },
              {
                step: '02',
                title: 'Find Arbitrage',
                desc: 'When Platform A says YES at 70¢ and Platform B says NO at 25¢, you can guarantee profit.',
                icon: '💰'
              },
              {
                step: '03',
                title: 'Execute & Profit',
                desc: 'Buy both positions before prices converge. No matter the outcome, you win.',
                icon: '✅'
              }
            ].map((item, i) => (
              <div 
                key={i}
                className="group relative p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-blue-500 text-sm font-mono mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Arbitrage */}
      <section className="relative z-10 py-24 border-t border-white/5 bg-gradient-to-b from-blue-950/20 to-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Example Arbitrage
          </h2>
          
          <div className="bg-gray-900/80 rounded-2xl border border-white/10 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                +5.26% ROI
              </span>
              <span className="text-gray-400 text-sm">BTC 15-min Price Prediction</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="text-blue-400 text-sm mb-1">Polymarket</div>
                <div className="text-2xl font-bold">YES @ 76¢</div>
                <div className="text-gray-400 text-sm">Buy "BTC goes up"</div>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <div className="text-purple-400 text-sm mb-1">Kalshi</div>
                <div className="text-2xl font-bold">NO @ 19¢</div>
                <div className="text-gray-400 text-sm">Buy "BTC doesn't go up"</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-lg">
                <span className="text-gray-400">Total Cost:</span>
                <span className="font-bold">95¢</span>
              </div>
              <div className="flex items-center justify-between text-lg mt-2">
                <span className="text-gray-400">Guaranteed Return:</span>
                <span className="font-bold text-green-400">$1.00</span>
              </div>
              <div className="flex items-center justify-between text-lg mt-2">
                <span className="text-gray-400">Profit:</span>
                <span className="font-bold text-green-400">5¢ (5.26%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Supported Platforms</h2>
          <p className="text-gray-400 mb-12">We scan these markets in real-time</p>
          
          <div className="flex flex-wrap items-center justify-center gap-12">
            {[
              { name: 'Polymarket', status: 'Live', color: 'blue' },
              { name: 'Kalshi', status: 'Live', color: 'purple' },
              { name: 'Predict.fun', status: 'Coming Soon', color: 'gray' }
            ].map((platform) => (
              <div key={platform.name} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  platform.status === 'Live' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                }`} />
                <span className="text-xl font-semibold text-gray-300">{platform.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  platform.status === 'Live' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {platform.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-blue-600/20 rounded-3xl p-12 border border-blue-500/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Finding Arbitrage
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join our Telegram bot for instant alerts or use the dashboard to track opportunities in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/dashboard"
                className="px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
              >
                Open Dashboard →
              </Link>
              <a 
                href="https://t.me/ArboorBot"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-all"
              >
                Get Telegram Alerts
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md" />
            <span className="font-semibold text-gray-400">Arboor</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2026 Arboor. Cross-platform prediction market arbitrage.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://t.me/ArboorBot" className="text-gray-400 hover:text-white transition-colors text-sm">
              Telegram
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
