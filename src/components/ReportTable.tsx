'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { DailyReport, ReportCategory } from '@/types/report';
import { calculateSLA, getDayName, formatDateFormatted } from '@/utils/exportUtils';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ReportTableProps {
  reports: DailyReport[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onViewDetail: (report: DailyReport) => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
}

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
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, statusFilter, dateFilter, itemsPerPage]);

  // Filtered dataset
  const filteredReports = reports.filter((item) => {
    const matchesSearch = 
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unitKerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsiPermohonan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.solusiIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.picSupport.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
    const matchesDate = !dateFilter || item.tanggalPengerjaan === dateFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // Pagination Calculations
  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Laporan Pekerjaan</span>
            <span className="text-xs bg-pegadaian-100 text-pegadaian-800 font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
              {totalItems.toLocaleString('id-ID')} Data
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Service Support Kantor Wilayah - PT. Pegadaian
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user, unit kerja, solusi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-pegadaian-500 focus:border-pegadaian-500 transition-all"
            />
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pegadaian-500 transition-all"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Hardware Kanwil">Hardware Kanwil</option>
            <option value="Software Kanwil">Software Kanwil</option>
            <option value="Network/Jaringan">Network/Jaringan</option>
            <option value="Video Confference & Meeting">Video Confference & Meeting</option>
            <option value="Malware">Malware</option>
            <option value="Relokasi/Renovasi">Relokasi/Renovasi</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          {/* Date Filter Quick */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-pegadaian-500 transition-all"
              title="Filter Berdasarkan Tanggal Specific"
            />
          </div>

          {/* Reset Filters button */}
          {(searchTerm || dateFilter || selectedCategory !== 'Semua') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                onSelectCategory('Semua');
              }}
              className="text-xs font-bold text-slate-500 hover:text-red-600 underline px-1 transition-colors"
            >
              Reset Filter
            </button>
          )}

          {/* Add New Report Button (Icon Only) */}
          <button
            onClick={onOpenAddModal}
            className="p-2 bg-pegadaian-600 hover:bg-pegadaian-700 text-white rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center"
            title="Buat Laporan Baru"
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          {/* Export Dialog Button (Icon Only) */}
          <button
            onClick={onOpenExportModal}
            className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center"
            title="Export Laporan Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
          </button>
        </div>
      </div>

      {/* Table View Container */}
      <div className="p-3 sm:p-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs md:text-sm align-middle">
            <thead className="bg-amber-400 text-slate-900 uppercase font-bold text-[11px] tracking-wider border-b border-amber-500">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center align-middle border-r border-amber-500/50">No.</th>
                <th className="py-3.5 px-4 min-w-[90px] align-middle border-r border-amber-500/50">Hari</th>
                <th className="py-3.5 px-4 min-w-[110px] align-middle border-r border-amber-500/50">Tanggal</th>
                <th className="py-3.5 px-4 min-w-[140px] align-middle border-r border-amber-500/50">PIC</th>
                <th className="py-3.5 px-4 min-w-[140px] align-middle border-r border-amber-500/50">Unit Kerja</th>
                <th className="py-3.5 px-4 min-w-[140px] align-middle border-r border-amber-500/50">Nama User</th>
                <th className="py-3.5 px-4 min-w-[220px] align-middle border-r border-amber-500/50">Deskripsi Permohonan</th>
                <th className="py-3.5 px-4 min-w-[100px] align-middle border-r border-amber-500/50 text-center">Metode</th>
                <th className="py-3.5 px-4 min-w-[220px] align-middle border-r border-amber-500/50">Solusi Issue</th>
                <th className="py-3.5 px-4 min-w-[75px] align-middle border-r border-amber-500/50 text-center">Mulai</th>
                <th className="py-3.5 px-4 min-w-[75px] align-middle border-r border-amber-500/50 text-center">Selesai</th>
                <th className="py-3.5 px-4 min-w-[85px] align-middle border-r border-amber-500/50 text-center">SLA</th>
                <th className="py-3.5 px-4 w-20 align-middle text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-14 text-center text-slate-500 align-middle">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-10 h-10 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada laporan pekerjaan ditemukan</p>
                      <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter tanggal yang digunakan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((item, index) => {
                  const slaStr = calculateSLA(item.waktuMulai, item.waktuSelesai);
                  const dayName = getDayName(item.tanggalPengerjaan);
                  const formattedDate = formatDateFormatted(item.tanggalPengerjaan);
                  const rowNumber = startIndex + index + 1;

                  return (
                    <tr 
                      key={item.id || index}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer border-b border-slate-200"
                      onClick={() => onViewDetail(item)}
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 align-middle border-r border-slate-200">
                        {rowNumber}
                      </td>

                      {/* Hari */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 align-middle border-r border-slate-200 whitespace-nowrap">
                        {dayName}
                      </td>

                      {/* Tanggal Pelaporan */}
                      <td className="py-3.5 px-4 text-slate-800 align-middle border-r border-slate-200 whitespace-nowrap font-medium">
                        {formattedDate}
                      </td>

                      {/* PIC */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle border-r border-slate-200">
                        <p className="line-clamp-2">{item.picSupport}</p>
                      </td>

                      {/* Unit Kerja */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium align-middle border-r border-slate-200">
                        <p className="line-clamp-2">{item.unitKerja}</p>
                      </td>

                      {/* Nama User */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle border-r border-slate-200">
                        <p className="line-clamp-2">{item.nama}</p>
                      </td>

                      {/* Deskripsi Permohonan */}
                      <td className="py-3.5 px-4 text-slate-700 align-middle border-r border-slate-200">
                        <p className="line-clamp-2">{item.deskripsiPermohonan}</p>
                      </td>

                      {/* Metode Penanganan */}
                      <td className="py-3.5 px-4 text-center align-middle border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded font-bold text-xs bg-slate-100 text-slate-800 border border-slate-300">
                          {item.metodePenanganan}
                        </span>
                      </td>

                      {/* Solusi Issue */}
                      <td className="py-3.5 px-4 text-slate-800 font-medium align-middle border-r border-slate-200">
                        <p className="line-clamp-2">{item.solusiIssue}</p>
                      </td>

                      {/* Waktu Mulai */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs align-middle border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {item.waktuMulai}
                      </td>

                      {/* Waktu Selesai */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs align-middle border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {item.waktuSelesai}
                      </td>

                      {/* SLA */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold align-middle border-r border-slate-200 text-pegadaian-700 bg-pegadaian-50/50 whitespace-nowrap">
                        {slaStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-pegadaian-50 text-pegadaian-700 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id!)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Pagination Footer Controls */}
      {totalItems > 0 && (
        <div className="px-3 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
          
          {/* Top/Left: Rows Per Page & Summary */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-1.5">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 bg-white rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-pegadaian-500 cursor-pointer text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>baris</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="text-slate-500">
              <strong className="text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-pegadaian-800">{totalItems.toLocaleString('id-ID')}</strong> Laporan
            </div>
          </div>

          {/* Right: Pagination Navigation Buttons */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Buttons */}
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
                    className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-2 rounded-lg font-extrabold text-xs transition-all ${
                      isActive
                        ? 'bg-pegadaian-700 text-white shadow-md shadow-pegadaian-700/20'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Confirm Delete Modal */}
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
    </div>
  );
};
