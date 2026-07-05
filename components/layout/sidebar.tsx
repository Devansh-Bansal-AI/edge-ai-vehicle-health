'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Wrench, Terminal, History, Zap, LogOut, Truck,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/fleet', label: 'Fleet', icon: Truck },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/diagnostics', label: 'Diagnostics', icon: Terminal },
  { href: '/history', label: 'History', icon: History },
];

const FLEET_VEHICLES = [
  { id: 'vehicle-1', name: 'Fleet Unit 1', subtitle: 'Heavy Hauler', vin: 'EDGE-AI-FLT-001' },
  { id: 'vehicle-2', name: 'Fleet Unit 2', subtitle: 'City Runner', vin: 'EDGE-AI-FLT-002' },
  { id: 'vehicle-3', name: 'Fleet Unit 3', subtitle: 'Highway Cruiser', vin: 'EDGE-AI-FLT-003' },
  { id: 'vehicle-4', name: 'Fleet Unit 4', subtitle: 'Off-Road', vin: 'EDGE-AI-FLT-004' },
  { id: 'default-vehicle', name: 'Fleet Unit 7', subtitle: 'Primary', vin: 'EDGE-AI-SIM-001' },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehicleId = searchParams?.get('vehicle') ?? 'default-vehicle';

  // Find active vehicle details
  const activeVehicle = FLEET_VEHICLES.find(v => v.id === vehicleId) ?? FLEET_VEHICLES[4];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#ffffff] border-r border-rose-100 flex flex-col z-40" id="sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-rose-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(190,18,60,0.6)]">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">EdgeAI</h1>
            <p className="text-[10px] text-gray-400">Vehicle Health</p>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="px-5 py-4 border-b border-rose-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Vehicle</span>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 font-medium">{activeVehicle.name} <span className="text-[10px] text-gray-400">({activeVehicle.subtitle})</span></p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">VIN: {activeVehicle.vin}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/fleet' 
            ? pathname === '/fleet' 
            : pathname?.startsWith(item.href);

          // Append vehicle parameter to maintain context across pages
          const hrefWithParam = vehicleId && vehicleId !== 'default-vehicle' && item.href !== '/fleet'
            ? `${item.href}?vehicle=${vehicleId}`
            : item.href;

          return (
            <Link
              key={item.href}
              href={hrefWithParam}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-[0_8px_20px_-8px_rgba(190,18,60,0.7)]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-rose-50 border border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-rose-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
