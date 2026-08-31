'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  User,
  ChevronDown,
  Check,
  Layers,
  Laptop,
  Cpu,
  Globe,
  Video,
  Bug,
  Move
} from 'lucide-react';
import { DailyReport, ReportCategory } from '@/types/report';
import { UserProfile } from '@/types/user';
import { exportToExcel } from '@/utils/exportUtils';
import { reportsService } from '@/services/reportsService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: DailyReport[];
  users?: UserProfile[];
  initialUser?: string;
  showUserFilter?: boolean;
}

const CATEGORY_CONFIG: { name: string; label: string; icon: any; color: string }[] = [
  { name: 'Semua', label: 'Semua Kategori', icon: Layers, color: 'text-slate-600 bg-slate-100' },
  { name: 'Hardware Kanwil', label: 'Hardware Kanwil', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
  { name: 'Software Kanwil', label: 'Software Kanwil', icon: Laptop, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Network/Jaringan', label: 'Network / Jaringan', icon: Globe, color: 'text-purple-600 bg-purple-50' },
  { name: 'Video Confference & Meeting', label: 'Video Conference & Meeting', icon: Video, color: 'text-amber-600 bg-amber-50' },
  { name: 'Malware', label: 'Malware & Security', icon: Bug, color: 'text-red-600 bg-red-50' },
  { name: 'Relokasi/Renovasi', label: 'Relokasi / Renovasi', icon: Move, color: 'text-indigo-600 bg-indigo-50' },
  { name: 'Lainnya', label: 'Lainnya', icon: Layers, color: 'text-slate-600 bg-slate-50' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reports,
  users = [],
  initialUser,
  showUserFilter = false
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
  const [selectedUser, setSelectedUser] = useState<string>(initialUser || 'Semua');
  const [activePreset, setActivePreset] = useState<string>('month');

  // Custom Dropdown Open States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialUser if it changes
  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser, isOpen]);

  // Robust matching helper to check if a report belongs to a user
  const isReportMatchingUser = (report: DailyReport, user: UserProfile | { displayName: string; email?: string; uid?: string }): boolean => {
    if (!user) return false;
    if (user.uid && report.userId && report.userId === user.uid) return true;

    const pic = (report.picSupport || '').toLowerCase().trim();
    const name = (user.displayName || '').toLowerCase().trim();
    const email = (user.email || '').toLowerCase().trim();

    if (name && pic.includes(name)) return true;
    if (email && pic.includes(email)) return true;

    // First name match fallback (e.g. 'alzi', 'rizky', 'triwan')
    const firstName = name.split(' ')[0];
    if (firstName && firstName.length > 2 && pic.includes(firstName)) return true;

    return false;
  };

  // Build clean available officers list
  const availableOfficers = useMemo(() => {
    if (users && users.length > 0) {
      return users
        .filter(u => u.role !== 'Admin' && u.role !== 'Super Admin')
        .map(u => ({
          uid: u.uid,
          name: u.displayName || u.email,
          kanwil: u.kanwil || 'Kanwil',
          count: reports.filter(r => isReportMatchingUser(r, u)).length
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Fallback: extract clean names from reports if users prop not passed
    const nameMap = new Map<string, { uid?: string; name: string; kanwil?: string; count: number }>();
    reports.forEach((r) => {
      const pic = (r.picSupport || '').trim();
      if (pic) {
        const parts = pic.split(' - ');
        const cleanName = parts.length > 1 ? parts[parts.length - 1].trim() : pic;
        const existing = nameMap.get(cleanName);
        if (existing) {
          existing.count += 1;
        } else {
          nameMap.set(cleanName, { name: cleanName, kanwil: parts.length > 1 ? parts[0] : '', count: 1 });
        }
      }
    });
    return Array.from(nameMap.values()).sort((a, b) => b.count - a.count);
  }, [users, reports]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered data calculation
  const filteredData = useMemo(() => {
    return reports.filter((item) => {
      const itemDate = item.tanggalPengerjaan;
      let inDateRange = true;
      if (startDate && endDate) {
        inDateRange = itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        inDateRange = itemDate >= startDate;
      } else if (endDate) {
        inDateRange = itemDate <= endDate;
      }

      const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;

      let matchUser = true;
      if (selectedUser !== 'Semua') {
        const targetOfficer = availableOfficers.find(o => o.name === selectedUser || o.uid === selectedUser);
        if (targetOfficer) {
          matchUser = isReportMatchingUser(item, { displayName: targetOfficer.name, uid: targetOfficer.uid });
        } else {
          matchUser = (item.picSupport || '').toLowerCase().includes(selectedUser.toLowerCase());
        }
      }

      return inDateRange && matchCategory && matchUser;
    });
  }, [reports, startDate, endDate, selectedCategory, selectedUser, availableOfficers]);

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

  const selectedCategoryObj = CATEGORY_CONFIG.find((c) => c.name === selectedCategory) || CATEGORY_CONFIG[0];
  const CategoryIcon = selectedCategoryObj.icon;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[88vh] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Export Laporan Excel</h3>
              <p className="text-xs text-emerald-200">Filter berdasarkan pengguna, siklus tanggal & kategori</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Filter Petugas / Nama User (Hanya Tampil di Mode Admin Panel) */}
          {showUserFilter && (
            <div className="relative" ref={userDropdownRef}>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-pegadaian-600" />
                <span>Petugas IT Support (PIC):</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0">
                    {selectedUser === 'Semua' ? 'ALL' : selectedUser.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">
                    {selectedUser === 'Semua' ? 'Semua Petugas IT Support' : selectedUser}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isUserDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                }`} />
              </button>

              {/* Custom User Dropdown Popup */}
              {isUserDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 py-1.5 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-50">
                  {/* Option: Semua Petugas */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser('Semua');
                      setIsUserDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                      selectedUser === 'Semua' ? 'bg-emerald-50/70 font-extrabold text-emerald-900' : 'font-semibold text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black">
                        *
                      </span>
                      <span>Semua Petugas IT Support</span>
                    </div>
                    {selectedUser === 'Semua' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  {/* Specific Users List */}
                  {availableOfficers.map((u) => {
                    const isSelected = selectedUser === u.name;
                    return (
                      <button
                        key={u.uid || u.name}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u.name);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                          isSelected ? 'bg-emerald-50/70 font-extrabold text-emerald-900' : 'font-semibold text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate">{u.name}</p>
                            {u.kanwil && <p className="text-[9px] text-slate-400 truncate">{u.kanwil}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {u.count} lap
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Pilihan Cepat Siklus Pegadaian (Cut-off Laporan) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pilihan Cepat Rentang Tanggal:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('cycle21')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                  activePreset === 'cycle21'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 shadow-xs ring-2 ring-emerald-400/40'
                    : 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 border-emerald-300/80'
                }`}
              >
                21 Lalu - 20 Ini
              </button>

              <button
                type="button"
                onClick={() => handlePreset('cycle13')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                  activePreset === 'cycle13'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 shadow-xs ring-2 ring-emerald-400/40'
                    : 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 border-emerald-300/80'
                }`}
              >
                13 Lalu - 12 Ini
              </button>

              <button
                type="button"
                onClick={() => handlePreset('month')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all border text-center active:scale-95 cursor-pointer ${
                  activePreset === 'month'
                    ? 'bg-pegadaian-700 text-white border-pegadaian-700 shadow-xs ring-2 ring-emerald-400/40'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                1 - Akhir Bln
              </button>
            </div>

            {/* Quick Pills Row 2 */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => handlePreset('today')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                  activePreset === 'today'
                    ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset('7days')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                  activePreset === '7days'
                    ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                  activePreset === 'all'
                    ? 'bg-slate-800 text-white border-slate-800 font-extrabold'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Semua Data
              </button>
            </div>
          </div>

          {/* 3. Custom Date Range Pickers */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-pegadaian-600" />
                <span>Tanggal Mulai</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs font-bold text-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-pegadaian-600" />
                <span>Tanggal Selesai</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs font-bold text-slate-800 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Filter Kategori Pekerjaan (Custom Dropdown) */}
          <div className="relative" ref={categoryDropdownRef}>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pegadaian-600" />
              <span>Kategori Pekerjaan:</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1 rounded-lg ${selectedCategoryObj.color} shrink-0`}>
                  <CategoryIcon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{selectedCategoryObj.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isCategoryDropdownOpen ? 'rotate-180 text-emerald-600' : ''
              }`} />
            </button>

            {/* Custom Category Dropdown Popup */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-30 py-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-50">
                {CATEGORY_CONFIG.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                        isSelected ? 'bg-emerald-50/70 font-extrabold text-emerald-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1 rounded-lg ${cat.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Live Data Counter Preview */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            filteredData.length > 0
              ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
              : 'bg-amber-50/90 text-amber-900 border-amber-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {filteredData.length > 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-bold text-[11px] sm:text-xs truncate">
                {filteredData.length > 0
                  ? `Siap meng-export ${filteredData.length} laporan pekerjaan`
                  : 'Tidak ada data laporan pada kriteria ini'}
              </span>
            </div>
            <span className="font-black bg-white px-2.5 py-1 rounded-xl shadow-2xs text-xs text-slate-900 shrink-0 border border-slate-100 font-mono">
              {filteredData.length} Laporan
            </span>
          </div>

          {/* 6. Export Download Button */}
          <div className="pt-1">
            <button
              onClick={handleExcelExport}
              disabled={filteredData.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-black py-3 px-4 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm cursor-pointer"
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
