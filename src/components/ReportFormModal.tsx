'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Clock, 
  Calendar, 
  User, 
  Building, 
  FileText,
  Loader2
} from 'lucide-react';
import { DailyReport, ReportCategory } from '@/types/report';
import { useAuth } from '@/context/AuthContext';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: DailyReport) => Promise<void>;
  initialData?: DailyReport | null;
  defaultCategory?: ReportCategory;
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
  defaultCategory = 'Hardware Kanwil'
}) => {
  const { userProfile } = useAuth();
  const getTodayString = () => new Date().toISOString().split('T')[0];

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
    tanggalPengerjaan: getTodayString(),
    tanggalSelesai: getTodayString(),
    waktuMulai: '08:30',
    waktuSelesai: '10:00',
    status: 'Selesai',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Custom dropdown open state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        tanggalPengerjaan: getTodayString(),
        tanggalSelesai: getTodayString(),
        waktuMulai: '08:30',
        waktuSelesai: '10:00',
        status: 'Selesai',
      });
    }
    setErrors({});
    setIsCategoryDropdownOpen(false);
  }, [initialData, defaultCategory, isOpen, userProfile]);

  // Click outside to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] sm:max-h-[90vh] my-auto border border-slate-100 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-extrabold tracking-tight">
                {initialData ? 'Edit Laporan Pekerjaan' : 'Buat Laporan Pekerjaan'}
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                {formData.category}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-emerald-100 hover:text-white transition-colors"
            type="button"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="report-modal-form" className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Custom Category Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kategori Pekerjaan <span className="text-red-500">*</span>
            </label>
            
            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-pegadaian-500 rounded-xl text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between transition-all shadow-2xs text-left"
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
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-pegadaian-700" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          {/* Deskripsi Permohonan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi Permohonan / Masalah <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail kendala yang dialami user (Contoh: Tidak bisa login New Prisma / Printer macet)..."
              value={formData.deskripsiPermohonan}
              onChange={(e) => setFormData({ ...formData, deskripsiPermohonan: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                errors.deskripsiPermohonan ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50'
              } focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium text-slate-800 leading-relaxed`}
            />
            {errors.deskripsiPermohonan && <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.deskripsiPermohonan}</p>}
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
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs bg-white hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="report-modal-form"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pegadaian-600 to-emerald-600 hover:from-pegadaian-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-pegadaian-600/20 active:scale-95 transition-all disabled:opacity-50"
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
  );
};
