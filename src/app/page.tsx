'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ReportTable } from '@/components/ReportTable';
import { ReportFormModal } from '@/components/ReportFormModal';
import { ExportModal } from '@/components/ExportModal';
import { ReportDetailModal } from '@/components/ReportDetailModal';
import { Toast } from '@/components/Toast';
import { reportsService } from '@/services/reportsService';
import { DailyReport, ReportCategory } from '@/types/report';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [defaultFormCategory, setDefaultFormCategory] = useState<ReportCategory>('Hardware Kanwil');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getAllReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Save or Edit report
  const handleSaveReport = async (reportData: DailyReport) => {
    if (editingReport && editingReport.id) {
      await reportsService.updateReport(editingReport.id, reportData);
      showToast('Laporan berhasil diperbarui!');
    } else {
      await reportsService.createReport(reportData);
      showToast('Laporan pekerjaan baru berhasil disimpan!');
    }
    await loadReports();
    setEditingReport(null);
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    await reportsService.deleteReport(id);
    showToast('Laporan berhasil dihapus');
    await loadReports();
  };

  // Open edit modal
  const handleOpenEdit = (report: DailyReport) => {
    setEditingReport(report);
    setDefaultFormCategory(report.category);
    setIsFormOpen(true);
  };

  // Open add modal with auto-selected category if filtered
  const handleOpenAddModal = () => {
    setEditingReport(null);
    if (selectedCategory && selectedCategory !== 'Semua') {
      setDefaultFormCategory(selectedCategory as ReportCategory);
    }
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar & Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-pegadaian-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Memuat data laporan Desktop Support...</p>
          </div>
        ) : (
          <ReportTable
            reports={reports}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onViewDetail={(report) => setViewingReport(report)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteReport}
            onOpenAddModal={handleOpenAddModal}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mb-16 md:mb-0 text-center text-xs font-semibold text-slate-600">
        <p>© 2026 Alzi Rahmana Putra</p>
      </footer>

      {/* Floating Action Button (FAB) for Mobile Screens (< md) */}
      <div className="fixed bottom-5 right-5 z-40 block md:hidden">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-pegadaian-600 hover:bg-pegadaian-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl transition-all active:scale-95 border-2 border-white ring-4 ring-pegadaian-600/20"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-xs font-extrabold tracking-wide">Buat Laporan</span>
        </button>
      </div>

      {/* Modals */}
      <ReportFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        onSave={handleSaveReport}
        initialData={editingReport}
        defaultCategory={defaultFormCategory}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        reports={reports}
      />

      <ReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onEdit={(report) => {
          setViewingReport(null);
          handleOpenEdit(report);
        }}
        onDelete={(id) => {
          handleDeleteReport(id);
          setViewingReport(null);
        }}
      />

      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
