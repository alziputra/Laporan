'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2,
  KeyRound,
  Download,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Laptop
} from 'lucide-react';
import { UserProfile, KANWIL_LIST, USER_ROLES, AdminUserSavePayload } from '@/types/user';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { AdminUserModal } from '@/components/AdminUserModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import * as XLSX from 'xlsx';

interface AdminUserManagementProps {
  onBackToDashboard: () => void;
  onShowToast: (message: string) => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  onBackToDashboard,
  onShowToast
}) => {
  const { userProfile: currentAdmin, refreshUserProfile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKanwil, setSelectedKanwil] = useState('Semua');
  const [selectedRole, setSelectedRole] = useState('Semua');

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

  // Load all users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      onShowToast('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    onShowToast('Daftar pengguna diperbarui.');
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.unitKerja && u.unitKerja.toLowerCase().includes(q)) ||
        (u.nik && u.nik.toLowerCase().includes(q));

      const matchKanwil = selectedKanwil === 'Semua' || u.kanwil === selectedKanwil;
      const matchRole = selectedRole === 'Semua' || (u.role || 'Desktop Support') === selectedRole;

      return matchSearch && matchKanwil && matchRole;
    });
  }, [users, searchQuery, selectedKanwil, selectedRole]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === 'Admin' || u.role === 'Super Admin').length;
    const supportCount = users.filter((u) => !u.role || u.role === 'Desktop Support').length;
    const supervisorCount = users.filter((u) => u.role === 'Supervisor').length;

    // Kanwil grouping
    const kanwilCounts: Record<string, number> = {};
    users.forEach((u) => {
      const k = u.kanwil || 'Belum Diatur';
      kanwilCounts[k] = (kanwilCounts[k] || 0) + 1;
    });

    return { total, adminCount, supportCount, supervisorCount, kanwilCounts };
  }, [users]);

  // Save User (Create or Edit)
  const handleSaveUser = async (payload: AdminUserSavePayload) => {
    try {
      const saved = await authService.adminSaveUser(payload);
      if (payload.uid) {
        onShowToast(`Data pengguna "${saved.displayName}" berhasil diperbarui.`);
      } else {
        onShowToast(`Pengguna baru "${saved.displayName}" berhasil ditambahkan.`);
      }
      await loadUsers();
      if (currentAdmin?.uid === payload.uid) {
        await refreshUserProfile();
      }
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menyimpan pengguna.');
    }
  };

  // Quick Change Role
  const handleQuickRoleChange = async (user: UserProfile, newRole: string) => {
    if (user.uid === currentAdmin?.uid && newRole !== 'Admin') {
      const confirmSelf = confirm('Anda sedang menurunkan role akun Anda sendiri dari Admin. Lanjutkan?');
      if (!confirmSelf) return;
    }

    try {
      await authService.adminUpdateRole(user.uid, newRole);
      onShowToast(`Role "${user.displayName}" diubah menjadi ${newRole}.`);
      await loadUsers();
      if (currentAdmin?.uid === user.uid) {
        await refreshUserProfile();
      }
    } catch (err: any) {
      onShowToast('Gagal memperbarui role pengguna.');
    }
  };

  // Open Edit User
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  // Open Create User
  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  // Open Delete User
  const handleOpenDelete = (user: UserProfile) => {
    if (user.uid === currentAdmin?.uid) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await authService.adminDeleteUser(deletingUser.uid);
      onShowToast(`Pengguna "${deletingUser.displayName}" berhasil dihapus.`);
      await loadUsers();
    } catch (err) {
      onShowToast('Gagal menghapus pengguna.');
    } finally {
      setDeletingUser(null);
      setIsDeleteModalOpen(false);
    }
  };

  // Open Password Reset Modal
  const handleOpenResetPassword = (user: UserProfile) => {
    setResettingUser(user);
    setNewPasswordInput('');
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPasswordInput || newPasswordInput.length < 6) {
      alert('Kata sandi baru minimal 6 karakter.');
      return;
    }

    try {
      setResetLoading(true);
      await authService.resetPasswordDirectly({
        email: resettingUser.email,
        newPassword: newPasswordInput
      });
      onShowToast(`Kata sandi untuk "${resettingUser.displayName}" berhasil direset.`);
      setIsResetModalOpen(false);
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setResetLoading(false);
    }
  };

  // Export User List to Excel
  const handleExportUsers = () => {
    if (users.length === 0) {
      alert('Tidak ada data pengguna untuk diekspor.');
      return;
    }

    const exportRows = filteredUsers.map((u, idx) => ({
      No: idx + 1,
      'Nama Lengkap': u.displayName || '',
      Email: u.email || '',
      NIK: u.nik || '-',
      'Kantor Wilayah': u.kanwil || '',
      'Unit Kerja': u.unitKerja || '',
      Role: u.role || 'Desktop Support',
      'Tanggal Dibuat': u.createdAt ? new Date(Number(u.createdAt)).toLocaleDateString('id-ID') : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data User');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Daftar_Pengguna_Pegadaian_${timestamp}.xlsx`);
    onShowToast('Daftar pengguna berhasil diekspor ke Excel!');
  };

  const formatDate = (val: number | string | undefined) => {
    if (!val) return '-';
    try {
      return new Date(Number(val)).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Navigation */}
      <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start md:items-center gap-3 sm:gap-4">
          <button
            onClick={onBackToDashboard}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-xs active:scale-95 flex items-center justify-center shrink-0"
            title="Kembali ke Laporan"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight truncate">
                Panel Manajemen Pengguna
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Admin Area
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium mt-0.5 truncate">
              Kelola akun personel IT Desktop Support & hak akses role
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-xs active:scale-95"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-400/40 transition-all shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-pegadaian-900 font-extrabold text-xs shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-pegadaian-950" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Users */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total Pengguna</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">{stats.total}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Akun terdaftar</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-pegadaian-700 flex items-center justify-center border border-emerald-100 shrink-0 ml-1.5">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Administrator */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Administrator</p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">{stats.adminCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Akses penuh</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shrink-0 ml-1.5">
            <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Desktop Support */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Desktop Support</p>
            <h3 className="text-lg sm:text-2xl font-black text-blue-700 mt-0.5 sm:mt-1">{stats.supportCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Pelapor harian</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 ml-1.5">
            <Laptop className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Supervisor */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Supervisor</p>
            <h3 className="text-lg sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1">{stats.supervisorCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">Pengawas</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0 ml-1.5">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, NIK, unit..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Filter Kanwil */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedKanwil}
              onChange={(e) => setSelectedKanwil(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
            >
              <option value="Semua">Semua Kanwil</option>
              {KANWIL_LIST.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Filter Role */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
            >
              <option value="Semua">Semua Role</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedKanwil !== 'Semua' || selectedRole !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedKanwil('Semua');
                setSelectedRole('Semua');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Kantor Wilayah & Unit</th>
                <th className="py-3.5 px-4">NIK</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pegadaian-600" />
                    <p className="font-semibold">Memuat seluruh pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">Tidak ada data pengguna yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter Kanwil</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isCurrent = user.uid === currentAdmin?.uid;
                  const role = user.role || 'Desktop Support';

                  return (
                    <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors">
                      {/* Number */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm shrink-0">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.displayName}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" />
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

                      {/* Role with selector */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={role}
                            onChange={(e) => handleQuickRoleChange(user, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all appearance-none pr-6 focus:outline-none ${
                              role === 'Admin' || role === 'Super Admin'
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

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all"
                            title="Edit Data User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleOpenDelete(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200'
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

        {/* Footer Count */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Menampilkan {filteredUsers.length} dari total {users.length} pengguna</span>
          <span className="text-[11px] text-slate-400">Pegadaian Helpdesk Management System</span>
        </div>
      </div>

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {resetLoading ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
