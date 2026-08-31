'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { AdminUserManagement } from '@/components/AdminUserManagement';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { userProfile, isAdmin, loading } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  // Immediate role checking: If not admin or not logged in, auto-redirect to /
  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        router.replace('/');
      } else if (userProfile.role !== 'Admin' && !isAdmin) {
        router.replace('/');
      }
    }
  }, [userProfile, isAdmin, loading, router]);

  // If still checking auth or non-admin is being redirected, display clean loading state
  if (loading || !userProfile || (userProfile.role !== 'Admin' && !isAdmin)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-pegadaian-600 mb-2" />
        <p className="text-xs font-bold text-slate-500">Memverifikasi hak akses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold text-white animate-in slide-in-from-top duration-200 ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-pegadaian-700 border border-emerald-400'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenAuthModal={handleOpenAuthModal}
        activeView="admin"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        <AdminUserManagement
          onBackToDashboard={() => router.push('/')}
          onShowToast={showToast}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs font-semibold text-slate-600 pb-6">
        <p>© 2026 Alzi Rahmana Putra - PT. Pegadaian Helpdesk Management</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </div>
  );
}
