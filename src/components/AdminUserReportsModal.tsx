'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  Search,
  Eye,
  Clock,
  Zap,
  AlertCircle,
  Sparkles,
  Download,
  Loader2,
  User,
  Building,
  Mail,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { DailyReport, ReportCategory } from '@/types/report';
import { UserProfile } from '@/types/user';
import { reportsService } from '@/services/reportsService';
import { calculateSLA, getDayName, formatDateFormatted, exportToExcel } from '@/utils/exportUtils';
import { ReportDetailModal } from '@/components/ReportDetailModal';

interface AdminUserReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

const CATEGORY_ITEMS: { name: string; label: string }[] = [
  { name: 'Semua', label: 'Semua Kategori' },
  { name: 'Hardware Kanwil', label: 'Hardware' },
  { name: 'Software Kanwil', label: 'Software' },
  { name: 'Network/Jaringan', label: 'Network' },
  { name: 'Video Confference & Meeting', label: 'Meeting' },
  { name: 'Malware', label: 'Malware' },
  { name: 'Relokasi/Renovasi', label: 'Relokasi' },
  { name: 'Lainnya', label: 'Lainnya' },
];

export const AdminUserReportsModal: React.FC<AdminUserReportsModalProps> = ({
  isOpen,
  onClose,
  user,
  onShowToast
}) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');
  const [activeCycle, setActiveCycle] = useState<string>('');
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadUserReports = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await reportsService.getAllReports(user.uid, user.displayName);
      setReports(data);
    } catch (err) {
      console.error(err);
      onShowToast('Gagal memuat data laporan pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadUserReports();
      setSearchTerm('');
      setSelectedCategory('Semua');
      setDateFilter('');
      setActiveCycle('');
      setCurrentPage(1);
    }
  }, [isOpen, user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, dateFilter, itemsPerPage]);

  // Handle Cut-off Cycle Presets
  const handleCyclePreset = (type: 'cycle21' | 'cycle13' | 'month' | 'all') => {
    setActiveCycle(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth();

    if (type === 'cycle21') {
      const start = new Date(y, m - 1, 21);
      const end = new Date(y, m, 20);
      setDateFilter(formatDateISO(start)); // Or range filter
    } else if (type === 'all') {
      setDateFilter('');
    }
  };

  // Real-time KPI Stats calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = reports.length;
    const todayReports = reports.filter(r => r.tanggalPengerjaan === todayStr);

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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

  const handleExportUserExcel = () => {
    if (filteredReports.length === 0) {
      onShowToast('Tidak ada data laporan untuk di-export.', 'error');
      return;
    }
    exportToExcel(filteredReports, dateFilter, dateFilter);
    onShowToast(`Berhasil meng-export ${filteredReports.length} laporan untuk ${user?.displayName || 'User'}`);
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner with User Profile Summary */}
          <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-sm text-emerald-300 shrink-0 shadow-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                    Laporan: {user.displayName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                    {user.role || 'Desktop Support'}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 truncate mt-0.5">
                  {user.kanwil || 'Kanwil VIII'} {user.unitKerja ? `• ${user.unitKerja}` : ''} • {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportUserExcel}
                disabled={filteredReports.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border border-emerald-400/40 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                title="Download Excel Laporan User Ini"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* User Mini KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Laporan User</p>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.total}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Akun {user.displayName}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laporan Hari Ini</p>
                  <h4 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{stats.todayCount}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tiket tanggal aktif</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata SLA</p>
                  <h4 className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5 font-mono">{stats.avgSlaFormatted}</h4>
                  <p className="text-[10px] text-teal-600 font-bold mt-0.5">Respons Pengerjaan</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const count = cat.name === 'Semua' ? reports.length : reports.filter(r => r.category === cat.name).length;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? 'bg-pegadaian-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 font-bold'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Toolbar Search & Date */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari unit kerja, pemohon, masalah, solusi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 font-medium"
                />
              </div>

              {/* Date Filter with showPicker */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const input = dateInputRef.current as any;
                      if (input?.showPicker) {
                        input.showPicker();
                      } else {
                        input?.focus();
                      }
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    dateFilter
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${dateFilter ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{dateFilter ? formatDateFormatted(dateFilter) : 'Filter Tanggal'}</span>
                  {dateFilter && (
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDateFilter('');
                      }}
                      className="ml-1 p-0.5 hover:bg-emerald-200/60 rounded-full text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                />
              </div>

              {(searchTerm || dateFilter || selectedCategory !== 'Semua') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                    setSelectedCategory('Semua');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Reset Filter
                </button>
              )}

              {/* Mobile Export */}
              <button
                onClick={handleExportUserExcel}
                disabled={filteredReports.length === 0}
                className="flex sm:hidden items-center gap-1 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export</span>
              </button>
            </div>

            {/* Table of User's Reports */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs align-middle border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-900 via-pegadaian-900 to-slate-900 text-white uppercase text-[11px] font-extrabold tracking-wider border-b-2 border-emerald-500/50">
                      <th className="py-3 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                      <th className="py-3 px-3 min-w-[85px] border-r border-slate-700/60">Hari</th>
                      <th className="py-3 px-3 min-w-[100px] border-r border-slate-700/60">Tanggal</th>
                      <th className="py-3 px-3 min-w-[130px] border-r border-slate-700/60">Unit Kerja</th>
                      <th className="py-3 px-3 min-w-[120px] border-r border-slate-700/60">Nama User</th>
                      <th className="py-3 px-4 min-w-[220px] border-r border-slate-700/60">Deskripsi Permohonan</th>
                      <th className="py-3 px-4 min-w-[220px] border-r border-slate-700/60">Solusi Issue</th>
                      <th className="py-3 px-2 min-w-[65px] border-r border-slate-700/60 text-center">Mulai</th>
                      <th className="py-3 px-2 min-w-[65px] border-r border-slate-700/60 text-center">Selesai</th>
                      <th className="py-3 px-3 min-w-[90px] border-r border-slate-700/60 text-center">SLA</th>
                      <th className="py-3 px-2 w-14 text-center">Detail</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="py-16 text-center text-slate-500">
                          <Loader2 className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                          <p className="font-bold text-xs">Memuat data laporan user...</p>
                        </td>
                      </tr>
                    ) : paginatedReports.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-14 text-center text-slate-500">
                          <AlertCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 text-xs">Belum ada laporan dari user ini</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">User ini belum menginput laporan atau tidak cocok dengan filter pencarian</p>
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
                            onClick={() => setViewingReport(item)}
                            className={`transition-colors cursor-pointer hover:bg-emerald-50/40 ${
                              isEven ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                              {rowNumber}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                              {dayName}
                            </td>
                            <td className="py-3 px-3 text-slate-800 border-r border-slate-100 whitespace-nowrap font-medium">
                              {formattedDate}
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-semibold border-r border-slate-100">
                              <p className="line-clamp-2">{item.unitKerja}</p>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-100">
                              <p className="line-clamp-2">{item.nama}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-700 border-r border-slate-100">
                              <p className="line-clamp-2 leading-relaxed">{item.deskripsiPermohonan}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-800 font-medium border-r border-slate-100">
                              <p className="line-clamp-2 leading-relaxed">{item.solusiIssue}</p>
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                              {item.waktuMulai}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                              {item.waktuSelesai}
                            </td>
                            <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                              {getSLABadge(slaStr)}
                            </td>
                            <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingReport(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-pegadaian-700 hover:bg-pegadaian-50 transition-all"
                                title="Lihat Detail Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalItems > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 font-semibold">
                  <div>
                    Menampilkan <strong>{startIndex + 1}</strong>-<strong>{endIndex}</strong> dari{' '}
                    <strong className="text-pegadaian-800">{totalItems}</strong> Data Laporan
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-bold text-slate-800">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Close */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Menampilkan seluruh riwayat pekerjaan yang di-input oleh {user.displayName}.
            </p>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all active:scale-95 ml-auto"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>

      {/* Report Detail Modal (Read-Only Mode for Admin) */}
      {viewingReport && (
        <ReportDetailModal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          report={viewingReport}
          readOnly={true}
        />
      )}
    </>
  );
};
