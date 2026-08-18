'use client';

import React from 'react';
import { Database, Clock, User, LogOut, LogIn, ShieldCheck } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenAuthModal?: (tab?: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal }) => {
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onOpenAuthModal) {
      onOpenAuthModal('login');
    }
  };

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

        {/* Right Info Badges & User Auth Bar */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {/* Live Date Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-white shadow-sm font-medium">
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

          {/* User Auth Section */}
          {userProfile ? (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 pl-3 rounded-xl border border-white/20 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none max-w-[120px] truncate">
                    {userProfile.displayName}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-medium leading-tight max-w-[120px] truncate">
                    {userProfile.unitKerja}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white border border-red-400/30 transition-all ml-1 flex items-center gap-1 text-[11px] font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm border border-emerald-400/30 transition-all text-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border border-white/20 transition-all text-xs active:scale-95 hidden sm:flex"
              >
                <User className="w-3.5 h-3.5 text-emerald-300" />
                <span>Daftar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
