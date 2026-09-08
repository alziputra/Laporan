'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Save, 
  ChevronDown, 
  Check, 
  Monitor, 
  Code, 
  Wifi, 
  Video, 
  ShieldAlert, 
  Building2, 
  ClipboardList, 
  User, 
  Building, 
  FileText,
  Loader2,
  MapPin,
  Headphones,
  Search,
  CheckCircle2,
  ArrowRight,
  Flame,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { DailyReport, ReportCategory, MetodePenanganan } from '@/types/report';
import { useAuth } from '@/context/AuthContext';
import { 
  detectRecurringIssues, 
  findSimilarHistoricalIssues, 
  normalizeCategory,
  DetectedIssue 
} from '@/utils/issueDetectionUtils';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: DailyReport) => Promise<void>;
  initialData?: DailyReport | null;
  defaultCategory?: ReportCategory;
  defaultDate?: string;
  existingReports?: DailyReport[];
}

const CATEGORY_OPTIONS: { value: ReportCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'Hardware Kanwil', label: 'Hardware Kanwil', icon: Monitor },
  { value: 'Software Kanwil', label: 'Software Kanwil', icon: Code },
  { value: 'Network/Jaringan', label: 'Network / Jaringan', icon: Wifi },
  { value: 'Video Confference & Meeting', label: 'Meeting & VC', icon: Video },
  { value: 'Malware', label: 'Malware & Security', icon: ShieldAlert },
  { value: 'Relokasi/Renovasi', label: 'Relokasi / Renovasi', icon: Building2 },
  { value: 'Lainnya', label: 'Lainnya', icon: ClipboardList },
];

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCategory = 'Hardware Kanwil',
  defaultDate,
  existingReports = []
}) => {
  const { userProfile } = useAuth();
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const defaultPic = userProfile
    ? (userProfile.unitKerja || `${userProfile.kanwil} - ${userProfile.displayName}`)
    : 'Kanwil VIII - Alzi Rahmana Putra';

  const [formData, setFormData] = useState<DailyReport>({
    category: defaultCategory,
    nama: '',
    unitKerja: '',
    deskripsiPermohonan: '',
    metodePenanganan: 'Visit',
    solusiIssue: '',
    picSupport: defaultPic,
    tanggalPengerjaan: defaultDate || getTodayString(),
    tanggalSelesai: defaultDate || getTodayString(),
    waktuMulai: '08:30',
    waktuSelesai: '10:00',
    status: 'Selesai',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom dropdown open state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // History Catalog Modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [appliedFeedback, setAppliedFeedback] = useState<{ title: string; category?: string; count?: number } | null>(null);

  // Live Auto-Suggestion states while typing description
  const [showLiveSuggestions, setShowLiveSuggestions] = useState(false);
  const descriptionContainerRef = useRef<HTMLDivElement>(null);

  // 1. SMART DETECTION: Auto-detect recurring issues dynamically from real user reports
  const detectedIssues = useMemo(() => {
    return detectRecurringIssues(existingReports);
  }, [existingReports]);

  // Detected issues for the currently selected category
  const categoryDetectedIssues = useMemo(() => {
    return detectedIssues.filter(item => item.category === formData.category);
  }, [detectedIssues, formData.category]);

  // Live Auto-matching suggestions as user types in description
  const liveSuggestions = useMemo(() => {
    if (!formData.deskripsiPermohonan || formData.deskripsiPermohonan.trim().length < 2) {
      return [];
    }
    return findSimilarHistoricalIssues(
      formData.deskripsiPermohonan,
      formData.category,
      detectedIssues,
      3
    );
  }, [formData.deskripsiPermohonan, formData.category, detectedIssues]);

  // Filtered issues for catalog modal
  const filteredCatalogIssues = useMemo(() => {
    return detectedIssues.filter(item => {
      const matchCat = categoryFilter === 'Semua' || item.category === categoryFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;
      const matchQuery = 
        item.title.toLowerCase().includes(query) ||
        item.deskripsi.toLowerCase().includes(query) ||
        item.solusi.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [detectedIssues, categoryFilter, searchQuery]);

  useEffect(() => {
    const targetDate = defaultDate || getTodayString();
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        category: defaultCategory,
        nama: '',
        unitKerja: '',
        deskripsiPermohonan: '',
        metodePenanganan: 'Visit',
        solusiIssue: '',
        picSupport: defaultPic,
        tanggalPengerjaan: targetDate,
        tanggalSelesai: targetDate,
        waktuMulai: '08:30',
        waktuSelesai: '10:00',
        status: 'Selesai',
      });
    }
    setErrors({});
    setIsCategoryDropdownOpen(false);
    setAppliedFeedback(null);
    setShowLiveSuggestions(false);
  }, [initialData, defaultCategory, defaultDate, isOpen, userProfile]);

  // Click outside to close custom dropdown and suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (descriptionContainerRef.current && !descriptionContainerRef.current.contains(event.target as Node)) {
        setShowLiveSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyIssue = (issue: DetectedIssue) => {
    const targetCategory = normalizeCategory(issue.category);
    setFormData(prev => ({
      ...prev,
      category: targetCategory,
      deskripsiPermohonan: issue.deskripsi,
      solusiIssue: issue.solusi,
      metodePenanganan: issue.metodePenanganan || 'Visit',
    }));

    // Clear validation errors for filled fields
    setErrors(prev => {
      const next = { ...prev };
      delete next.deskripsiPermohonan;
      delete next.solusiIssue;
      return next;
    });

    setAppliedFeedback({
      title: issue.title,
      category: targetCategory,
      count: issue.frequency
    });
    setShowLiveSuggestions(false);
    setIsHistoryModalOpen(false);

    // Auto hide notification banner after 4.5 seconds
    setTimeout(() => {
      setAppliedFeedback(null);
    }, 4500);
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.unitKerja.trim()) newErrors.unitKerja = 'Unit Kerja wajib diisi';
    if (!formData.deskripsiPermohonan.trim()) newErrors.deskripsiPermohonan = 'Deskripsi Permohonan wajib diisi';
    if (!formData.solusiIssue.trim()) newErrors.solusiIssue = 'Solusi Issue wajib diisi';
    if (!formData.tanggalPengerjaan) newErrors.tanggalPengerjaan = 'Tanggal Pelaporan wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCatObj = CATEGORY_OPTIONS.find(c => c.value === formData.category) || CATEGORY_OPTIONS[0];
  const SelectedIcon = selectedCatObj.icon;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[92vh] my-auto border border-slate-100 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <FileText className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-extrabold tracking-tight">
                  {initialData ? 'Edit Laporan Pekerjaan' : 'Buat Laporan Pekerjaan'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                    {formData.category}
                  </p>
                  {detectedIssues.length > 0 && (
                    <>
                      <span className="text-emerald-400/60 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryFilter(formData.category);
                          setIsHistoryModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-bold underline decoration-amber-400/50 hover:decoration-amber-300 transition-colors cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Deteksi Riwayat ({detectedIssues.length} Pola)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              type="button"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Applied Feedback Alert */}
          {appliedFeedback && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Kendala diterapkan: <strong>&ldquo;{appliedFeedback.title}&rdquo;</strong>
                  {appliedFeedback.category && (
                    <span className="ml-1.5 inline-block bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded text-[10px] border border-emerald-300/60">
                      Kategori: {appliedFeedback.category}
                    </span>
                  )}
                  {appliedFeedback.count && appliedFeedback.count > 1 ? (
                    <span className="ml-1.5 inline-block bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-300/60">
                      🔥 {appliedFeedback.count}x di riwayat Anda
                    </span>
                  ) : null}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedFeedback(null)}
                className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} id="report-modal-form" className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Custom Category Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kategori Pekerjaan <span className="text-red-500">*</span>
                </label>
                {detectedIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryFilter(formData.category);
                      setIsHistoryModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-emerald-800 hover:text-emerald-900 font-extrabold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Analisis Riwayat ({detectedIssues.length} Pola)</span>
                  </button>
                )}
              </div>
              
              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-pegadaian-500 rounded-xl text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between transition-all shadow-2xs text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pegadaian-100 text-pegadaian-800 flex items-center justify-center shrink-0">
                    <SelectedIcon className="w-4 h-4" />
                  </div>
                  <span>{selectedCatObj.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-pegadaian-600' : ''}`} />
              </button>

              {/* Custom Dropdown Menu */}
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-50">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.value;
                    const catCount = detectedIssues.filter(d => d.category === cat.value).length;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: cat.value });
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-pegadaian-50 text-pegadaian-900 font-extrabold' 
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-pegadaian-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.label}</span>
                          {catCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              {catCount} pola riwayat
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-pegadaian-700" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Detection Box: Real Recurring Issues from User History */}
            {categoryDetectedIssues.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50/70 via-slate-50 to-emerald-50/50 p-3.5 rounded-2xl border border-amber-200/70 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-600 animate-pulse" />
                    <span>Kendala yang Sering Terjadi di Riwayat Anda:</span>
                  </div>
                  {categoryDetectedIssues.length > 5 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryFilter(formData.category);
                        setIsHistoryModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-pegadaian-700 hover:text-pegadaian-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Lihat Semua ({categoryDetectedIssues.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categoryDetectedIssues.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleApplyIssue(item)}
                      title={`Klik untuk otomatis mengisi Deskripsi & Solusi yang pernah dikerjakan:\n\nMasalah: ${item.deskripsi}\n\nSolusi: ${item.solusi}${item.frequency > 1 ? `\n(Telah dilaporkan ${item.frequency}x di riwayat Anda)` : ''}`}
                      className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-100/70 border border-amber-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 hover:text-amber-950 shadow-2xs transition-all active:scale-95 text-left cursor-pointer"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[250px]">{item.title}</span>
                      {item.frequency && item.frequency > 1 && (
                        <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.2 rounded-full shadow-2xs shrink-0 flex items-center gap-0.5">
                          <span>{item.frequency}x</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nama User & Unit Kerja Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nama Pemohon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Pemohon / User <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: Budi / Sapto"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                      errors.nama ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium text-slate-800`}
                  />
                </div>
                {errors.nama && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.nama}</p>}
              </div>

              {/* Unit Kerja */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unit Kerja / Cabang <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: CP Pancoran Mas / UPC Jatinegara"
                    value={formData.unitKerja}
                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                      errors.unitKerja ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50'
                    } focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium text-slate-800`}
                  />
                </div>
                {errors.unitKerja && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.unitKerja}</p>}
              </div>
            </div>

            {/* Deskripsi Permohonan with Live Smart Auto-Suggestion */}
            <div className="relative" ref={descriptionContainerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Deskripsi Permohonan / Masalah</span>
                  <span className="text-red-500">*</span>
                  {liveSuggestions.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                      💡 {liveSuggestions.length} pola cocok
                    </span>
                  )}
                </label>
                <span className="text-[11px] text-slate-400">Ketik untuk deteksi otomatis</span>
              </div>
              
              <textarea
                rows={3}
                placeholder="Jelaskan detail kendala yang dialami user (Contoh: Tidak bisa login New Prisma / Printer macet)..."
                value={formData.deskripsiPermohonan}
                onFocus={() => setShowLiveSuggestions(true)}
                onChange={(e) => {
                  setFormData({ ...formData, deskripsiPermohonan: e.target.value });
                  setShowLiveSuggestions(true);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                  errors.deskripsiPermohonan ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium text-slate-800 leading-relaxed`}
              />
              {errors.deskripsiPermohonan && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.deskripsiPermohonan}</p>}

              {/* LIVE SUGGESTION DROPDOWN POPUP */}
              {showLiveSuggestions && liveSuggestions.length > 0 && (
                <div className="mt-1.5 bg-white border border-amber-200 rounded-2xl shadow-xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 z-20">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold text-amber-900 border-b border-amber-100 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Rekomendasi dari Riwayat Laporan Anda:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLiveSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {liveSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        onClick={() => handleApplyIssue(sug)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer text-left space-y-1 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                            {sug.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {sug.frequency > 1 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                                {sug.frequency}x di riwayat
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
                              <span>Terapkan Solusi</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          <strong className="text-emerald-700">Solusi:</strong> {sug.solusi}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Solusi Issue */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Solusi & Tindakan Perbaikan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan tindakan perbaikan atau solusi yang telah dilakukan (Contoh: Clear cache dan cookies pada chrome)..."
                value={formData.solusiIssue}
                onChange={(e) => setFormData({ ...formData, solusiIssue: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                  errors.solusiIssue ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium text-slate-800 leading-relaxed`}
              />
              {errors.solusiIssue && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.solusiIssue}</p>}
            </div>

            {/* Metode Penanganan */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Metode Penanganan <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-slate-400 font-medium">Guide / Visit / Remote</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { value: 'Visit', label: 'Visit (Kunjungan)', icon: MapPin },
                  { value: 'Remote', label: 'Remote', icon: Monitor },
                  { value: 'Guide', label: 'Guide (Panduan)', icon: Headphones },
                ].map((m) => {
                  const isSelected = formData.metodePenanganan === m.value;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, metodePenanganan: m.value as MetodePenanganan })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIC Support & Tanggal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* PIC Support */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  PIC Support (Petugas IT) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama Petugas IT / PIC"
                  value={formData.picSupport}
                  onChange={(e) => setFormData({ ...formData, picSupport: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm text-slate-800 font-medium"
                />
              </div>

              {/* Tanggal Pelaporan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Pelaporan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggalPengerjaan}
                  onChange={(e) => setFormData({ ...formData, tanggalPengerjaan: e.target.value, tanggalSelesai: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm text-slate-800 font-semibold cursor-pointer"
                />
              </div>
            </div>

            {/* Waktu Mulai & Selesai */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Waktu Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.waktuMulai}
                  onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm font-mono font-bold text-slate-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Waktu Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.waktuSelesai}
                  onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 text-xs sm:text-sm font-mono font-bold text-slate-800 cursor-pointer"
                />
              </div>
            </div>
          </form>

          {/* Universal Clean Footer Action Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="report-modal-form"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-pegadaian-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Laporan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Full History Analysis Catalog */}
      {isHistoryModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/30">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold tracking-tight">Deteksi Kasus & Masalah Berulang</h3>
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>{existingReports.length} Laporan Nyata Dianalisis</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Pilih kendala dari riwayat Anda untuk langsung menerapkan solusi sebelumnya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kata kunci masalah yang pernah dilaporkan, printer, prisma, wifi, dll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('Semua')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    categoryFilter === 'Semua'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua ({filteredCatalogIssues.length})
                </button>
                {CATEGORY_OPTIONS.map(c => {
                  const count = detectedIssues.filter(item => item.category === c.value).length;
                  const isSelected = categoryFilter === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategoryFilter(c.value)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-pegadaian-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-pegadaian-900 text-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detected List Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
              {filteredCatalogIssues.length > 0 ? (
                filteredCatalogIssues.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleApplyIssue(item)}
                    className="group bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/70 hover:shadow-md transition-all cursor-pointer space-y-2.5 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-pegadaian-800 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.metodePenanganan}
                        </span>
                        {item.frequency && item.frequency > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-white" />
                            <span>Muncul {item.frequency}x di Riwayat</span>
                          </span>
                        )}
                        {item.commonUnits && item.commonUnits.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                            Unit: {item.commonUnits.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          <span>Terapkan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Deskripsi Permohonan:
                        </span>
                        <p className="text-slate-700 line-clamp-2 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                          Solusi & Tindakan Historis:
                        </span>
                        <p className="text-slate-700 line-clamp-2 leading-relaxed">
                          {item.solusi}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Belum ada riwayat kendala yang cocok</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Coba ubah kata kunci pencarian atau buat laporan pekerjaan baru terlebih dahulu.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Menampilkan {filteredCatalogIssues.length} pola masalah berulang dari riwayat laporan</span>
              </span>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
