'use client';

import Sidebar from '@/components/Sidebar';
import { loadPlayers } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { Users, Trophy, Sword, Gift, TrendingUp } from 'lucide-react';

export default function Home() {
  const [playerCount, setPlayerCount] = useState(0);
  const [plantCounts, setPlantCounts] = useState({ SR: 0, BP: 0, GW: 0 });

  useEffect(() => {
    const loadData = async () => {
      const players = await loadPlayers();
      setPlayerCount(players.length);
      setPlantCounts({
        SR: players.filter(p => p.plant === 'SR').length,
        BP: players.filter(p => p.plant === 'BP').length,
        GW: players.filter(p => p.plant === 'GW').length,
      });
    };
    loadData();
  }, []);

  const stats = [
    { label: 'Total Players', value: playerCount, icon: Users },
    { label: 'SR Players', value: plantCounts.SR, icon: TrendingUp },
    { label: 'BP Players', value: plantCounts.BP, icon: TrendingUp },
    { label: 'GW Players', value: plantCounts.GW, icon: TrendingUp },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Tournament Dashboard</h1>
            <p className="text-gray-600 mt-2">Gateway Golf Tournament at Legacy Golf Club</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href="/players"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Add Players & Scores</span>
                </a>
                <a
                  href="/honest-john"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Trophy className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Run Honest John Calculator</span>
                </a>
                <a
                  href="/plant-battle"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Sword className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Plant vs Plant Battle</span>
                </a>
                <a
                  href="/lucky-draw"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Gift className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Lucky Draw Raffle</span>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Host</p>
                  <p className="text-lg font-semibold text-gray-900">Gateway (GW)</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Venue</p>
                  <p className="text-lg font-semibold text-gray-900">Legacy Golf Club</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Date</p>
                  <p className="text-lg font-semibold text-gray-900">May 24, 2026</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Participating Plants</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">SR</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">BP</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">GW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
