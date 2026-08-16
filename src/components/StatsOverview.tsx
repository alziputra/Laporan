'use client';

import React from 'react';
import { DailyReport } from '@/types/report';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, CalendarDays } from 'lucide-react';

interface StatsOverviewProps {
  reports: DailyReport[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ reports }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const total = reports.length;
  const todayCount = reports.filter(r => r.tanggalPengerjaan === todayStr).length;
  const completed = reports.filter(r => r.status === 'Selesai').length;
  const inProgress = reports.filter(r => r.status === 'Dalam Proses').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Reports */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Laporan</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{total}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Keseluruhan tiket</p>
        </div>
        <div className="p-3 bg-pegadaian-50 text-pegadaian-700 rounded-xl">
          <ClipboardList className="w-6 h-6" />
        </div>
      </div>

      {/* Today Reports */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pekerjaan Hari Ini</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{todayCount}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Tgl {todayStr}</p>
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <CalendarDays className="w-6 h-6" />
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiket Selesai</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{completed}</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {total > 0 ? Math.round((completed / total) * 100) : 0}% Selesai
          </p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dalam Proses</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgress}</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Perlu Penanganan</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Clock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
