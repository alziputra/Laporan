'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  KeyRound,
  Download,
  Mail,
  Building,
  Laptop,
  FileSpreadsheet,
  Calendar,
  Clock,
  Zap,
  Layers,
  Eye,
  BarChart3,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  UserCheck
} from 'lucide-react';
import { UserProfile, KANWIL_LIST, USER_ROLES, AdminUserSavePayload } from '@/types/user';
import { DailyReport, ReportCategory } from '@/types/report';
import { authService } from '@/services/authService';
import { reportsService } from '@/services/reportsService';
import { useAuth } from '@/context/AuthContext';
import { AdminUserModal } from '@/components/AdminUserModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ReportDetailModal } from '@/components/ReportDetailModal';
import { ExportModal } from '@/components/ExportModal';
import { calculateSLA, getDayName, formatDateFormatted } from '@/utils/exportUtils';
import * as XLSX from 'xlsx';

interface AdminUserManagementProps {
  onBackToDashboard: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

const CATEGORY_ITEMS: { name: string; label: string }[] = [
  { name: 'Semua', label: 'Semua Kategori' },
  { name: 'Hardware Kanwil', label: 'Hardware' },
  { name: 'Software Kanwil', label: 'Software' },
  { name: 'Network/Jaringan', label: 'Network' },
  { name: 'Video Confference & Meeting', label: 'Meeting' },
  { name: 'Malware', label: 'Malware' },
  { name: 'Relokasi/Renovasi', label: 'Relokasi' },
  { name: 'Lainnya', label: 'Lainnya' },
];

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  onBackToDashboard,
  onShowToast
}) => {
  const { userProfile: currentAdmin, refreshUserProfile } = useAuth();

  // Navigation Tab State: 'users' | 'reports' | 'analytics' (Default: 'analytics')
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'analytics'>('analytics');

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // All Reports State
  const [allReports, setAllReports] = useState<DailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // User Tab Filters
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserKanwil, setSelectedUserKanwil] = useState('Semua');
  const [selectedUserRole, setSelectedUserRole] = useState('Semua');

  // Report Tab Filters
  const [searchReportQuery, setSearchReportQuery] = useState('');
  const [selectedReportKanwil, setSelectedReportKanwil] = useState('Semua');
  const [selectedReportUser, setSelectedReportUser] = useState('Semua');
  const [selectedReportCategory, setSelectedReportCategory] = useState('Semua');
  const [reportDateFilter, setReportDateFilter] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Direct Password Reset Modal state
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Report Detail Modal
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Pagination for Reports Tab
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState(10);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load All Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await authService.getAllUsers();
      setUsers(data);
      return data;
    } catch (err) {
      console.error('Failed to load users:', err);
      onShowToast('Gagal memuat daftar pengguna.', 'error');
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load All Reports
  const loadAllReports = async (userList?: UserProfile[]) => {
    try {
      setLoadingReports(true);
      const targetUsers = userList || users;
      const reports = await reportsService.getAllUsersReports(targetUsers);
      setAllReports(reports);
    } catch (err) {
      console.error('Failed to load all reports:', err);
      onShowToast('Gagal memuat seluruh laporan IT.', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const loadedUsers = await loadUsers();
      await loadAllReports(loadedUsers);
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const loadedUsers = await loadUsers();
    await loadAllReports(loadedUsers);
    setRefreshing(false);
    onShowToast('Data berhasil diperbarui!');
  };

  // User Map for fast lookup by UID
  const userMap = useMemo(() => new Map(users.map(u => [u.uid, u])), [users]);

  // Robust matching helper to check if a report belongs to a user
  const isReportMatchingUser = (report: DailyReport, user: UserProfile): boolean => {
    if (!user) return false;
    // 1. Direct UID match
    if (report.userId && report.userId === user.uid) return true;

    // 2. Full Name / Email match
    const pic = (report.picSupport || '').toLowerCase().trim();
    const name = (user.displayName || '').toLowerCase().trim();
    const email = (user.email || '').toLowerCase().trim();

    if (name && pic.includes(name)) return true;
    if (email && pic.includes(email)) return true;

    // 3. First name match fallback (e.g. 'alzi', 'rizky', 'triwan')
    const firstName = name.split(' ')[0];
    if (firstName && firstName.length > 2 && pic.includes(firstName)) return true;

    return false;
  };

  // Robust matching helper to check if a report belongs to a Kanwil
  const isReportMatchingKanwil = (report: DailyReport, kanwil: string): boolean => {
    if (kanwil === 'Semua') return true;

    // 1. Check if report's userId belongs to a user in this Kanwil
    if (report.userId && userMap.has(report.userId)) {
      const owner = userMap.get(report.userId);
      if (owner?.kanwil === kanwil) return true;
    }

    // 2. Text match on picSupport or unitKerja
    const kLower = kanwil.toLowerCase();
    const pic = (report.picSupport || '').toLowerCase();
    const unit = (report.unitKerja || '').toLowerCase();

    if (pic.includes(kLower) || unit.includes(kLower)) return true;

    // 3. Extract Kanwil number (e.g. 'kanwil viii' from 'Kanwil VIII - Jakarta 1')
    const kanwilPrefix = kanwil.split('-')[0]?.trim().toLowerCase();
    if (kanwilPrefix && (pic.includes(kanwilPrefix) || unit.includes(kanwilPrefix))) return true;

    return false;
  };

  // Switch tab and drill down to a specific user's reports
  const handleDrillDownUserReports = (user: UserProfile) => {
    setSelectedReportUser(user.displayName || user.email);
    if (user.kanwil) {
      setSelectedReportKanwil(user.kanwil);
    }
    setSelectedReportCategory('Semua');
    setReportDateFilter('');
    setSearchReportQuery('');
    setActiveTab('reports');
  };

  // Filter non-admin users for PIC dropdown in Tab 2
  const availableOfficersForFilter = useMemo(() => {
    const nonAdminUsers = users.filter(u => u.role !== 'Admin' && u.role !== 'Super Admin');
    if (selectedReportKanwil === 'Semua') {
      return nonAdminUsers;
    }
    return nonAdminUsers.filter(u => u.kanwil === selectedReportKanwil);
  }, [users, selectedReportKanwil]);

  // Synchronized Filter Change Handlers
  const handleUserFilterChange = (userName: string) => {
    setSelectedReportUser(userName);
    if (userName !== 'Semua') {
      const targetUser = users.find(u => (u.displayName || u.email) === userName);
      if (targetUser && targetUser.kanwil) {
        setSelectedReportKanwil(targetUser.kanwil);
      }
    }
  };

  const handleKanwilFilterChange = (kanwilName: string) => {
    setSelectedReportKanwil(kanwilName);
    if (kanwilName !== 'Semua' && selectedReportUser !== 'Semua') {
      const targetUser = users.find(u => (u.displayName || u.email) === selectedReportUser);
      if (targetUser && targetUser.kanwil && targetUser.kanwil !== kanwilName) {
        setSelectedReportUser('Semua');
      }
    }
  };

  // --- Calculations for Users Tab ---
  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === 'Admin' || u.role === 'Super Admin').length;
    const supervisorCount = users.filter((u) => u.role === 'Supervisor').length;
    const supportCount = users.filter((u) => u.role === 'Desktop Support' || !u.role).length;
    return { total, adminCount, supervisorCount, supportCount };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchUserQuery.toLowerCase();
      const matchSearch =
        !q ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.nik && u.nik.toLowerCase().includes(q)) ||
        (u.unitKerja && u.unitKerja.toLowerCase().includes(q));

      const matchKanwil = selectedUserKanwil === 'Semua' || u.kanwil === selectedUserKanwil;
      const matchRole =
        selectedUserRole === 'Semua' ||
        u.role === selectedUserRole ||
        (selectedUserRole === 'Desktop Support' && !u.role);

      return matchSearch && matchKanwil && matchRole;
    });
  }, [users, searchUserQuery, selectedUserKanwil, selectedUserRole]);

  // --- Calculations for Reports Tab ---
  // 1. Base filtered reports (Search + User + Kanwil + Date) BEFORE category pill filter
  const baseFilteredReports = useMemo(() => {
    return allReports.filter((item) => {
      const q = searchReportQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.unitKerja && item.unitKerja.toLowerCase().includes(q)) ||
        (item.deskripsiPermohonan && item.deskripsiPermohonan.toLowerCase().includes(q)) ||
        (item.solusiIssue && item.solusiIssue.toLowerCase().includes(q)) ||
        (item.picSupport && item.picSupport.toLowerCase().includes(q));

      const matchDate = !reportDateFilter || item.tanggalPengerjaan === reportDateFilter;

      let matchUser = true;
      if (selectedReportUser !== 'Semua') {
        const targetUser = users.find(u => (u.displayName || u.email) === selectedReportUser);
        if (targetUser) {
          matchUser = isReportMatchingUser(item, targetUser);
        } else {
          matchUser = item.picSupport?.toLowerCase().includes(selectedReportUser.toLowerCase()) || false;
        }
      }

      let matchKanwil = true;
      if (selectedReportKanwil !== 'Semua') {
        if (selectedReportUser !== 'Semua') {
          const targetUser = users.find(u => (u.displayName || u.email) === selectedReportUser);
          if (targetUser && targetUser.kanwil === selectedReportKanwil) {
            matchKanwil = true;
          } else {
            matchKanwil = isReportMatchingKanwil(item, selectedReportKanwil);
          }
        } else {
          matchKanwil = isReportMatchingKanwil(item, selectedReportKanwil);
        }
      }

      return matchSearch && matchDate && matchUser && matchKanwil;
    });
  }, [
    allReports,
    searchReportQuery,
    reportDateFilter,
    selectedReportUser,
    selectedReportKanwil,
    users,
    userMap
  ]);

  // 2. Final filtered reports (Base + Category filter)
  const filteredReports = useMemo(() => {
    if (selectedReportCategory === 'Semua') {
      return baseFilteredReports;
    }
    return baseFilteredReports.filter((r) => r.category === selectedReportCategory);
  }, [baseFilteredReports, selectedReportCategory]);

  // 3. Category count pills dynamically synced with current filters
  const categoryPillCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua': baseFilteredReports.length
    };
    CATEGORY_ITEMS.forEach((cat) => {
      if (cat.name !== 'Semua') {
        counts[cat.name] = baseFilteredReports.filter((r) => r.category === cat.name).length;
      }
    });
    return counts;
  }, [baseFilteredReports]);

  // 4. Real-time KPI Stats in Tab 2 dynamically synced
  const reportStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sourceReports = baseFilteredReports;
    const total = sourceReports.length;
    const todayReports = sourceReports.filter((r) => r.tanggalPengerjaan === todayStr);

    let totalMinutes = 0;
    let validSLACount = 0;
    sourceReports.forEach((r) => {
      if (r.waktuMulai && r.waktuSelesai) {
        const [sh, sm] = r.waktuMulai.split(':').map(Number);
        const [eh, em] = r.waktuSelesai.split(':').map(Number);
        let startM = (sh || 0) * 60 + (sm || 0);
        let endM = (eh || 0) * 60 + (em || 0);
        if (endM < startM) endM += 24 * 60;
        totalMinutes += endM - startM;
        validSLACount++;
      }
    });

    const avgMinutes = validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgRemMins = avgMinutes % 60;
    const avgSlaFormatted = `${avgHours}:${avgRemMins.toString().padStart(2, '0')}:00`;

    const uniquePics = new Set(sourceReports.map((r) => r.picSupport?.toLowerCase()).filter(Boolean));

    return {
      total,
      todayCount: todayReports.length,
      avgSlaFormatted,
      avgMinutes,
      activePicCount: uniquePics.size
    };
  }, [baseFilteredReports]);

  // Pagination for Reports
  const totalReportItems = filteredReports.length;
  const totalReportPages = Math.max(1, Math.ceil(totalReportItems / reportItemsPerPage));
  const startReportIndex = (reportCurrentPage - 1) * reportItemsPerPage;
  const endReportIndex = Math.min(startReportIndex + reportItemsPerPage, totalReportItems);
  const paginatedReports = filteredReports.slice(startReportIndex, endReportIndex);

  useEffect(() => {
    setReportCurrentPage(1);
  }, [searchReportQuery, selectedReportCategory, reportDateFilter, selectedReportUser, selectedReportKanwil, reportItemsPerPage]);

  // SLA Color Helper
  const getSLABadge = (slaStr: string) => {
    const [h, m] = slaStr.split(':').map(Number);
    const totalM = (h || 0) * 60 + (m || 0);

    if (totalM <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Zap className="w-3 h-3 text-emerald-500" />
          <span>{slaStr}</span>
        </span>
      );
    }
    if (totalM <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <span>{slaStr}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span>{slaStr}</span>
      </span>
    );
  };

  // --- Actions ---
  const handleSaveUser = async (payload: AdminUserSavePayload) => {
    try {
      await authService.adminSaveUser(payload);
      onShowToast(payload.uid ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
      await loadUsers();
      if (currentAdmin?.uid === payload.uid) {
        refreshUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Gagal menyimpan pengguna.', 'error');
      throw err;
    }
  };

  const handleQuickRoleChange = async (user: UserProfile, newRole: string) => {
    try {
      await authService.adminUpdateRole(user.uid, newRole as any);
      onShowToast(`Role ${user.displayName} diubah menjadi ${newRole}.`);
      await loadUsers();
      if (currentAdmin?.uid === user.uid) {
        refreshUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Gagal mengubah role pengguna.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await authService.adminDeleteUser(deletingUser.uid);
      onShowToast(`Akun ${deletingUser.displayName} berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Gagal menghapus pengguna.', 'error');
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (!newPasswordInput || newPasswordInput.length < 6) {
      onShowToast('Kata sandi baru minimal 6 karakter.', 'error');
      return;
    }
    try {
      setResetLoading(true);
      await authService.adminSaveUser({
        uid: resettingUser.uid,
        displayName: resettingUser.displayName,
        email: resettingUser.email,
        password: newPasswordInput,
        kanwil: resettingUser.kanwil,
        unitKerja: resettingUser.unitKerja,
        nik: resettingUser.nik,
        role: resettingUser.role
      });
      onShowToast(`Kata sandi untuk ${resettingUser.displayName} berhasil diperbarui.`);
      setIsResetModalOpen(false);
      setResettingUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Gagal mereset kata sandi.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      onShowToast('Tidak ada data pengguna untuk di-export.', 'error');
      return;
    }
    const exportData = filteredUsers.map((u, idx) => ({
      'No.': idx + 1,
      'Nama Pengguna': u.displayName,
      'Email': u.email,
      'NIK': u.nik || '-',
      'Kantor Wilayah': u.kanwil || 'Kanwil I - Medan',
      'Unit Kerja': u.unitKerja || '-',
      'Role Akses': u.role || 'Desktop Support',
      'Tanggal Dibuat': u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Pengguna');
    XLSX.writeFile(wb, `Data_Pengguna_IT_Pegadaian_${new Date().toISOString().split('T')[0]}.xlsx`);
    onShowToast('Data pengguna berhasil di-export ke Excel.');
  };

  const formatDate = (dateVal?: any) => {
    if (!dateVal) return '-';
    try {
      const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Executive Banner & Navigation */}
      <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-500/30 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-white/10 text-emerald-300 border border-white/15 shadow-xs flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                  Panel Administrasi & Monitoring IT
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Pusat Kontrol Nasional
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                Kelola hak akses personil, monitoring seluruh tiket IT Support se-Indonesia, dan evaluasi kepatuhan SLA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Muat Ulang Seluruh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {activeTab === 'users' ? (
              <>
                <button
                  onClick={handleExportUsers}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border border-emerald-400/40 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export User</span>
                </button>

                <button
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-pegadaian-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-pegadaian-950" />
                  <span>Tambah User</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsExportModalOpen(true)}
                disabled={allReports.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-pegadaian-950 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4 text-pegadaian-950" />
                <span>Export Laporan Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Tab Switcher */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/10 overflow-x-auto [&::-webkit-scrollbar]:hidden">

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${activeTab === 'analytics'
              ? 'bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30'
              : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Statistik & Kinerja SLA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${activeTab === 'reports'
              ? 'bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30'
              : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Monitoring Seluruh Laporan</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {allReports.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${activeTab === 'users'
              ? 'bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30'
              : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Manajemen Pengguna</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MANAJEMEN PENGGUNA                                */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* User Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total Pengguna</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">{userStats.total}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Akun terdaftar</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-pegadaian-700 flex items-center justify-center border border-emerald-100 shrink-0 ml-1.5">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Administrator</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">{userStats.adminCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Akses penuh</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shrink-0 ml-1.5">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Desktop Support</p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5 sm:mt-1">{userStats.supportCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Pelapor harian</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 ml-1.5">
                <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Supervisor</p>
                <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1">{userStats.supervisorCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Pengawas</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0 ml-1.5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            {/* Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Cari nama, email, NIK, unit..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedUserKanwil}
                    onChange={(e) => setSelectedUserKanwil(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
                  >
                    <option value="Semua">Semua Kanwil</option>
                    {KANWIL_LIST.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedUserRole}
                    onChange={(e) => setSelectedUserRole(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
                  >
                    <option value="Semua">Semua Role</option>
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs align-middle border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[11px] font-extrabold tracking-wider border-b-2 border-emerald-500/50">
                    <th className="py-3.5 px-3 w-12 text-center border-r border-slate-800">No</th>
                    <th className="py-3.5 px-4 min-w-[180px] border-r border-slate-800">Pengguna</th>
                    <th className="py-3.5 px-4 min-w-[160px] border-r border-slate-800">Kantor Wilayah & Unit</th>
                    <th className="py-3.5 px-4 min-w-[90px] border-r border-slate-800">NIK</th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-800">Role Akses</th>
                    <th className="py-3.5 px-4 min-w-[110px] border-r border-slate-800">Terdaftar</th>
                    <th className="py-3.5 px-4 w-40 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <RefreshCw className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                        <p className="font-bold text-xs">Memuat data pengguna...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Tidak ada pengguna ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter Kanwil/Role</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const isCurrent = currentAdmin?.uid === user.uid;
                      const role = user.role || 'Desktop Support';
                      const isAdminRole = role === 'Admin' || role === 'Super Admin';

                      return (
                        <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* User Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pegadaian-600 to-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 truncate">
                                    {user.displayName}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kanwil & Unit */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block font-semibold text-slate-800 text-[11px]">
                              {user.kanwil || 'Kanwil I - Medan'}
                            </span>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {user.unitKerja || '-'}
                            </p>
                          </td>

                          {/* NIK */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                            {user.nik ? (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold border border-slate-200">
                                {user.nik}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Role Switcher */}
                          <td className="py-3.5 px-4">
                            <div className="relative inline-block">
                              <select
                                value={role}
                                onChange={(e) => handleQuickRoleChange(user, e.target.value)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all appearance-none pr-6 focus:outline-none ${isAdminRole
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : role === 'Supervisor'
                                    ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                                    : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                  }`}
                              >
                                {USER_ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] opacity-60">
                                ▼
                              </span>
                            </div>
                          </td>

                          {/* Created At */}
                          <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Drill Down to User Reports (Only for non-admin accounts) */}
                              {!isAdminRole && (
                                <button
                                  onClick={() => handleDrillDownUserReports(user)}
                                  className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 hover:border-emerald-400 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                  title={`Buka & Filter Laporan ${user.displayName}`}
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                                  <span className="text-[10px] font-black hidden xl:inline">Laporan</span>
                                </button>
                              )}

                              {/* Edit User */}
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                                title="Edit Data User"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setResettingUser(user);
                                  setNewPasswordInput('');
                                  setIsResetModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => {
                                  setDeletingUser(user);
                                  setIsDeleteModalOpen(true);
                                }}
                                disabled={isCurrent}
                                className={`p-1.5 rounded-lg border transition-all ${isCurrent
                                  ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200 cursor-pointer'
                                  }`}
                                title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Table Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Menampilkan {filteredUsers.length} dari total {users.length} pengguna</span>
              <span className="text-[11px] text-slate-400">Pegadaian Helpdesk Management System</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MONITORING SELURUH LAPORAN NASIONAL               */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Reports Overview KPI Cards (Real-time Filtered) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  {selectedReportUser !== 'Semua' ? 'Laporan Petugas Ini' : 'Total Seluruh Laporan'}
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 mt-0.5 sm:mt-1">{reportStats.total}</h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5 truncate">
                  {selectedReportUser !== 'Semua' ? selectedReportUser : 'Semua Petugas IT'}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Laporan Hari Ini</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700 mt-0.5 sm:mt-1">{reportStats.todayCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">Tiket aktif hari ini</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Rata-Rata SLA</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-700 mt-0.5 sm:mt-1 font-mono">{reportStats.avgSlaFormatted}</h3>
                <p className="text-[10px] sm:text-[11px] text-teal-600 font-bold mt-0.5 truncate">Kecepatan Respons</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Petugas Terlibat</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-700 mt-0.5 sm:mt-1">{reportStats.activePicCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">PIC IT Support</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* Central Reports Table Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            {/* Synchronized Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col gap-3">
              {/* Row 1: Search & Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari unit kerja, pemohon, masalah, solusi, PIC..."
                    value={searchReportQuery}
                    onChange={(e) => setSearchReportQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 font-medium"
                  />
                  {searchReportQuery && (
                    <button
                      onClick={() => setSearchReportQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Personil / PIC Support (Synchronized) */}
                <select
                  value={selectedReportUser}
                  onChange={(e) => handleUserFilterChange(e.target.value)}
                  className={`px-3 py-2 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${selectedReportUser !== 'Semua'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50'
                    : 'border-slate-200 text-slate-700'
                    }`}
                >
                  <option value="Semua">Semua Petugas IT ({availableOfficersForFilter.length})</option>
                  {availableOfficersForFilter.map((u) => (
                    <option key={u.uid} value={u.displayName || u.email}>
                      {u.displayName} ({u.kanwil || 'Kanwil'})
                    </option>
                  ))}
                </select>

                {/* Filter Kantor Wilayah (Synchronized) */}
                <select
                  value={selectedReportKanwil}
                  onChange={(e) => handleKanwilFilterChange(e.target.value)}
                  className={`px-3 py-2 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${selectedReportKanwil !== 'Semua'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50'
                    : 'border-slate-200 text-slate-700'
                    }`}
                >
                  <option value="Semua">Semua Kanwil</option>
                  {KANWIL_LIST.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                {/* Date Filter Button */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const input = dateInputRef.current as any;
                        if (input?.showPicker) {
                          input.showPicker();
                        } else {
                          input?.focus();
                        }
                      } catch {
                        dateInputRef.current?.focus();
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${reportDateFilter
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 ${reportDateFilter ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{reportDateFilter ? formatDateFormatted(reportDateFilter) : 'Filter Tanggal'}</span>
                    {reportDateFilter && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReportDateFilter('');
                        }}
                        className="ml-1 p-0.5 hover:bg-emerald-200/60 rounded-full text-emerald-800"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={reportDateFilter}
                    onChange={(e) => setReportDateFilter(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                  />
                </div>

                {/* Reset Filter */}
                {(searchReportQuery || reportDateFilter || selectedReportCategory !== 'Semua' || selectedReportUser !== 'Semua' || selectedReportKanwil !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchReportQuery('');
                      setReportDateFilter('');
                      setSelectedReportCategory('Semua');
                      setSelectedReportUser('Semua');
                      setSelectedReportKanwil('Semua');
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Row 2: Category Pills (Synchronized real-time with active User/Kanwil/Date) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {CATEGORY_ITEMS.map((cat) => {
                  const isSelected = selectedReportCategory === cat.name;
                  const count = categoryPillCounts[cat.name] || 0;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedReportCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 cursor-pointer ${isSelected
                        ? 'bg-pegadaian-700 text-white shadow-xs ring-2 ring-emerald-400/30'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold'
                        }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Reports Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs align-middle border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-pegadaian-900 to-slate-900 text-white uppercase text-[11px] font-extrabold tracking-wider border-b-2 border-emerald-500/50">
                    <th className="py-3.5 px-3 w-12 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3.5 px-3 min-w-[85px] border-r border-slate-700/60">Hari</th>
                    <th className="py-3.5 px-3 min-w-[100px] border-r border-slate-700/60">Tanggal</th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">PIC Support</th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">Unit Kerja</th>
                    <th className="py-3.5 px-4 min-w-[120px] border-r border-slate-700/60">Nama User</th>
                    <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-700/60">Deskripsi Permohonan</th>
                    <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-700/60">Solusi Issue</th>
                    <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">Mulai</th>
                    <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">Selesai</th>
                    <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">SLA</th>
                    <th className="py-3.5 px-3 w-16 text-center">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingReports ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-slate-500">
                        <RefreshCw className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                        <p className="font-bold text-xs">Memuat data seluruh laporan IT...</p>
                      </td>
                    </tr>
                  ) : paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-slate-500">
                        <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Tidak ada laporan ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter petugas, kanwil, atau kategori</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((item, index) => {
                      const slaStr = calculateSLA(item.waktuMulai, item.waktuSelesai);
                      const dayName = getDayName(item.tanggalPengerjaan);
                      const formattedDate = formatDateFormatted(item.tanggalPengerjaan);
                      const rowNumber = startReportIndex + index + 1;
                      const isEven = index % 2 === 1;

                      return (
                        <tr
                          key={item.id || index}
                          onClick={() => setViewingReport(item)}
                          className={`transition-colors cursor-pointer hover:bg-emerald-50/40 ${isEven ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                        >
                          <td className="py-3.5 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                            {dayName}
                          </td>
                          <td className="py-3.5 px-3 text-slate-800 border-r border-slate-100 whitespace-nowrap font-medium">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 border-r border-slate-100">
                            <p className="line-clamp-2">{item.picSupport}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-semibold border-r border-slate-100">
                            <p className="line-clamp-2">{item.unitKerja}</p>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                            <p className="line-clamp-2">{item.nama}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 border-r border-slate-100">
                            <p className="line-clamp-2 leading-relaxed">{item.deskripsiPermohonan}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium border-r border-slate-100">
                            <p className="line-clamp-2 leading-relaxed">{item.solusiIssue}</p>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                            {item.waktuMulai}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap font-semibold">
                            {item.waktuSelesai}
                          </td>
                          <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                            {getSLABadge(slaStr)}
                          </td>
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setViewingReport(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-pegadaian-700 hover:bg-pegadaian-50 transition-all cursor-pointer"
                              title="Lihat Detail Lengkap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalReportItems > 0 && (
              <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
                <div>
                  Menampilkan <strong>{startReportIndex + 1}</strong>-<strong>{endReportIndex}</strong> dari{' '}
                  <strong className="text-pegadaian-800">{totalReportItems}</strong> Data Laporan
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReportCurrentPage(1)}
                    disabled={reportCurrentPage === 1}
                    className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReportCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={reportCurrentPage === 1}
                    className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    {reportCurrentPage} / {totalReportPages}
                  </span>
                  <button
                    onClick={() => setReportCurrentPage((p) => Math.min(totalReportPages, p + 1))}
                    disabled={reportCurrentPage === totalReportPages}
                    className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReportCurrentPage(totalReportPages)}
                    disabled={reportCurrentPage === totalReportPages}
                    className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STATISTIK & KINERJA SLA                            */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Categories */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Sebaran Kategori Issue</h4>
                  <p className="text-[11px] text-slate-400">Pekerjaan terbanyak dilaporkan</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {CATEGORY_ITEMS.filter(c => c.name !== 'Semua').map((cat) => {
                  const count = allReports.filter(r => r.category === cat.name).length;
                  const pct = allReports.length > 0 ? Math.round((count / allReports.length) * 100) : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{cat.label}</span>
                        <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pegadaian-600 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA Response Speed Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Distribusi Kecepatan SLA</h4>
                  <p className="text-[11px] text-slate-400">Standar respons penanganan masalah</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900">⚡ Super Cepat (&lt; 5 Menit)</span>
                    <p className="text-[11px] text-emerald-700">Resolusi langsung</p>
                  </div>
                  <span className="text-base font-black text-emerald-800">
                    {allReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff <= 5;
                    }).length} Tiket
                  </span>
                </div>

                <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-teal-900">Standar (5 - 15 Menit)</span>
                    <p className="text-[11px] text-teal-700">Penanganan software / konfigurasi</p>
                  </div>
                  <span className="text-base font-black text-teal-800">
                    {allReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff > 5 && diff <= 15;
                    }).length} Tiket
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-amber-900">Kompleks (&gt; 15 Menit)</span>
                    <p className="text-[11px] text-amber-700">Hardware / Relokasi / Jaringan</p>
                  </div>
                  <span className="text-base font-black text-amber-800">
                    {allReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff > 15;
                    }).length} Tiket
                  </span>
                </div>
              </div>
            </div>

            {/* Top IT Support Officers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Aktivitas Personil IT Support</h4>
                  <p className="text-[11px] text-slate-400">Total pekerjaan tercatat</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {users
                  .filter(u => u.role !== 'Admin' && u.role !== 'Super Admin')
                  .map(u => ({
                    ...u,
                    ticketCount: allReports.filter(r => isReportMatchingUser(r, u)).length
                  }))
                  .sort((a, b) => b.ticketCount - a.ticketCount)
                  .map((u, i) => {
                    return (
                      <div key={u.uid} className="flex items-center justify-between pt-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{u.displayName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.kanwil || 'Kanwil VIII'}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                          {u.ticketCount} Tiket
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Admin User Modal (Add & Edit) */}
      <AdminUserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        initialUser={editingUser}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingUser?.displayName}" (${deletingUser?.email})? Tindakan ini permanen.`}
        confirmText="Hapus Pengguna"
      />

      {/* Direct Password Reset Modal */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100 mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">Reset Kata Sandi</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Atur kata sandi baru untuk akun <strong className="text-slate-800">{resettingUser.displayName}</strong> ({resettingUser.email}).
            </p>

            <form onSubmit={handleConfirmResetPassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal (Read-Only Mode for Admin) */}
      {viewingReport && (
        <ReportDetailModal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          report={viewingReport}
          readOnly={true}
        />
      )}

      {/* Export Modal with Date Cycle and Category Filters */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reports={allReports}
          users={users}
          showUserFilter={true}
          initialUser={selectedReportUser !== 'Semua' ? selectedReportUser : undefined}
        />
      )}
    </div>
  );
};
