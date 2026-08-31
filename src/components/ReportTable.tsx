'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Monitor,
  Code,
  Wifi,
  Video,
  ShieldAlert,
  Building2,
  ClipboardList,
  Layers,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { DailyReport, ReportCategory } from '@/types/report';
import { calculateSLA, getDayName, formatDateFormatted } from '@/utils/exportUtils';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ReportTableProps {
  reports: DailyReport[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onViewDetail: (report: DailyReport) => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
}

const CATEGORY_ITEMS: { name: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { name: 'Semua', label: 'Semua Kategori', icon: Layers },
  { name: 'Hardware Kanwil', label: 'Hardware', icon: Monitor },
  { name: 'Software Kanwil', label: 'Software', icon: Code },
  { name: 'Network/Jaringan', label: 'Network / Jaringan', icon: Wifi },
  { name: 'Video Confference & Meeting', label: 'Meeting & VC', icon: Video },
  { name: 'Malware', label: 'Malware & Security', icon: ShieldAlert },
  { name: 'Relokasi/Renovasi', label: 'Relokasi / Renovasi', icon: Building2 },
  { name: 'Lainnya', label: 'Lainnya', icon: ClipboardList },
];

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  selectedCategory,
  onSelectCategory,
  onViewDetail,
  onEdit,
  onDelete,
  onOpenAddModal,
  onOpenExportModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, dateFilter, itemsPerPage]);

  // Real-time KPI Stats calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = reports.length;
    const todayReports = reports.filter(r => r.tanggalPengerjaan === todayStr);
    
    // Average SLA in minutes
    let totalMinutes = 0;
    let validSLACount = 0;
    reports.forEach(r => {
      if (r.waktuMulai && r.waktuSelesai) {
        const [sh, sm] = r.waktuMulai.split(':').map(Number);
        const [eh, em] = r.waktuSelesai.split(':').map(Number);
        let startM = (sh || 0) * 60 + (sm || 0);
        let endM = (eh || 0) * 60 + (em || 0);
        if (endM < startM) endM += 24 * 60;
        totalMinutes += (endM - startM);
        validSLACount++;
      }
    });

    const avgMinutes = validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgRemMins = avgMinutes % 60;
    const avgSlaFormatted = `${avgHours}:${avgRemMins.toString().padStart(2, '0')}:00`;

    return {
      total,
      todayCount: todayReports.length,
      avgSlaFormatted,
      avgMinutes
    };
  }, [reports]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: reports.length };
    CATEGORY_ITEMS.forEach(cat => {
      if (cat.name !== 'Semua') {
        counts[cat.name] = reports.filter(r => r.category === cat.name).length;
      }
    });
    return counts;
  }, [reports]);

  // Filtered dataset
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.unitKerja && item.unitKerja.toLowerCase().includes(q)) ||
        (item.deskripsiPermohonan && item.deskripsiPermohonan.toLowerCase().includes(q)) ||
        (item.solusiIssue && item.solusiIssue.toLowerCase().includes(q)) ||
        (item.picSupport && item.picSupport.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchesDate = !dateFilter || item.tanggalPengerjaan === dateFilter;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [reports, searchTerm, selectedCategory, dateFilter]);

  // Pagination Calculations
  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // SLA Color Helper
  const getSLABadge = (slaStr: string) => {
    const [h, m] = slaStr.split(':').map(Number);
    const totalM = (h || 0) * 60 + (m || 0);

    if (totalM <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <Zap className="w-3 h-3 text-emerald-500" />
          <span>{slaStr}</span>
        </span>
      );
    }
    if (totalM <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <span>{slaStr}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span>{slaStr}</span>
      </span>
    );
  };

  // Page Numbers Array Helper
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      }

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. KPI / Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Total Tiket */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Laporan</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 mt-0.5 sm:mt-1">
              {stats.total.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Semua Laporan Tercatat</span>
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-pegadaian-50 text-pegadaian-700 flex items-center justify-center border border-pegadaian-100 shrink-0 ml-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Hari Ini */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Pekerjaan Hari Ini</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700 mt-0.5 sm:mt-1">
              {stats.todayCount}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Tiket tanggal aktif
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 ml-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 3: Rata-rata SLA */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Rata-Rata SLA</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-700 mt-0.5 sm:mt-1 font-mono">
              {stats.avgSlaFormatted}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-teal-600 font-bold mt-0.5 flex items-center gap-1 truncate">
              <Zap className="w-3 h-3 shrink-0" />
              <span>{stats.avgMinutes <= 15 ? 'Respon Cepat ⚡' : 'Standar Layanan'}</span>
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0 ml-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 2. Category Interactive Horizontal Pill Tabs Bar */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORY_ITEMS.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.name] || 0;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-pegadaian-700 text-white shadow-xs ring-2 ring-pegadaian-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-pegadaian-600'}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Data Card with Toolbar & Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight">
                  Daftar Laporan Pekerjaan
                </h3>
                <span className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  {totalItems.toLocaleString('id-ID')} Data
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block mt-0.5">
                Manage Service IT Desktop Support Kantor Wilayah - PT. Pegadaian
              </p>
            </div>

            {/* Quick Export & Add on Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border border-slate-700"
                title="Export Laporan ke Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Laporan</span>
              </button>
            </div>
          </div>

          {/* Search and Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari user, unit, issue, solusi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
              title="Filter Tanggal"
            />

            {/* Reset & Mobile Export Button */}
            <div className="flex items-center gap-2">
              {(searchTerm || dateFilter || selectedCategory !== 'Semua') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                    onSelectCategory('Semua');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
              )}

              <button
                onClick={onOpenExportModal}
                className="flex sm:hidden items-center gap-1 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Responsive Table View (Without Metode column) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs align-middle border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-pegadaian-900 to-slate-900 text-white uppercase text-[11px] font-extrabold tracking-wider border-b-2 border-emerald-500/50">
                <th className="py-3.5 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                <th className="py-3.5 px-4 min-w-[90px] border-r border-slate-700/60">Hari</th>
                <th className="py-3.5 px-4 min-w-[105px] border-r border-slate-700/60">Tanggal</th>
                <th className="py-3.5 px-4 min-w-[130px] border-r border-slate-700/60">PIC Support</th>
                <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">Unit Kerja</th>
                <th className="py-3.5 px-4 min-w-[130px] border-r border-slate-700/60">Nama User</th>
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-700/60">Deskripsi Permohonan</th>
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-700/60">Solusi Issue</th>
                <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">Mulai</th>
                <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">Selesai</th>
                <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">SLA</th>
                <th className="py-3.5 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Tidak ada laporan pekerjaan ditemukan</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Coba ubah kata kunci pencarian, filter kategori, atau tanggal yang digunakan.
                      </p>
                      <button
                        onClick={onOpenAddModal}
                        className="mt-2 px-4 py-2 bg-pegadaian-600 hover:bg-pegadaian-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        + Buat Laporan Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((item, index) => {
                  const slaStr = calculateSLA(item.waktuMulai, item.waktuSelesai);
                  const dayName = getDayName(item.tanggalPengerjaan);
                  const formattedDate = formatDateFormatted(item.tanggalPengerjaan);
                  const rowNumber = startIndex + index + 1;
                  const isEven = index % 2 === 1;

                  return (
                    <tr 
                      key={item.id || index}
                      onClick={() => onViewDetail(item)}
                      className={`transition-colors group cursor-pointer border-b border-slate-100 hover:bg-emerald-50/40 ${
                        isEven ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                        {rowNumber}
                      </td>

                      {/* Hari */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                        {dayName}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-4 text-slate-800 border-r border-slate-100 whitespace-nowrap font-medium">
                        {formattedDate}
                      </td>

                      {/* PIC */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 border-r border-slate-100">
                        <p className="line-clamp-2">{item.picSupport}</p>
                      </td>

                      {/* Unit Kerja */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold border-r border-slate-100">
                        <p className="line-clamp-2">{item.unitKerja}</p>
                      </td>

                      {/* Nama User */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                        <p className="line-clamp-2">{item.nama}</p>
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3.5 px-4 text-slate-700 border-r border-slate-100">
                        <p className="line-clamp-2 leading-relaxed">{item.deskripsiPermohonan}</p>
                      </td>

                      {/* Solusi Issue */}
                      <td className="py-3.5 px-4 text-slate-800 font-medium border-r border-slate-100">
                        <p className="line-clamp-2 leading-relaxed">{item.solusiIssue}</p>
                      </td>

                      {/* Waktu Mulai */}
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                        {item.waktuMulai}
                      </td>

                      {/* Waktu Selesai */}
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                        {item.waktuSelesai}
                      </td>

                      {/* SLA with dynamic badge */}
                      <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                        {getSLABadge(slaStr)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-pegadaian-700 hover:bg-pegadaian-50 transition-all"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                            title="Edit Laporan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-3 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            {/* Items Per Page & Range */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-1.5">
                <span>Tampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white rounded-lg border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>baris</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="text-slate-500 text-[11px] sm:text-xs">
                <strong className="text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</strong>-
                <strong className="text-slate-800">{endIndex}</strong> dari{' '}
                <strong className="text-pegadaian-800">{totalItems.toLocaleString('id-ID')}</strong> Data
              </div>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                        ...
                      </span>
                    );
                  }
                  const pageNum = page as number;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] sm:min-w-[30px] h-7 px-1.5 sm:px-2 rounded-lg font-extrabold text-xs transition-all ${
                        isActive
                          ? 'bg-pegadaian-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Hapus Laporan Pekerjaan"
        message="Apakah Anda yakin ingin menghapus laporan pekerjaan ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};
