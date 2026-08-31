'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download
} from 'lucide-react';
import { DailyReport } from '@/types/report';
import { exportToExcel } from '@/utils/exportUtils';
import { reportsService } from '@/services/reportsService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: DailyReport[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reports
}) => {
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = formatDateISO(new Date());

  // Default to start of current month
  const now = new Date();
  const firstDayOfMonth = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1));

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus] = useState<string>('Semua');
  const [activePreset, setActivePreset] = useState<string>('month');

  if (!isOpen) return null;

  // Filtered preview data
  const filteredData = reportsService.filterReportsByDate(
    reports,
    startDate,
    endDate,
    selectedCategory,
    selectedStatus
  );

  const handlePreset = (type: 'cycle21' | 'cycle13' | 'month' | 'today' | '7days' | 'all') => {
    setActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth(); // 0-indexed

    if (type === 'cycle21') {
      // 21 Bulan Lalu - 20 Bulan Ini
      const start = new Date(y, m - 1, 21);
      const end = new Date(y, m, 20);
      setStartDate(formatDateISO(start));
      setEndDate(formatDateISO(end));
    } else if (type === 'cycle13') {
      // 13 Bulan Lalu - 12 Bulan Ini
      const start = new Date(y, m - 1, 13);
      const end = new Date(y, m, 12);
      setStartDate(formatDateISO(start));
      setEndDate(formatDateISO(end));
    } else if (type === 'month') {
      // 1 - Akhir Bulan Ini
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setStartDate(formatDateISO(start));
      setEndDate(formatDateISO(end));
    } else if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === '7days') {
      const past = new Date(curr);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDateISO(past));
      setEndDate(today);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExcelExport = () => {
    exportToExcel(filteredData, startDate, endDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[88vh] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Export Laporan Excel</h3>
              <p className="text-xs text-emerald-200">Filter berdasarkan siklus tanggal cut-off & kategori</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Pilihan Cepat Siklus Pegadaian (Cut-off Laporan) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pilihan Cepat Rentang Tanggal:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* 21 Lalu - 20 Ini */}
              <button
                type="button"
                onClick={() => handlePreset('cycle21')}
                className={`py-2 px-2.5 rounded-full text-xs font-extrabold transition-all border text-center active:scale-95 ${
                  activePreset === 'cycle21'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                    : 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border-blue-200'
                }`}
              >
                21 Lalu - 20 Ini
              </button>

              {/* 13 Lalu - 12 Ini */}
              <button
                type="button"
                onClick={() => handlePreset('cycle13')}
                className={`py-2 px-2.5 rounded-full text-xs font-extrabold transition-all border text-center active:scale-95 ${
                  activePreset === 'cycle13'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 border-emerald-300'
                }`}
              >
                13 Lalu - 12 Ini
              </button>

              {/* 1 - Akhir Bln */}
              <button
                type="button"
                onClick={() => handlePreset('month')}
                className={`py-2 px-2.5 rounded-full text-xs font-extrabold transition-all border text-center active:scale-95 ${
                  activePreset === 'month'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs ring-2 ring-slate-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                1 - Akhir Bln
              </button>
            </div>
          </div>

          {/* Preset Tambahan Lainnya */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Periode Lainnya
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('today')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  activePreset === 'today'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset('7days')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  activePreset === '7days'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  activePreset === 'all'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Semua Data
              </button>
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pegadaian-600" />
                <span>Tanggal Awal (Mulai)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pegadaian-600" />
                <span>Tanggal Akhir (Selesai)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Filter Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Hardware Kanwil">Hardware Kanwil</option>
              <option value="Software Kanwil">Software Kanwil</option>
              <option value="Network/Jaringan">Network/Jaringan</option>
              <option value="Video Confference & Meeting">Video Confference & Meeting</option>
              <option value="Malware">Malware</option>
              <option value="Relokasi/Renovasi">Relokasi/Renovasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Data Counter Preview */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-medium ${
            filteredData.length > 0
              ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
              : 'bg-amber-50/80 text-amber-900 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              {filteredData.length > 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-semibold text-[11px] sm:text-xs">
                {filteredData.length > 0
                  ? `Siap meng-export ${filteredData.length} laporan pekerjaan ke Excel`
                  : 'Tidak ada data laporan pada rentang kriteria ini'}
              </span>
            </div>
            <span className="font-extrabold bg-white px-2.5 py-1 rounded-xl shadow-2xs text-xs text-slate-900 shrink-0 border border-slate-100">
              {filteredData.length} Laporan
            </span>
          </div>

          {/* Export Action Button */}
          <div className="pt-1">
            <button
              onClick={handleExcelExport}
              disabled={filteredData.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-black py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
