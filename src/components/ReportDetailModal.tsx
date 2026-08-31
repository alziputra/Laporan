'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Radio, 
  PhoneCall, 
  UserCheck, 
  Copy, 
  Check, 
  FileText, 
  HelpCircle, 
  ShieldCheck 
} from 'lucide-react';
import { DailyReport } from '@/types/report';
import { calculateSLA, getDayName, formatDateFormatted } from '@/utils/exportUtils';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport | null;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onEdit,
  onDelete
}) => {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const slaText = calculateSLA(report.waktuMulai, report.waktuSelesai);
  const dayName = getDayName(report.tanggalPengerjaan);
  const formattedDate = formatDateFormatted(report.tanggalPengerjaan);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] sm:max-h-[90vh] my-auto border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <FileText className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    {report.category}
                  </span>
                  <span className="text-xs text-emerald-200 font-mono font-bold">
                    ⏱️ SLA: {slaText}
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white mt-1">
                  Detail Laporan Pekerjaan IT
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Grid Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Hari & Tanggal</span>
                <span className="font-extrabold text-slate-800 mt-0.5 block">{dayName}, {formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Jam Kerja</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">{report.waktuMulai} - {report.waktuSelesai}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">PIC Support</span>
                <span className="font-extrabold text-emerald-800 mt-0.5 block">{report.picSupport}</span>
              </div>
            </div>

            {/* User & Unit Kerja Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Unit Kerja / Cabang</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{report.unitKerja}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama Pemohon (User)</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{report.nama}</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Deskripsi Permohonan / Masalah</span>
                </h4>
                <button
                  onClick={() => handleCopy(report.deskripsiPermohonan, 'desc')}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'desc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'desc' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 leading-relaxed font-medium">
                {report.deskripsiPermohonan}
              </div>
            </div>

            {/* Solution Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Solusi & Tindakan Troubleshooting</span>
                </h4>
                <button
                  onClick={() => handleCopy(report.solusiIssue, 'sol')}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'sol' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'sol' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/70 leading-relaxed font-medium">
                {report.solusiIssue}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Laporan</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-pegadaian-600 hover:bg-pegadaian-700 active:scale-95 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-pegadaian-600/20"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Laporan</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Custom Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDelete(report.id!);
          onClose();
        }}
        title="Hapus Laporan Pekerjaan"
        message="Apakah Anda yakin ingin menghapus laporan pekerjaan ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </>
  );
};
