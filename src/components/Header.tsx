'use client';

import React from 'react';
import { Database, Clock } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';

export const Header: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 shadow-lg bg-pegadaian-800 border-b-2 border-emerald-500/40">
      <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-md flex items-center justify-center border border-emerald-100">
            <img 
              src="/logo-pegadaian2.png" 
              alt="Pegadaian" 
              className="h-8 md:h-9 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-white leading-tight">
                Desktop Support Pegadaian
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hidden sm:inline-block">
                Kanwil Support
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium hidden sm:block">
              Sistem Pelaporan Troubleshoot & Pekerjaan Harian IT
            </p>
          </div>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Live Date Badge */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-white shadow-sm font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{currentDate}</span>
          </div>

          {/* Database Connection Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold border backdrop-blur-md shadow-sm transition-all ${
            isFirebaseConfigured 
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' 
              : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isFirebaseConfigured ? 'Firestore Ready' : 'Local Storage Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
