'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar,
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
  X,
  CalendarX2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { DailyReport } from '@/types/report';
import { calculateSLA, getDayName, formatDateFormatted } from '@/utils/exportUtils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { analyzeChronicIssues } from '@/utils/chronicIssueDetection';
import { ChronicIssuesModal } from '@/components/ChronicIssuesModal';

interface ReportTableProps {
  reports: DailyReport[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onViewDetail: (report: DailyReport) => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: (initialDate?: string) => void;
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<'cycle21' | 'cycle13' | 'month' | 'today' | '7days' | 'all' | 'custom'>('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isChronicModalOpen, setIsChronicModalOpen] = useState(false);

  // Analisis cerdas kendala berulang & unit watchlist
  const chronicSummary = useMemo(() => analyzeChronicIssues(reports), [reports]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Date to YYYY-MM-DD
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle Quick Presets (matches Export Laporan cycles)
  const handlePreset = (type: 'cycle21' | 'cycle13' | 'month' | 'today' | '7days' | 'all') => {
    setActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth(); // 0-indexed
    const today = formatDateISO(curr);

    if (type === 'cycle21') {
      const start = new Date(y, m - 1, 21);
      const end = new Date(y, m, 20);
      setStartDate(formatDateISO(start));
      setEndDate(formatDateISO(end));
    } else if (type === 'cycle13') {
      const start = new Date(y, m - 1, 13);
      const end = new Date(y, m, 12);
      setStartDate(formatDateISO(start));
      setEndDate(formatDateISO(end));
    } else if (type === 'month') {
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

  // Get User-friendly Preset or Date Range Label
  const getPresetLabel = () => {
    if (activePreset === 'cycle13') return 'Siklus 13-12';
    if (activePreset === 'cycle21') return 'Siklus 21-20';
    if (activePreset === 'month') return 'Bulan Ini';
    if (activePreset === 'today') return 'Hari Ini';
    if (activePreset === '7days') return '7 Hari Terakhir';
    if (startDate && endDate) {
      if (startDate === endDate) return formatDateFormatted(startDate);
      return `${formatDateFormatted(startDate)} - ${formatDateFormatted(endDate)}`;
    }
    if (startDate) return `Mulai ${formatDateFormatted(startDate)}`;
    if (endDate) return `Sampai ${formatDateFormatted(endDate)}`;
    return 'Semua Periode';
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, startDate, endDate, itemsPerPage]);

  // Filtered dataset (Search + Category + Date Range Filter)
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.unitKerja && item.unitKerja.toLowerCase().includes(q)) ||
        (item.deskripsiPermohonan && item.deskripsiPermohonan.toLowerCase().includes(q)) ||
        (item.solusiIssue && item.solusiIssue.toLowerCase().includes(q)) ||
        (item.metodePenanganan && item.metodePenanganan.toLowerCase().includes(q)) ||
        (item.picSupport && item.picSupport.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;

      let matchesDate = true;
      if (startDate && endDate) {
        matchesDate = item.tanggalPengerjaan >= startDate && item.tanggalPengerjaan <= endDate;
      } else if (startDate) {
        matchesDate = item.tanggalPengerjaan >= startDate;
      } else if (endDate) {
        matchesDate = item.tanggalPengerjaan <= endDate;
      }

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [reports, searchTerm, selectedCategory, startDate, endDate]);

  // Real-time Dynamic KPI Stats calculation
  const stats = useMemo(() => {
    // 1. Local Date String (YYYY-MM-DD) to prevent UTC offset mismatch
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const targetList = filteredReports;
    const total = targetList.length;
    const todayReports = targetList.filter(r => r.tanggalPengerjaan === todayStr);
    
    // Average SLA in minutes
    let totalMinutes = 0;
    let validSLACount = 0;
    targetList.forEach(r => {
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
  }, [filteredReports]);

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

  // Missing Workdays (Senin - Jumat) Monitoring
  const [missingDaysCycle, setMissingDaysCycle] = useState<'cycle21' | 'cycle13' | 'month' | 'last30'>('cycle21');
  const [isMissingDaysModalOpen, setIsMissingDaysModalOpen] = useState(false);

  const missingWorkdays = useMemo(() => {
    const result: { date: string; dayName: string; formattedDate: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed

    let cycleStart: Date;
    let cycleEnd: Date;

    if (missingDaysCycle === 'cycle21') {
      cycleStart = new Date(y, m - 1, 21);
      const cutOffEnd = new Date(y, m, 20);
      cycleEnd = today < cutOffEnd ? today : cutOffEnd;
    } else if (missingDaysCycle === 'cycle13') {
      cycleStart = new Date(y, m - 1, 13);
      const cutOffEnd = new Date(y, m, 12);
      cycleEnd = today < cutOffEnd ? today : cutOffEnd;
    } else if (missingDaysCycle === 'month') {
      cycleStart = new Date(y, m, 1);
      cycleEnd = today;
    } else {
      cycleStart = new Date(today);
      cycleStart.setDate(cycleStart.getDate() - 30);
      cycleEnd = today;
    }

    const reportedDatesSet = new Set(reports.map(r => r.tanggalPengerjaan));

    const curr = new Date(cycleStart);
    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    while (curr <= cycleEnd) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const yearStr = curr.getFullYear();
        const monthStr = String(curr.getMonth() + 1).padStart(2, '0');
        const dayStr = String(curr.getDate()).padStart(2, '0');
        const isoDate = `${yearStr}-${monthStr}-${dayStr}`;

        if (!reportedDatesSet.has(isoDate)) {
          result.push({
            date: isoDate,
            dayName: indonesianDays[dayOfWeek],
            formattedDate: `${curr.getDate()} ${months[curr.getMonth()]} ${curr.getFullYear()}`
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    return result.reverse();
  }, [reports, missingDaysCycle]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Laporan dengan Pilihan Tanggal seperti Export Laporan */}
        <div className={`relative bg-white p-3.5 sm:p-5 rounded-2xl border transition-all ${
          activePreset !== 'all' || startDate || endDate
            ? 'border-emerald-300 ring-2 ring-emerald-400/20 shadow-md'
            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Total Laporan
            </p>
            {/* Tombol Pilihan Tanggal seperti Export Laporan */}
            <button
              type="button"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-extrabold border transition-all cursor-pointer active:scale-95 ${
                activePreset !== 'all' || startDate || endDate
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
              }`}
              title="Klik untuk memilih rentang tanggal seperti export laporan"
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[150px]">{getPresetLabel()}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800">
                {stats.total.toLocaleString('id-ID')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1 truncate">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>
                  {selectedCategory !== 'Semua' 
                    ? `Kategori: ${selectedCategory}` 
                    : (startDate || endDate) 
                      ? (startDate && endDate ? `${formatDateFormatted(startDate)} s/d ${formatDateFormatted(endDate)}` : getPresetLabel())
                      : (searchTerm ? 'Sesuai Pencarian' : 'Semua Laporan Tercatat')}
                </span>
              </p>
            </div>
            <div 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-pegadaian-50 text-pegadaian-700 flex items-center justify-center border border-pegadaian-100 shrink-0 ml-2 cursor-pointer hover:bg-pegadaian-100 transition-colors"
              title="Pilih Siklus / Rentang Tanggal"
            >
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Popup Dropdown Pilihan Tanggal Persis Seperti Export Laporan */}
          {isDateDropdownOpen && (
            <div 
              ref={dateDropdownRef}
              className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Filter Periode Laporan</h4>
                    <p className="text-[10px] text-slate-400">Siklus cut-off resmi PT. Pegadaian</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Quick Presets (Siklus Cut-off) */}
              <div className="mb-3">
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Pilihan Cepat Siklus:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { handlePreset('cycle13'); setIsDateDropdownOpen(false); }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border text-left active:scale-95 cursor-pointer ${
                      activePreset === 'cycle13'
                        ? 'bg-pegadaian-700 text-white border-pegadaian-700 shadow-xs ring-2 ring-emerald-400/40'
                        : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border-emerald-300/80'
                    }`}
                  >
                    13 Lalu - 12 Ini
                    <span className="block text-[9px] font-normal opacity-80">Siklus 13</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handlePreset('cycle21'); setIsDateDropdownOpen(false); }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border text-left active:scale-95 cursor-pointer ${
                      activePreset === 'cycle21'
                        ? 'bg-pegadaian-700 text-white border-pegadaian-700 shadow-xs ring-2 ring-emerald-400/40'
                        : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border-emerald-300/80'
                    }`}
                  >
                    21 Lalu - 20 Ini
                    <span className="block text-[9px] font-normal opacity-80">Siklus 21</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => { handlePreset('month'); setIsDateDropdownOpen(false); }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center active:scale-95 cursor-pointer ${
                      activePreset === 'month'
                        ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => { handlePreset('today'); setIsDateDropdownOpen(false); }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center active:scale-95 cursor-pointer ${
                      activePreset === 'today'
                        ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => { handlePreset('7days'); setIsDateDropdownOpen(false); }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center active:scale-95 cursor-pointer ${
                      activePreset === '7days'
                        ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    7 Hari
                  </button>
                </div>
              </div>

              {/* 2. Custom Date Range Pickers */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">
                  Rentang Tanggal Kustom:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-medium block">Dari:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setActivePreset('custom');
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-medium block">Sampai:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setActivePreset('custom');
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePreset('all');
                    setIsDateDropdownOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-center cursor-pointer"
                >
                  Semua Data
                </button>
                {(startDate || endDate || activePreset !== 'all') && (
                  <button
                    type="button"
                    onClick={() => setIsDateDropdownOpen(false)}
                    className="flex-1 py-2 text-xs font-extrabold text-white bg-pegadaian-700 hover:bg-pegadaian-800 rounded-xl shadow-xs transition-all text-center cursor-pointer"
                  >
                    Terapkan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Hari Ini */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Pekerjaan Hari Ini</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700 mt-0.5 sm:mt-1">
              {stats.todayCount}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Laporan aktif hari ini
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

        {/* Card 4: Hari Kosong (Senin - Jumat) */}
        <div 
          onClick={() => setIsMissingDaysModalOpen(true)}
          className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-all cursor-pointer hover:shadow-md active:scale-98 ${
            missingWorkdays.length === 0
              ? 'bg-white border-slate-200/80 hover:border-emerald-300'
              : 'bg-gradient-to-br from-amber-50/90 to-amber-100/50 border-amber-200 hover:border-amber-300'
          }`}
          title="Klik untuk melihat daftar hari kerja yang belum ada laporan"
        >
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Hari Kosong (Sen - Jum)</p>
            <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black mt-0.5 sm:mt-1 ${
              missingWorkdays.length === 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {missingWorkdays.length} <span className="text-xs sm:text-sm font-bold">Hari</span>
            </h3>
            <p className={`text-[10px] sm:text-[11px] font-bold mt-0.5 flex items-center gap-1 truncate ${
              missingWorkdays.length === 0 ? 'text-emerald-600' : 'text-amber-700'
            }`}>
              {missingWorkdays.length === 0 ? (
                <>
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Semua Hari Terisi ✨</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Klik untuk lengkapi ⚠️</span>
                </>
              )}
            </p>
          </div>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shrink-0 ml-2 ${
            missingWorkdays.length === 0
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
          }`}>
            <CalendarX2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* 2. Chronic Issues / Problem Management Alert Banner */}
      {chronicSummary.totalUnitsNeedingAction > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 animate-pulse mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">
                  Deteksi Kendala Kronis: {chronicSummary.totalUnitsNeedingAction} Unit Kerja Memerlukan Tindakan Permanen
                </h4>
                {chronicSummary.criticalCount > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full font-black">
                    {chronicSummary.criticalCount} FSCK/OS Butuh Install Ulang
                  </span>
                )}
                {chronicSummary.highCount > 0 && (
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.2 rounded-full font-black">
                    {chronicSummary.highCount} Kabel LAN Wajib Visit
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                Terdapat unit kerja yang berulang kali mengalami kendala sama. Sistem telah menyusun rekomendasi aksi tuntas (Problem Management).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsChronicModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shrink-0 transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Unit Watchlist</span>
            <span className="bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black">
              {chronicSummary.recommendations.length}
            </span>
          </button>
        </div>
      )}

      {/* 3. Category Interactive Horizontal Pill Tabs Bar */}
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

      {/* 4. Main Data Card with Toolbar & Table */}
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
                type="button"
                onClick={() => setIsChronicModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border cursor-pointer ${
                  chronicSummary.totalUnitsNeedingAction > 0
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Buka Unit Watchlist & Rekomendasi Tindak Lanjut"
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${chronicSummary.totalUnitsNeedingAction > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Unit Watchlist</span>
                {chronicSummary.totalUnitsNeedingAction > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    {chronicSummary.totalUnitsNeedingAction}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border border-slate-700 cursor-pointer"
                title="Export Laporan ke Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
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

            {/* Direct Date Inputs (Dari & Sampai) */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 hover:border-slate-300 transition-colors">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[10px] text-slate-400 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs text-slate-700 font-medium bg-transparent border-none outline-none focus:outline-none cursor-pointer w-[110px]"
                  title="Tanggal mulai filter"
                />
              </div>
              <span className="text-slate-300 text-xs font-bold">—</span>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 hover:border-slate-300 transition-colors">
                <span className="text-[10px] text-slate-400 font-medium">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs text-slate-700 font-medium bg-transparent border-none outline-none focus:outline-none cursor-pointer w-[110px]"
                  title="Tanggal akhir filter"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handlePreset('all')}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  title="Hapus filter tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset & Mobile Export Button */}
            <div className="flex items-center gap-2">
              {(searchTerm || startDate || endDate || activePreset !== 'all' || selectedCategory !== 'Semua') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    handlePreset('all');
                    onSelectCategory('Semua');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
              )}

              {chronicSummary.totalUnitsNeedingAction > 0 && (
                <button
                  onClick={() => setIsChronicModalOpen(true)}
                  className="flex sm:hidden items-center gap-1 px-2.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  title="Buka Unit Watchlist"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Watchlist ({chronicSummary.totalUnitsNeedingAction})</span>
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

        {/* 4. Responsive Table View */}
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
                {selectedCategory === 'Semua' && (
                  <th className="py-3.5 px-3 min-w-[135px] border-r border-slate-700/60 text-center">Kategori</th>
                )}
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-700/60">Deskripsi Permohonan</th>
                <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">Metode</th>
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
                  <td colSpan={selectedCategory === 'Semua' ? 14 : 13} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Tidak ada laporan pekerjaan ditemukan</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Coba ubah kata kunci pencarian, filter kategori, atau tanggal yang digunakan.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenAddModal()}
                        className="mt-2 px-4 py-2 bg-pegadaian-600 hover:bg-pegadaian-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
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

                      {/* Kategori (Only shown when viewing 'Semua') */}
                      {selectedCategory === 'Semua' && (
                        <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.category}
                          </span>
                        </td>
                      )}

                      {/* Deskripsi */}
                      <td className="py-3.5 px-4 text-slate-700 border-r border-slate-100">
                        <p className="line-clamp-2 leading-relaxed">{item.deskripsiPermohonan}</p>
                      </td>

                      {/* Metode Penanganan */}
                      <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                          item.metodePenanganan === 'Visit'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.metodePenanganan === 'Remote'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.metodePenanganan || 'Guide'}
                        </span>
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

      {/* Missing Workdays (Senin - Jumat) Modal */}
      {isMissingDaysModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsMissingDaysModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20 shrink-0">
                  <CalendarX2 className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight">Hari Kerja Belum Ada Laporan</h3>
                  <p className="text-xs text-amber-100">Monitoring penginputan hari Senin - Jumat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMissingDaysModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Cycle Filter Switcher */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Periode Pengecekan:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMissingDaysCycle('cycle21')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                      missingDaysCycle === 'cycle21'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    21 Lalu - 20 Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingDaysCycle('cycle13')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                      missingDaysCycle === 'cycle13'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    13 Lalu - 12 Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingDaysCycle('month')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                      missingDaysCycle === 'month'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Bulan Berjalan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingDaysCycle('last30')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                      missingDaysCycle === 'last30'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    30 Hari Terakhir
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                missingWorkdays.length === 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  {missingWorkdays.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-bold">
                    {missingWorkdays.length === 0
                      ? 'Luar biasa! Seluruh hari kerja sudah memiliki laporan.'
                      : `Terdapat ${missingWorkdays.length} hari kerja yang belum diisi.`}
                  </span>
                </div>
              </div>

              {/* List of Missing Workdays */}
              {missingWorkdays.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {missingWorkdays.map((item) => (
                    <div
                      key={item.date}
                      className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200 hover:border-amber-200 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                          {item.dayName.slice(0, 3)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>{item.dayName}, {item.formattedDate}</span>
                          </p>
                          <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <span>Belum ada laporan (0 tiket)</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMissingDaysModalOpen(false);
                          onOpenAddModal(item.date);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title={`Buat laporan untuk tanggal ${item.formattedDate}`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Isi Laporan</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-900">Laporan Anda Sudah Lengkap</h4>
                  <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                    Tidak ada hari kerja (Senin - Jumat) yang terlewat pada siklus ini. Kerja bagus!
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsMissingDaysModalOpen(false)}
                className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chronic Issues & Action Recommendations Modal */}
      <ChronicIssuesModal
        isOpen={isChronicModalOpen}
        onClose={() => setIsChronicModalOpen(false)}
        summary={chronicSummary}
        onSelectUnitFilter={(unitName) => {
          setSearchTerm(unitName);
        }}
        onOpenAddReportWithUnit={(_unitName) => {
          onOpenAddModal();
        }}
      />
    </div>
  );
};
