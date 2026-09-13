'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Search, 
  Wrench, 
  MapPin, 
  Copy, 
  ExternalLink, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp, 
  HardDrive, 
  Wifi, 
  Printer, 
  Layers, 
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { UnitActionRecommendation, ChronicUnitsSummary, ChronicIssueType } from '@/utils/chronicIssueDetection';
import { formatDateFormatted } from '@/utils/exportUtils';

interface ChronicIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ChronicUnitsSummary;
  onSelectUnitFilter: (unitName: string) => void;
  onOpenAddReportWithUnit: (unitName: string) => void;
}

export const ChronicIssuesModal: React.FC<ChronicIssuesModalProps> = ({
  isOpen,
  onClose,
  summary,
  onSelectUnitFilter,
  onOpenAddReportWithUnit
}) => {
  const [activeTab, setActiveTab] = useState<'all' | ChronicIssueType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return summary.recommendations.filter((item) => {
      const matchesTab = activeTab === 'all' || item.issueType === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        item.unitKerja.toLowerCase().includes(q) ||
        item.issueTitle.toLowerCase().includes(q) ||
        item.recommendedAction.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [summary.recommendations, activeTab, searchQuery]);

  const handleCopyRecommendation = (item: UnitActionRecommendation) => {
    const text = `*REKOMENDASI TINDAKAN PREVENTIF MS KANWIL - PT PEGADAIAN*\n` +
      `🏢 *Unit Kerja:* ${item.unitKerja}\n` +
      `⚠️ *Kendala Kronis:* ${item.issueTitle} (${item.frequency}x kejadian)\n` +
      `🎯 *Rekomendasi Tindakan:* ${item.recommendedAction}\n` +
      `🛠️ *Metode Disarankan:* ${item.suggestedMethod.toUpperCase()}\n` +
      `📝 *Alasan Teknis:* ${item.reason}\n` +
      `📅 *Laporan Terakhir:* ${formatDateFormatted(item.latestReportDate)}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const getIssueIcon = (type: ChronicIssueType) => {
    switch (type) {
      case 'fsck_os':
        return HardDrive;
      case 'network_cable':
        return Wifi;
      case 'printer':
        return Printer;
      case 'high_frequency':
        return Building2;
      default:
        return Wrench;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-pegadaian-900 to-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0 relative z-10 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-400/30 shrink-0 text-amber-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>Unit Watchlist & Rekomendasi Solusi Permanen</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold">
                  Problem Management
                </span>
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Mendeteksi unit yang sering menghubungi MS Kanwil dan memberikan rekomendasi tindakan tuntas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Unit Perlu Aksi</p>
            <h4 className="text-lg sm:text-xl font-black text-slate-800 mt-0.5">
              {summary.totalUnitsNeedingAction} <span className="text-xs font-semibold text-slate-500">Unit</span>
            </h4>
          </div>
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-rose-200 shadow-2xs">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider truncate">🔴 Kritis (Install Ulang)</p>
            <h4 className="text-lg sm:text-xl font-black text-rose-700 mt-0.5">
              {summary.criticalCount} <span className="text-xs font-semibold text-rose-500">Kasus</span>
            </h4>
          </div>
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-amber-200 shadow-2xs">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate">🟠 Jaringan (Wajib Visit)</p>
            <h4 className="text-lg sm:text-xl font-black text-amber-700 mt-0.5">
              {summary.highCount} <span className="text-xs font-semibold text-amber-600">Kasus</span>
            </h4>
          </div>
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider truncate">🟡 Printer & Hotspot</p>
            <h4 className="text-lg sm:text-xl font-black text-teal-700 mt-0.5">
              {summary.mediumCount} <span className="text-xs font-semibold text-teal-600">Kasus</span>
            </h4>
          </div>
        </div>

        {/* Search & Tabs Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0 bg-white">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua ({summary.recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('fsck_os')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'fsck_os'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              FSCK / OS ({summary.recommendations.filter(r => r.issueType === 'fsck_os').length})
            </button>
            <button
              onClick={() => setActiveTab('network_cable')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'network_cable'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Kabel & LAN ({summary.recommendations.filter(r => r.issueType === 'network_cable').length})
            </button>
            <button
              onClick={() => setActiveTab('printer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'printer'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              Printer ({summary.recommendations.filter(r => r.issueType === 'printer').length})
            </button>
            <button
              onClick={() => setActiveTab('high_frequency')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'high_frequency'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              Hotspot ({summary.recommendations.filter(r => r.issueType === 'high_frequency').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 bg-slate-50 font-medium"
            />
          </div>
        </div>

        {/* List of Recommendations (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-3.5 divide-y divide-slate-100 flex-1">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Tidak Ada Kendala Kronis</p>
              <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                Semua unit kerja berjalan lancar tanpa ada pengulangan kendala berulang yang melewati batas toleransi.
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const Icon = getIssueIcon(item.issueType);
              const isExpanded = expandedCardId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div 
                  key={item.id}
                  className={`pt-3.5 first:pt-0 rounded-2xl p-3 sm:p-4 border transition-all ${
                    item.severity === 'critical'
                      ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                      : item.severity === 'high'
                      ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                      : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Unit & Severity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        item.severity === 'critical'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : item.severity === 'high'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-800 text-white'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                            {item.unitKerja}
                          </h4>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            item.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.severity === 'high'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}>
                            {item.severity === 'critical' ? '🔴 KRITIS' : item.severity === 'high' ? '🟠 PERINGATAN FISIK' : '🟡 PANTAUAN'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-1.5">
                          <span>{item.issueTitle}</span>
                          <span className="text-[10px] bg-white px-1.5 py-0.2 rounded font-mono font-bold text-rose-600 border border-slate-200">
                            {item.frequency}x Terjadi
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium block">Laporan Terakhir:</span>
                      <span className="text-xs font-bold text-slate-700">{formatDateFormatted(item.latestReportDate)}</span>
                    </div>
                  </div>

                  {/* Recommendation Highlight Box */}
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Rekomendasi Aksi Permanen:</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.suggestedMethod === 'Visit' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        Metode: {item.suggestedMethod}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-800 leading-snug">
                      {item.recommendedAction}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      💡 <strong>Alasan Teknis:</strong> {item.reason}
                    </p>
                  </div>

                  {/* Expandable History of Related Tickets */}
                  {item.relatedReports && item.relatedReports.length > 0 && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Sembunyikan' : `Lihat riwayat ${item.relatedReports.length} laporan terkait di unit ini`}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-xs animate-in fade-in duration-150">
                          {item.relatedReports.map((r, idx) => (
                            <div key={r.id || idx} className="bg-white p-2 rounded-lg border border-slate-200/80 text-[11px]">
                              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                                <span className="font-bold text-slate-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDateFormatted(r.tanggalPengerjaan)}
                                </span>
                                <span>User: <strong>{r.nama || '-'}</strong> • PIC: {r.picSupport || '-'}</span>
                              </div>
                              <p className="text-slate-800 font-medium line-clamp-2">
                                <span className="text-slate-400">Permohonan:</span> {r.deskripsiPermohonan}
                              </p>
                              {r.solusiIssue && (
                                <p className="text-emerald-700 font-medium line-clamp-1 mt-0.5">
                                  <span className="text-slate-400">Solusi sebelumnya:</span> {r.solusiIssue}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyRecommendation(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Salin ringkasan rekomendasi untuk memo / WhatsApp ke pimpinan"
                    >
                      {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin Rekomendasi'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectUnitFilter(item.unitKerja);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-200 cursor-pointer"
                        title="Filter tabel utama khusus unit kerja ini"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Filter Tabel ke Unit Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenAddReportWithUnit(item.unitKerja);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pegadaian-700 hover:bg-pegadaian-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                        title="Buat tiket tindak lanjut baru untuk unit ini"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Buat Tiket Visit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <p className="text-[11px] text-slate-400">
            * Rekomendasi disusun berdasarkan prinsip ITIL Problem Management & Preventive Maintenance
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
