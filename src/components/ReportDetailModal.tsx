'use client';

import React, { useState } from 'react';
import { X, User, Building, Edit, Trash2 } from 'lucide-react';
import { DailyReport } from '@/types/report';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport | null;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
}

// Helper functions for SLA
const calculateSLA = (start: string, end: string) => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return (eH * 60 + eM) - (sH * 60 + sM);
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}j ${m}m`;
};

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onEdit,
  onDelete
}) => {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (!isOpen || !report) return null;

  const slaMinutes = calculateSLA(report.waktuMulai, report.waktuSelesai);
  const slaText = formatDuration(slaMinutes);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
          
          {/* Header */}
          <div className="bg-pegadaian-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
                {report.category}
              </span>
              <span className="text-xs text-slate-200">• SLA: {slaText}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Grid Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Hari / Tanggal</span>
                <span className="font-bold text-slate-800">{report.hari}, {report.tanggal}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">PIC Support (Kanwil)</span>
                <span className="font-bold text-slate-800">{report.picSupport}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Unit Kerja / Kantor Cabang</span>
                <span className="font-bold text-slate-800">{report.unitKerja}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Nama User</span>
                <span className="font-bold text-slate-800">{report.namaUser}</span>
              </div>
            </div>

            {/* Description & Solution */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Deskripsi Permohonan / Permasalahan
                </h4>
                <p className="text-slate-800 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed">
                  {report.deskripsiPermohonan}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Solusi / Penyelesaian Issue
                </h4>
                <p className="text-slate-800 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/60 leading-relaxed font-medium">
                  {report.solusiIssue}
                </p>
              </div>
            </div>

            {/* Additional Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <span className="text-slate-400 block">Metode Support</span>
                <span className="font-semibold text-slate-700">{report.metode}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Laporan</span>
                <span className="font-semibold text-emerald-600">{report.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jam Pengerjaan</span>
                <span className="font-bold text-slate-800">{report.waktuMulai} - {report.waktuSelesai}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Laporan</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-pegadaian-600 hover:bg-pegadaian-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Laporan</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Tutup
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
