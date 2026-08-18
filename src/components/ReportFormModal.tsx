'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { DailyReport, ReportCategory, MetodePenanganan } from '@/types/report';
import { useAuth } from '@/context/AuthContext';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: DailyReport) => Promise<void>;
  initialData?: DailyReport | null;
  defaultCategory?: ReportCategory;
}

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
    waktuMulai: '08:00',
    waktuSelesai: '10:00',
    status: 'Selesai',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  }, [initialData, defaultCategory, isOpen, userProfile]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto max-h-[92vh] sm:max-h-[90vh] border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              {initialData ? `Edit Laporan - ${formData.category}` : `Buat Laporan - ${formData.category}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 hidden sm:flex">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-pegadaian-600 text-pegadaian-600 font-semibold text-sm hover:bg-pegadaian-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-1.5 rounded-md bg-pegadaian-600 hover:bg-pegadaian-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Simpan...' : 'Simpan Laporan'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 pb-20 sm:pb-6">
          {/* Category Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Kategori Pekerjaan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ReportCategory })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-base sm:text-sm text-slate-800 bg-white"
            >
              <option value="Hardware Kanwil">Hardware Kanwil</option>
              <option value="Software Kanwil">Software Kanwil</option>
              <option value="Network/Jaringan">Network/Jaringan</option>
              <option value="Video Confference & Meeting">Video Confference & Meeting</option>
              <option value="Malware">Malware</option>
              <option value="Relokasi/Renovasi">Relokasi/Renovasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Nama * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Nama Pemohon / User <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan nama pemohon / user"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${errors.nama ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-pegadaian-500'
                } focus:ring-2 focus:border-pegadaian-500 text-base sm:text-sm text-slate-800 transition-all`}
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* Unit Kerja * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Unit Kerja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Kanwil VIII / CP Pasar Senen / UPC Kwitang"
              value={formData.unitKerja}
              onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${errors.unitKerja ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-pegadaian-500'
                } focus:ring-2 focus:border-pegadaian-500 text-base sm:text-sm text-slate-800 transition-all`}
            />
            {errors.unitKerja && <p className="text-xs text-red-500 mt-1">{errors.unitKerja}</p>}
          </div>

          {/* Deskripsi Permohonan * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Deskripsi Permohonan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail masalah atau kendala yang dialami user..."
              value={formData.deskripsiPermohonan}
              onChange={(e) => setFormData({ ...formData, deskripsiPermohonan: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${errors.deskripsiPermohonan ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-pegadaian-500'
                } focus:ring-2 focus:border-pegadaian-500 text-base sm:text-sm text-slate-800 transition-all`}
            />
            {errors.deskripsiPermohonan && <p className="text-xs text-red-500 mt-1">{errors.deskripsiPermohonan}</p>}
          </div>

          {/* Metode Penanganan * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Metode Penanganan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metodePenanganan}
              onChange={(e) => setFormData({ ...formData, metodePenanganan: e.target.value as MetodePenanganan })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 focus:border-pegadaian-500 text-base sm:text-sm text-slate-800 bg-white"
            >
              <option value="Guide">Guide</option>
              <option value="Visit">Visit</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Solusi Issue * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Solusi Issue <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan tindakan perbaikan atau solusi yang telah dilakukan..."
              value={formData.solusiIssue}
              onChange={(e) => setFormData({ ...formData, solusiIssue: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border ${errors.solusiIssue ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-pegadaian-500'
                } focus:ring-2 focus:border-pegadaian-500 text-base sm:text-sm text-slate-800 transition-all`}
            />
            {errors.solusiIssue && <p className="text-xs text-red-500 mt-1">{errors.solusiIssue}</p>}
          </div>

          {/* PIC Support * */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              PIC Support <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nama Petugas IT / PIC"
              value={formData.picSupport}
              onChange={(e) => setFormData({ ...formData, picSupport: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-base sm:text-sm text-slate-800"
            />
          </div>

          {/* Tanggal Pelaporan */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Tanggal Pelaporan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggalPengerjaan}
              onChange={(e) => setFormData({ ...formData, tanggalPengerjaan: e.target.value, tanggalSelesai: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-base sm:text-sm text-slate-800"
            />
          </div>

          {/* Waktu Mulai & Waktu Selesai Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Waktu Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.waktuMulai}
                onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-base sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Waktu Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.waktuSelesai}
                onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-pegadaian-500 text-base sm:text-sm text-slate-800"
              />
            </div>
          </div>
        </form>

        {/* Sticky Mobile Submit Footer Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 sm:hidden sticky bottom-0 z-20 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-pegadaian-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Simpan...' : 'Simpan Laporan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
