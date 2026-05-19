'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Trophy, Sword, Gift, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/players', label: 'Players & Scores', icon: Users },
  { href: '/honest-john', label: 'Honest John', icon: Trophy },
  { href: '/plant-battle', label: 'Plant Battle', icon: Sword },
  { href: '/lucky-draw', label: 'Lucky Draw', icon: Gift },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">GW Golf</h1>
        <p className="text-sm text-gray-500 mt-1">Legacy Golf Club</p>
        <p className="text-xs text-gray-400 mt-1">May 24, 2026</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Plants:</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">SR</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">BP</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">GW</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
