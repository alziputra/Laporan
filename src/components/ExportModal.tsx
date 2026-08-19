'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  AlertCircle
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
  const today = new Date().toISOString().split('T')[0];

  // Default to start of current month
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus] = useState<string>('Semua');

  if (!isOpen) return null;

  // Filtered preview data
  const filteredData = reportsService.filterReportsByDate(
    reports,
    startDate,
    endDate,
    selectedCategory,
    selectedStatus
  );

  const handlePreset = (type: 'today' | '7days' | 'month' | 'all') => {
    const now = new Date();
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (type === 'month') {
      setStartDate(firstDayOfMonth);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pegadaian-700 to-pegadaian-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Export Laporan Excel</h3>
              <p className="text-xs text-pegadaian-100">Filter berdasarkan rentang tanggal & kategori</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pilihan Cepat Periode
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('today')}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:border-pegadaian-500 hover:bg-pegadaian-50 text-slate-700 transition-all"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset('7days')}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:border-pegadaian-500 hover:bg-pegadaian-50 text-slate-700 transition-all"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handlePreset('month')}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:border-pegadaian-500 hover:bg-pegadaian-50 text-slate-700 transition-all"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-200 hover:border-pegadaian-500 hover:bg-pegadaian-50 text-slate-700 transition-all"
              >
                Semua Data
              </button>
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pegadaian-600" />
                <span>Tanggal Awal (Mulai)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pegadaian-600" />
                <span>Tanggal Akhir (Selesai)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Additional Filters Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filter Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white"
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
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${filteredData.length > 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
            <div className="flex items-center gap-2">
              {filteredData.length > 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>
                {filteredData.length > 0
                  ? `Siap meng-export ${filteredData.length} laporan pekerjaan ke Excel`
                  : 'Tidak ada data laporan pada kriteria filter ini'}
              </span>
            </div>
            <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm">
              {filteredData.length} Laporan
            </span>
          </div>

          {/* Export Action Button */}
          <div className="pt-2">
            <button
              onClick={handleExcelExport}
              disabled={filteredData.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-300" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
