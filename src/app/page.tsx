'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ReportTable } from '@/components/ReportTable';
import { ReportFormModal } from '@/components/ReportFormModal';
import { ExportModal } from '@/components/ExportModal';
import { ReportDetailModal } from '@/components/ReportDetailModal';
import { AuthModal } from '@/components/AuthModal';
import { Toast } from '@/components/Toast';
import { reportsService } from '@/services/reportsService';
import { DailyReport, ReportCategory } from '@/types/report';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile, loading: authLoading } = useAuth();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [defaultFormCategory, setDefaultFormCategory] = useState<ReportCategory>('Hardware Kanwil');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Auth Modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthInitialTab(tab);
    setIsAuthOpen(true);
  };

  const loadReports = async (uid?: string, name?: string) => {
    try {
      setLoading(true);
      const targetUid = uid !== undefined ? uid : userProfile?.uid;
      const targetName = name !== undefined ? name : userProfile?.displayName;
      const data = await reportsService.getAllReports(targetUid, targetName);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadReports(userProfile?.uid, userProfile?.displayName);
      if (!userProfile) {
        setAuthInitialTab('login');
        setIsAuthOpen(true);
      }
    }
  }, [userProfile, authLoading]);

  // Save or Edit report
  const handleSaveReport = async (reportData: DailyReport) => {
    if (editingReport && editingReport.id) {
      await reportsService.updateReport(editingReport.id, reportData, userProfile?.uid);
      showToast('Laporan berhasil diperbarui!');
    } else {
      await reportsService.createReport(reportData, userProfile?.uid);
      showToast('Laporan pekerjaan baru berhasil disimpan!');
    }
    await loadReports(userProfile?.uid, userProfile?.displayName);
    setEditingReport(null);
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    await reportsService.deleteReport(id, userProfile?.uid);
    showToast('Laporan berhasil dihapus');
    await loadReports(userProfile?.uid, userProfile?.displayName);
  };

  // Open edit modal
  const handleOpenEdit = (report: DailyReport) => {
    if (!userProfile) {
      handleOpenAuthModal('login');
      return;
    }
    setEditingReport(report);
    setDefaultFormCategory(report.category);
    setIsFormOpen(true);
  };

  // Open add modal with auto-selected category if filtered
  const handleOpenAddModal = () => {
    if (!userProfile) {
      handleOpenAuthModal('login');
      return;
    }
    setEditingReport(null);
    if (selectedCategory && selectedCategory !== 'Semua') {
      setDefaultFormCategory(selectedCategory as ReportCategory);
    }
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar & Header */}
      <Header onOpenAuthModal={handleOpenAuthModal} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 pb-20 md:pb-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pegadaian-600" />
            <p className="text-xs font-semibold text-slate-500">Memuat data laporan...</p>
          </div>
        ) : (
          <ReportTable
            reports={reports}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onViewDetail={(report) => setViewingReport(report)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteReport}
            onOpenAddModal={handleOpenAddModal}
            onOpenExportModal={() => setIsExportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs font-semibold text-slate-600 pb-20 md:pb-4">
        <p>© 2026 Alzi Rahmana Putra</p>
      </footer>

      {/* Floating Action Button (FAB) for Mobile Screens (< md) */}
      <div className="fixed bottom-4 right-4 z-40 block md:hidden">
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-pegadaian-600 to-pegadaian-700 hover:from-pegadaian-700 hover:to-pegadaian-800 text-white font-extrabold px-4 py-3 rounded-full shadow-2xl transition-all active:scale-95 border-2 border-white ring-4 ring-pegadaian-600/20"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-xs font-extrabold tracking-wide">Buat Laporan</span>
        </button>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
        onSuccess={(msg) => showToast(msg)}
      />

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
        isOpen={!!viewingReport}
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

