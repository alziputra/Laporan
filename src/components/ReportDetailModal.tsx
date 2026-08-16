'use client';

import React from 'react';
import { X, Calendar, Clock, User, Building, Wrench, ShieldCheck, UserCheck, Edit, Trash2 } from 'lucide-react';
import { DailyReport } from '@/types/report';

interface ReportDetailModalProps {
  report: DailyReport | null;
  onClose: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-pegadaian-600 text-white font-bold text-xs rounded-md">
              {report.category}
            </span>
            <h3 className="font-bold text-lg">Detail Laporan Troubleshoot</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-slate-800 text-sm">
          {/* User & Unit Kerja Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Nama User / Pemohon</p>
                <p className="font-bold text-slate-900">{report.nama}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Unit Kerja / Lokasi</p>
                <p className="font-bold text-slate-900">{report.unitKerja}</p>
              </div>
            </div>
          </div>

          {/* Issue & Solution */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Deskripsi Permohonan / Masalah
              </p>
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-slate-800 font-medium">
                {report.deskripsiPermohonan}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Solusi Issue & Tindakan Perbaikan
              </p>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-slate-800 font-medium">
                {report.solusiIssue}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium block">Metode Penanganan:</span>
              <span className="font-bold text-slate-800">{report.metodePenanganan}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">PIC Support:</span>
              <span className="font-bold text-slate-800">{report.picSupport}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Tanggal Pelaporan:</span>
              <span className="font-bold text-slate-800">{report.tanggalPengerjaan}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Waktu Operasional:</span>
              <span className="font-bold text-slate-800">{report.waktuMulai} - {report.waktuSelesai}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
                onDelete(report.id!);
                onClose();
              }
            }}
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
          </div>
        </div>
      </div>
    </div>
  );
};
