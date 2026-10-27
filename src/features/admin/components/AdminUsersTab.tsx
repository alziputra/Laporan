"use client";

import React from "react";
import {
  Building,
  Edit,
  FileSpreadsheet,
  Filter,
  KeyRound,
  Laptop,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { KANWIL_LIST, USER_ROLES, UserProfile } from "@/features/auth/types/user";

interface UserStats {
  total: number;
  adminCount: number;
  supervisorCount: number;
  supportCount: number;
}

interface AdminUsersTabProps {
  currentAdmin?: UserProfile | null;
  userStats: UserStats;
  usersCount: number;
  searchUserQuery: string;
  onSearchUserQueryChange: (value: string) => void;
  selectedUserKanwil: string;
  onSelectedUserKanwilChange: (value: string) => void;
  selectedUserRole: string;
  onSelectedUserRoleChange: (value: string) => void;
  loadingUsers: boolean;
  filteredUsers: UserProfile[];
  onQuickRoleChange: (user: UserProfile, role: string) => void;
  formatDate: (dateValue?: unknown) => string;
  onDrillDownUserReports: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  currentAdmin,
  userStats,
  usersCount,
  searchUserQuery,
  onSearchUserQueryChange,
  selectedUserKanwil,
  onSelectedUserKanwilChange,
  selectedUserRole,
  onSelectedUserRoleChange,
  loadingUsers,
  filteredUsers,
  onQuickRoleChange,
  formatDate,
  onDrillDownUserReports,
  onEditUser,
  onResetPassword,
  onDeleteUser,
}) => (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* User Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Pengguna
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
                  {userStats.total}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  Akun terdaftar
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-pegadaian-700 flex items-center justify-center border border-emerald-100 shrink-0 ml-1.5">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Administrator
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">
                  {userStats.adminCount}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  Akses penuh
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shrink-0 ml-1.5">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Desktop Support
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5 sm:mt-1">
                  {userStats.supportCount}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  Pelapor harian
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 ml-1.5">
                <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Supervisor
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1">
                  {userStats.supervisorCount}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                  Pengawas
                </p>
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
                  onChange={(e) => onSearchUserQueryChange(e.target.value)}
                  placeholder="Cari nama, email, NIK, unit..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedUserKanwil}
                    onChange={(e) => onSelectedUserKanwilChange(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
                  >
                    <option value="Semua">Semua Kanwil</option>
                    {KANWIL_LIST.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedUserRole}
                    onChange={(e) => onSelectedUserRoleChange(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer"
                  >
                    <option value="Semua">Semua Role</option>
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
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
                    <th className="py-3.5 px-3 w-12 text-center border-r border-slate-800">
                      No
                    </th>
                    <th className="py-3.5 px-4 min-w-[180px] border-r border-slate-800">
                      Pengguna
                    </th>
                    <th className="py-3.5 px-4 min-w-[160px] border-r border-slate-800">
                      Kantor Wilayah & Unit
                    </th>
                    <th className="py-3.5 px-4 min-w-[90px] border-r border-slate-800">
                      NIK
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-800">
                      Role Akses
                    </th>
                    <th className="py-3.5 px-4 min-w-[110px] border-r border-slate-800">
                      Terdaftar
                    </th>
                    <th className="py-3.5 px-4 w-40 text-center">
                      Aksi Manajemen
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-500"
                      >
                        <RefreshCw className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                        <p className="font-bold text-xs">
                          Memuat data pengguna...
                        </p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-500"
                      >
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">
                          Tidak ada pengguna ditemukan
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Coba sesuaikan pencarian atau filter Kanwil/Role
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const isCurrent = currentAdmin?.uid === user.uid;
                      const role = user.role || "Desktop Support";
                      const isAdminRole =
                        role === "Admin" || role === "Super Admin";

                      return (
                        <tr
                          key={user.uid}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* User Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pegadaian-600 to-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {user.displayName
                                  ? user.displayName.charAt(0).toUpperCase()
                                  : "U"}
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
                              {user.kanwil || "Kanwil I - Medan"}
                            </span>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {user.unitKerja || "-"}
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
                                onChange={(e) =>
                                  onQuickRoleChange(user, e.target.value)
                                }
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all appearance-none pr-6 focus:outline-none ${
                                  isAdminRole
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                    : role === "Supervisor"
                                      ? "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100"
                                      : "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
                                }`}
                              >
                                {USER_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
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
                                  onClick={() =>
                                    onDrillDownUserReports(user)
                                  }
                                  className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 hover:border-emerald-400 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                  title={`Buka & Filter Laporan ${user.displayName}`}
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                                  <span className="text-[10px] font-black hidden xl:inline">
                                    Laporan
                                  </span>
                                </button>
                              )}

                              {/* Edit User */}
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all cursor-pointer"
                                title="Edit Data User"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  onResetPassword(user);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                }}
                                disabled={isCurrent}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isCurrent
                                    ? "opacity-30 cursor-not-allowed border-slate-200 text-slate-300"
                                    : "text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200 cursor-pointer"
                                }`}
                                title={
                                  isCurrent
                                    ? "Tidak dapat menghapus akun sendiri"
                                    : "Hapus Pengguna"
                                }
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
              <span>
                Menampilkan {filteredUsers.length} dari total {usersCount}{" "}
                pengguna
              </span>
              <span className="text-[11px] text-slate-400">
                Pegadaian Helpdesk Management System
              </span>
            </div>
          </div>
        </div>

);
