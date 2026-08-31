'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Database, Clock, User, LogOut, LogIn, ShieldCheck } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenAuthModal?: (tab?: 'login' | 'register') => void;
  onOpenAdminPanel?: () => void;
  activeView?: 'reports' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal, onOpenAdminPanel, activeView = 'reports' }) => {
  const router = useRouter();
  const { userProfile, isAdmin, logout } = useAuth();

  const handleAdminClick = () => {
    if (onOpenAdminPanel) {
      onOpenAdminPanel();
    } else {
      if (activeView === 'admin') {
        router.push('/');
      } else {
        router.push('/admin');
      }
    }
  };

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
    <header className="sticky top-0 z-30 shadow-md bg-pegadaian-800 border-b-2 border-emerald-500/40">
      <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-xs flex items-center justify-center border border-emerald-100 shrink-0">
            <img 
              src="/logo-pegadaian2.png" 
              alt="Pegadaian" 
              className="h-6 sm:h-8 md:h-9 w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base md:text-xl font-extrabold tracking-tight text-white leading-tight truncate">
                Desktop Support Pegadaian
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hidden md:inline-block">
                Kanwil Support
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium hidden sm:block truncate">
              Sistem Pelaporan Troubleshoot & Pekerjaan Harian IT
            </p>
          </div>
        </div>

        {/* Right Info Badges & User Auth Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs shrink-0">
          {/* Live Date Badge (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-white shadow-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{currentDate}</span>
          </div>

          {/* Database Connection Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold border backdrop-blur-md shadow-xs transition-all text-[11px] ${
            isFirebaseConfigured 
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' 
              : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <Database className="w-3 h-3 text-emerald-300" />
            <span className="hidden md:inline">{isFirebaseConfigured ? 'Firestore Ready' : 'Local Storage Mode'}</span>
            <span className="inline md:hidden">{isFirebaseConfigured ? 'Cloud' : 'Local'}</span>
          </div>

          {/* Admin Panel Button (If User is Admin on Reports View) */}
          {userProfile && (isAdmin || userProfile.role === 'Admin') && activeView !== 'admin' && (
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl font-extrabold text-[11px] sm:text-xs shadow-xs transition-all active:scale-95 border bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white border-amber-400/50"
              title="Buka Panel Admin"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-100" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* User Auth Section */}
          {userProfile ? (
            <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-md p-1 sm:pl-2.5 rounded-xl border border-white/20 text-white shadow-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500 text-white font-extrabold flex items-center justify-center text-[10px] sm:text-xs shadow-inner shrink-0">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white leading-none max-w-[100px] truncate">
                      {userProfile.displayName}
                    </p>
                    {userProfile.role === 'Admin' && (
                      <span className="text-[8px] bg-amber-400/30 text-amber-300 px-1 py-0.2 rounded font-extrabold border border-amber-400/40">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-300 font-medium leading-tight max-w-[100px] truncate">
                    {userProfile.unitKerja}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white border border-red-400/30 transition-all flex items-center gap-1 text-[10px] sm:text-[11px] font-bold"
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs border border-emerald-400/30 transition-all text-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('register')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border border-white/20 transition-all text-xs active:scale-95 hidden sm:flex"
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
