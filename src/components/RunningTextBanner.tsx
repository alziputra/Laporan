'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Info, Clock, AlertCircle } from 'lucide-react';

export const RunningTextBanner: React.FC = () => {
  const { userProfile } = useAuth();

  const userName = userProfile?.displayName || 'Pengguna';
  const userRole = userProfile?.role || 'Desktop Support';
  const userUnit = userProfile?.unitKerja || userProfile?.kanwil || 'Kanwil Support';

  const messages = [
    `🔒 Keamanan Sesi: Sesi akun Anda terlindungi dengan proteksi Auto-Logout otomatis jika tidak ada aktivitas selama 30 menit.`,
    `👤 Selamat Bertugas, ${userName} (${userRole}) — ${userUnit}.`,
    `🕒 Harap selalu klik tombol "Keluar" setelah selesai menggunakan komputer atau perangkat bersama.`,
    `📊 Pastikan seluruh tiket troubleshooting hardware, software, dan jaringan hari ini telah tercatat dengan rapi.`,
    `💡 Tips: Laporan pekerjaan dapat diekspor ke format Excel kapan saja melalui tombol "Export Data".`
  ];

  // Gabungkan pesan dengan separator elegan
  const marqueeContent = messages.join('   •••   ');

  return (
    <div className="bg-slate-900 border-b border-emerald-500/30 text-white text-[11px] sm:text-xs flex items-center overflow-hidden h-7 sm:h-8 select-none shadow-inner">
      {/* Fixed Left Badge */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-extrabold px-2.5 sm:px-3.5 h-full flex items-center gap-1.5 shrink-0 z-10 shadow-md border-r border-emerald-400/40 text-[10px] sm:text-[11px] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
        <span className="hidden sm:inline">Info & Keamanan</span>
        <span className="inline sm:hidden">Info</span>
      </div>

      {/* Marquee Content */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        {/* Subtle Fade gradients on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-900 to-transparent z-5 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-5 pointer-events-none" />

        <div className="animate-marquee font-medium text-slate-200 tracking-wide cursor-default">
          <span className="inline-block px-4 py-0.5">
            {marqueeContent}
          </span>
          {/* Seamless duplicate block */}
          <span className="inline-block px-4 py-0.5">
            {marqueeContent}
          </span>
        </div>
      </div>
    </div>
  );
};
