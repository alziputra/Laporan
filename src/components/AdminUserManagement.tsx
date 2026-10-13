'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Shield,
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
  UserCheck,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  ChevronDown,
  Monitor,
  Code,
  Wifi,
  Video,
  ShieldAlert,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  HelpCircle,
  FolderKanban
} from 'lucide-react';
import { UserProfile, KANWIL_LIST, USER_ROLES, AdminUserSavePayload } from '@/types/user';
import { DailyReport } from '@/types/report';
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

const CATEGORY_ITEMS: { name: string; label: string; icon: any }[] = [
  { name: 'Semua', label: 'Semua Kategori', icon: Layers },
  { name: 'Hardware Kanwil', label: 'Hardware', icon: Monitor },
  { name: 'Software Kanwil', label: 'Software', icon: Code },
  { name: 'Network/Jaringan', label: 'Network', icon: Wifi },
  { name: 'Video Confference & Meeting', label: 'Meeting', icon: Video },
  { name: 'Malware', label: 'Malware', icon: ShieldAlert },
  { name: 'Relokasi/Renovasi', label: 'Relokasi', icon: Building2 },
  { name: 'Lainnya', label: 'Lainnya', icon: Layers },
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
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportActivePreset, setReportActivePreset] = useState<'all' | 'cycle13' | 'cycle13_next' | 'cycle21' | 'month' | 'today' | 'custom'>('all');

  // Analytics Tab Filters & Sorting
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [analyticsActivePreset, setAnalyticsActivePreset] = useState<'all' | 'cycle13' | 'cycle13_next' | 'cycle21' | 'month' | 'today' | 'custom'>('all');
  const [analyticsSelectedKanwil, setAnalyticsSelectedKanwil] = useState('Semua');
  const [analyticsSelectedCategory, setAnalyticsSelectedCategory] = useState('Semua');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixSortField, setMatrixSortField] = useState<'total' | 'name' | 'hardware' | 'software' | 'network' | 'sla'>('total');
  const [matrixSortAsc, setMatrixSortAsc] = useState(false);

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
  const [reportDateSortOrder, setReportDateSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Helper to determine the exact single Kanwil of a report without ambiguity
  const getReportKanwil = (report: DailyReport): string | null => {
    // 1. Direct userId match against registered users
    if (report.userId && userMap.has(report.userId)) {
      const owner = userMap.get(report.userId);
      if (owner?.kanwil && KANWIL_LIST.includes(owner.kanwil as any)) {
        return owner.kanwil;
      }
    }

    // 2. Exact user match by name or email
    const matchedUser = users.find(u => isReportMatchingUser(report, u));
    if (matchedUser?.kanwil && KANWIL_LIST.includes(matchedUser.kanwil as any)) {
      return matchedUser.kanwil;
    }

    // 3. Text pattern match in unitKerja and picSupport
    const text = `${report.unitKerja || ''} ${report.picSupport || ''}`.toLowerCase();

    // Check exact full Kanwil name first (e.g. 'Kanwil VIII - Jakarta 1')
    for (const k of KANWIL_LIST) {
      if (text.includes(k.toLowerCase())) return k;
    }

    // Check specific Jakarta 1 vs Jakarta 2
    if (text.includes('jakarta 2') || text.includes('jakarta ii') || text.includes('kanwil ix') || text.includes('kanwil 9')) {
      return 'Kanwil IX - Jakarta 2';
    }
    if (text.includes('jakarta 1') || text.includes('jakarta i') || text.includes('kanwil viii') || text.includes('kanwil 8')) {
      return 'Kanwil VIII - Jakarta 1';
    }

    // Check specific unique cities
    const cityToKanwil: Record<string, string> = {
      'surabaya': 'Kanwil XII - Surabaya',
      'semarang': 'Kanwil XI - Semarang',
      'bandung': 'Kanwil X - Bandung',
      'denpasar': 'Kanwil VII - Denpasar',
      'makassar': 'Kanwil VI - Makassar',
      'manado': 'Kanwil V - Manado',
      'balikpapan': 'Kanwil IV - Balikpapan',
      'palembang': 'Kanwil III - Palembang',
      'pekanbaru': 'Kanwil II - Pekanbaru',
      'medan': 'Kanwil I - Medan',
    };

    for (const [city, kVal] of Object.entries(cityToKanwil)) {
      if (text.includes(city)) return kVal;
    }

    // Exact Roman numerals in descending order with regex word boundary
    const romanPatterns: Array<[RegExp, string]> = [
      [/\bkanwil\s+(xii|12)\b/i, 'Kanwil XII - Surabaya'],
      [/\bkanwil\s+(xi|11)\b/i, 'Kanwil XI - Semarang'],
      [/\bkanwil\s+(x|10)\b/i, 'Kanwil X - Bandung'],
      [/\bkanwil\s+(ix|9)\b/i, 'Kanwil IX - Jakarta 2'],
      [/\bkanwil\s+(viii|8)\b/i, 'Kanwil VIII - Jakarta 1'],
      [/\bkanwil\s+(vii|7)\b/i, 'Kanwil VII - Denpasar'],
      [/\bkanwil\s+(vi|6)\b/i, 'Kanwil VI - Makassar'],
      [/\bkanwil\s+(v|5)\b/i, 'Kanwil V - Manado'],
      [/\bkanwil\s+(iv|4)\b/i, 'Kanwil IV - Balikpapan'],
      [/\bkanwil\s+(iii|3)\b/i, 'Kanwil III - Palembang'],
      [/\bkanwil\s+(ii|2)\b/i, 'Kanwil II - Pekanbaru'],
      [/\bkanwil\s+(i|1)\b/i, 'Kanwil I - Medan'],
    ];

    for (const [pattern, kVal] of romanPatterns) {
      if (pattern.test(text)) return kVal;
    }

    return null;
  };

  // Robust matching helper to check if a report belongs to a Kanwil
  const isReportMatchingKanwil = (report: DailyReport, kanwil: string): boolean => {
    if (kanwil === 'Semua') return true;
    const reportKanwil = getReportKanwil(report);
    return reportKanwil === kanwil;
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

  // Date Formatter Helper
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Dynamic Cycle 13 & 21 calculation for Admin
  const adminCycleData = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    const toISO = (d: Date) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Cycle 1: 13 Bulan Lalu - 12 Bulan Ini (13 [m-1] s/d 12 [m])
    const c1Start = new Date(y, m - 1, 13);
    const c1End = new Date(y, m, 12);
    const c1StartISO = toISO(c1Start);
    const c1EndISO = toISO(c1End);
    const c1Label = `13 ${monthNamesShort[c1Start.getMonth()]} - 12 ${monthNamesShort[c1End.getMonth()]}`;

    // Cycle 2: 13 Bulan Ini - 12 Bulan Depan (13 [m] s/d 12 [m+1])
    const c2Start = new Date(y, m, 13);
    const c2End = new Date(y, m + 1, 12);
    const c2StartISO = toISO(c2Start);
    const c2EndISO = toISO(c2End);
    const c2Label = `13 ${monthNamesShort[c2Start.getMonth()]} - 12 ${monthNamesShort[c2End.getMonth()]}`;

    // Cycle 21: 21 Bulan Lalu - 20 Bulan Ini (21 [m-1] s/d 20 [m])
    const c21Start = new Date(y, m - 1, 21);
    const c21End = new Date(y, m, 20);
    const c21StartISO = toISO(c21Start);
    const c21EndISO = toISO(c21End);
    const c21Label = `21 ${monthNamesShort[c21Start.getMonth()]} - 20 ${monthNamesShort[c21End.getMonth()]}`;

    // Current Month
    const mStart = new Date(y, m, 1);
    const mEnd = new Date(y, m + 1, 0);
    const mStartISO = toISO(mStart);
    const mEndISO = toISO(mEnd);

    // Counts across all reports
    const c1Count = allReports.filter((r) => r.tanggalPengerjaan >= c1StartISO && r.tanggalPengerjaan <= c1EndISO).length;
    const c2Count = allReports.filter((r) => r.tanggalPengerjaan >= c2StartISO && r.tanggalPengerjaan <= c2EndISO).length;
    const c21Count = allReports.filter((r) => r.tanggalPengerjaan >= c21StartISO && r.tanggalPengerjaan <= c21EndISO).length;
    const monthCount = allReports.filter((r) => r.tanggalPengerjaan >= mStartISO && r.tanggalPengerjaan <= mEndISO).length;

    return {
      c1StartISO,
      c1EndISO,
      c1Label,
      c1Count,
      c2StartISO,
      c2EndISO,
      c2Label,
      c2Count,
      c21StartISO,
      c21EndISO,
      c21Label,
      c21Count,
      monthCount
    };
  }, [allReports]);

  // Analytics Preset Handler
  const handleAnalyticsPreset = (type: 'all' | 'cycle13' | 'cycle13_next' | 'cycle21' | 'month' | 'today') => {
    setAnalyticsActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth();

    if (type === 'cycle13') {
      setAnalyticsStartDate(adminCycleData.c1StartISO);
      setAnalyticsEndDate(adminCycleData.c1EndISO);
    } else if (type === 'cycle13_next') {
      setAnalyticsStartDate(adminCycleData.c2StartISO);
      setAnalyticsEndDate(adminCycleData.c2EndISO);
    } else if (type === 'cycle21') {
      setAnalyticsStartDate(adminCycleData.c21StartISO);
      setAnalyticsEndDate(adminCycleData.c21EndISO);
    } else if (type === 'month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setAnalyticsStartDate(formatDateISO(start));
      setAnalyticsEndDate(formatDateISO(end));
    } else if (type === 'today') {
      const today = formatDateISO(curr);
      setAnalyticsStartDate(today);
      setAnalyticsEndDate(today);
    } else if (type === 'all') {
      setAnalyticsStartDate('');
      setAnalyticsEndDate('');
    }
  };

  // Report Tab Preset Handler
  const handleReportPreset = (type: 'all' | 'cycle13' | 'cycle13_next' | 'cycle21' | 'month' | 'today') => {
    setReportActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth();

    if (type === 'cycle13') {
      setReportStartDate(adminCycleData.c1StartISO);
      setReportEndDate(adminCycleData.c1EndISO);
      setReportDateFilter('');
    } else if (type === 'cycle13_next') {
      setReportStartDate(adminCycleData.c2StartISO);
      setReportEndDate(adminCycleData.c2EndISO);
      setReportDateFilter('');
    } else if (type === 'cycle21') {
      setReportStartDate(adminCycleData.c21StartISO);
      setReportEndDate(adminCycleData.c21EndISO);
      setReportDateFilter('');
    } else if (type === 'month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setReportStartDate(formatDateISO(start));
      setReportEndDate(formatDateISO(end));
      setReportDateFilter('');
    } else if (type === 'today') {
      const today = formatDateISO(curr);
      setReportStartDate(today);
      setReportEndDate(today);
      setReportDateFilter(today);
    } else if (type === 'all') {
      setReportStartDate('');
      setReportEndDate('');
      setReportDateFilter('');
    }
  };

  // Quick Drill-Down from Analytics Matrix to Tab 2
  const handleDrillDownFromAnalytics = (kanwil: string, category: string = 'Semua') => {
    setSelectedReportKanwil(kanwil);
    setSelectedReportCategory(category);
    setSelectedReportUser('Semua');
    setReportStartDate(analyticsStartDate);
    setReportEndDate(analyticsEndDate);
    setReportActivePreset(analyticsActivePreset);
    setReportDateFilter('');
    setSearchReportQuery('');
    setActiveTab('reports');
  };

  // --- Calculations for Analytics Tab ---
  // Analytics Filtered Dataset
  const analyticsFilteredReports = useMemo(() => {
    return allReports.filter((item) => {
      // Date filter
      if (analyticsStartDate && analyticsEndDate) {
        if (item.tanggalPengerjaan < analyticsStartDate || item.tanggalPengerjaan > analyticsEndDate) return false;
      } else if (analyticsStartDate) {
        if (item.tanggalPengerjaan < analyticsStartDate) return false;
      } else if (analyticsEndDate) {
        if (item.tanggalPengerjaan > analyticsEndDate) return false;
      }

      // Kanwil filter
      if (analyticsSelectedKanwil !== 'Semua') {
        if (!isReportMatchingKanwil(item, analyticsSelectedKanwil)) return false;
      }

      // Category filter
      if (analyticsSelectedCategory !== 'Semua') {
        if (item.category !== analyticsSelectedCategory) return false;
      }

      return true;
    });
  }, [allReports, analyticsStartDate, analyticsEndDate, analyticsSelectedKanwil, analyticsSelectedCategory, users, userMap]);

  // Comprehensive Kanwil x Category Matrix (100% Synchronized with Database)
  const kanwilCategoryMatrix = useMemo(() => {
    // Pre-bucket reports by Kanwil
    const reportsByKanwil: Record<string, DailyReport[]> = {};
    KANWIL_LIST.forEach((k) => {
      reportsByKanwil[k] = [];
    });
    const unassignedReports: DailyReport[] = [];

    analyticsFilteredReports.forEach((r) => {
      const k = getReportKanwil(r);
      if (k && reportsByKanwil[k]) {
        reportsByKanwil[k].push(r);
      } else {
        unassignedReports.push(r);
      }
    });

    const list: Array<{
      kanwilName: string;
      officersCount: number;
      total: number;
      hardwareCount: number;
      softwareCount: number;
      networkCount: number;
      meetingCount: number;
      malwareCount: number;
      relokasiCount: number;
      lainnyaCount: number;
      avgMinutes: number;
      avgSlaStr: string;
      pctOfNational: number;
    }> = KANWIL_LIST.map((kanwilName) => {
      const kanwilReports = reportsByKanwil[kanwilName] || [];
      const total = kanwilReports.length;

      const hardwareCount = kanwilReports.filter((r) => r.category === 'Hardware Kanwil').length;
      const softwareCount = kanwilReports.filter((r) => r.category === 'Software Kanwil').length;
      const networkCount = kanwilReports.filter((r) => r.category === 'Network/Jaringan').length;
      const meetingCount = kanwilReports.filter((r) => r.category === 'Video Confference & Meeting').length;
      const malwareCount = kanwilReports.filter((r) => r.category === 'Malware').length;
      const relokasiCount = kanwilReports.filter((r) => r.category === 'Relokasi/Renovasi').length;
      const lainnyaCount = kanwilReports.filter((r) => r.category === 'Lainnya').length;

      const officers = users.filter((u) => u.kanwil === kanwilName && u.role !== 'Admin' && u.role !== 'Super Admin');

      let totalMinutes = 0;
      let validSLACount = 0;
      kanwilReports.forEach((r) => {
        if (r.waktuMulai && r.waktuSelesai) {
          const [sh, sm] = r.waktuMulai.split(':').map(Number);
          const [eh, em] = r.waktuSelesai.split(':').map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 1440;
          totalMinutes += diff;
          validSLACount++;
        }
      });
      const avgMinutes = validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgRemMins = avgMinutes % 60;
      const avgSlaStr = `${avgHours}:${avgRemMins.toString().padStart(2, '0')}:00`;
      const nationalTotal = analyticsFilteredReports.length;
      const pctOfNational = nationalTotal > 0 ? Math.round((total / nationalTotal) * 100) : 0;

      return {
        kanwilName,
        officersCount: officers.length,
        total,
        hardwareCount,
        softwareCount,
        networkCount,
        meetingCount,
        malwareCount,
        relokasiCount,
        lainnyaCount,
        avgMinutes,
        avgSlaStr,
        pctOfNational
      };
    });

    if (unassignedReports.length > 0) {
      const total = unassignedReports.length;
      const hardwareCount = unassignedReports.filter((r) => r.category === 'Hardware Kanwil').length;
      const softwareCount = unassignedReports.filter((r) => r.category === 'Software Kanwil').length;
      const networkCount = unassignedReports.filter((r) => r.category === 'Network/Jaringan').length;
      const meetingCount = unassignedReports.filter((r) => r.category === 'Video Confference & Meeting').length;
      const malwareCount = unassignedReports.filter((r) => r.category === 'Malware').length;
      const relokasiCount = unassignedReports.filter((r) => r.category === 'Relokasi/Renovasi').length;
      const lainnyaCount = unassignedReports.filter((r) => r.category === 'Lainnya').length;

      let totalMinutes = 0;
      let validSLACount = 0;
      unassignedReports.forEach((r) => {
        if (r.waktuMulai && r.waktuSelesai) {
          const [sh, sm] = r.waktuMulai.split(':').map(Number);
          const [eh, em] = r.waktuSelesai.split(':').map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 1440;
          totalMinutes += diff;
          validSLACount++;
        }
      });
      const avgMinutes = validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgRemMins = avgMinutes % 60;
      const avgSlaStr = `${avgHours}:${avgRemMins.toString().padStart(2, '0')}:00`;
      const nationalTotal = analyticsFilteredReports.length;
      const pctOfNational = nationalTotal > 0 ? Math.round((total / nationalTotal) * 100) : 0;

      list.push({
        kanwilName: 'Kantor Pusat / Lainnya',
        officersCount: users.filter(u => !KANWIL_LIST.includes(u.kanwil as any) && u.role !== 'Admin' && u.role !== 'Super Admin').length,
        total,
        hardwareCount,
        softwareCount,
        networkCount,
        meetingCount,
        malwareCount,
        relokasiCount,
        lainnyaCount,
        avgMinutes,
        avgSlaStr,
        pctOfNational
      });
    }

    return list;
  }, [analyticsFilteredReports, users, userMap]);

  // Matrix Filtered & Sorted
  const filteredAndSortedMatrix = useMemo(() => {
    let result = kanwilCategoryMatrix;
    if (matrixSearchQuery.trim()) {
      const q = matrixSearchQuery.toLowerCase().trim();
      result = result.filter(item => item.kanwilName.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (matrixSortField === 'total') {
        valA = a.total;
        valB = b.total;
      } else if (matrixSortField === 'hardware') {
        valA = a.hardwareCount;
        valB = b.hardwareCount;
      } else if (matrixSortField === 'software') {
        valA = a.softwareCount;
        valB = b.softwareCount;
      } else if (matrixSortField === 'network') {
        valA = a.networkCount;
        valB = b.networkCount;
      } else if (matrixSortField === 'sla') {
        valA = a.avgMinutes;
        valB = b.avgMinutes;
      } else if (matrixSortField === 'name') {
        valA = a.kanwilName;
        valB = b.kanwilName;
        return matrixSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return matrixSortAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });

    return result;
  }, [kanwilCategoryMatrix, matrixSearchQuery, matrixSortField, matrixSortAsc]);

  // Matrix Totals Summary
  const matrixSummary = useMemo(() => {
    return kanwilCategoryMatrix.reduce(
      (acc, item) => ({
        total: acc.total + item.total,
        hardwareCount: acc.hardwareCount + item.hardwareCount,
        softwareCount: acc.softwareCount + item.softwareCount,
        networkCount: acc.networkCount + item.networkCount,
        meetingCount: acc.meetingCount + item.meetingCount,
        malwareCount: acc.malwareCount + item.malwareCount,
        relokasiCount: acc.relokasiCount + item.relokasiCount,
        lainnyaCount: acc.lainnyaCount + item.lainnyaCount,
        officersCount: acc.officersCount + item.officersCount
      }),
      {
        total: 0,
        hardwareCount: 0,
        softwareCount: 0,
        networkCount: 0,
        meetingCount: 0,
        malwareCount: 0,
        relokasiCount: 0,
        lainnyaCount: 0,
        officersCount: 0
      }
    );
  }, [kanwilCategoryMatrix]);

  // Analytics Top Category
  const topCategorySummary = useMemo(() => {
    const cats = CATEGORY_ITEMS.filter(c => c.name !== 'Semua').map(c => ({
      name: c.name,
      label: c.label,
      count: analyticsFilteredReports.filter(r => r.category === c.name).length
    })).sort((a, b) => b.count - a.count);
    return cats[0] || { name: '-', label: '-', count: 0 };
  }, [analyticsFilteredReports]);

  // Analytics Top Kanwil
  const topKanwilSummary = useMemo(() => {
    const sorted = [...kanwilCategoryMatrix].sort((a, b) => b.total - a.total);
    return sorted[0] || { kanwilName: '-', total: 0 };
  }, [kanwilCategoryMatrix]);

  // Analytics Overall SLA
  const analyticsOverallSla = useMemo(() => {
    let totalMins = 0;
    let count = 0;
    analyticsFilteredReports.forEach(r => {
      if (r.waktuMulai && r.waktuSelesai) {
        const [sh, sm] = r.waktuMulai.split(':').map(Number);
        const [eh, em] = r.waktuSelesai.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 1440;
        totalMins += diff;
        count++;
      }
    });
    const avg = count > 0 ? Math.round(totalMins / count) : 0;
    const h = Math.floor(avg / 60);
    const m = avg % 60;
    return {
      avgMinutes: avg,
      formatted: `${h}:${m.toString().padStart(2, '0')}:00`
    };
  }, [analyticsFilteredReports]);

  // Analytics Method Breakdown
  const analyticsMethodSummary = useMemo(() => {
    const total = analyticsFilteredReports.length;
    const visitCount = analyticsFilteredReports.filter(r => r.metodePenanganan === 'Visit').length;
    const remoteCount = analyticsFilteredReports.filter(r => r.metodePenanganan === 'Remote').length;
    const guideCount = analyticsFilteredReports.filter(r => r.metodePenanganan === 'Guide' || !r.metodePenanganan).length;

    const visitPct = total > 0 ? Math.round((visitCount / total) * 100) : 0;
    const remotePct = total > 0 ? Math.round((remoteCount / total) * 100) : 0;
    const guidePct = total > 0 ? Math.round((guideCount / total) * 100) : 0;

    let dominantMethod = 'Remote';
    let dominantCount = remoteCount;
    let dominantPct = remotePct;

    if (visitCount >= remoteCount && visitCount >= guideCount) {
      dominantMethod = 'Visit';
      dominantCount = visitCount;
      dominantPct = visitPct;
    } else if (guideCount >= remoteCount && guideCount >= visitCount) {
      dominantMethod = 'Guide';
      dominantCount = guideCount;
      dominantPct = guidePct;
    }

    return {
      visitCount,
      visitPct,
      remoteCount,
      remotePct,
      guideCount,
      guidePct,
      dominantMethod,
      dominantCount,
      dominantPct
    };
  }, [analyticsFilteredReports]);

  // Analytics Top Officer IT Support
  const analyticsTopOfficer = useMemo(() => {
    const supportUsers = users.filter(u => u.role !== 'Admin' && u.role !== 'Super Admin');
    const officerCounts = supportUsers.map(u => ({
      name: u.displayName || u.email,
      kanwil: u.kanwil || 'Kanwil',
      count: analyticsFilteredReports.filter(r => isReportMatchingUser(r, u)).length
    })).sort((a, b) => b.count - a.count);

    return officerCounts[0] || { name: '-', kanwil: '-', count: 0 };
  }, [users, analyticsFilteredReports, userMap]);

  // Analytics Top Unit Kerja / Cabang
  const analyticsTopUnitKerja = useMemo(() => {
    const unitMap: Record<string, number> = {};
    analyticsFilteredReports.forEach(r => {
      const u = (r.unitKerja || '').trim();
      if (u) {
        unitMap[u] = (unitMap[u] || 0) + 1;
      }
    });

    const entries = Object.entries(unitMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return entries[0] || { name: '-', count: 0 };
  }, [analyticsFilteredReports]);

  // --- Calculations for Reports Tab ---
  // 1. Base filtered reports (Search + User + Kanwil + Date Range) BEFORE category pill filter
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

      let matchDate = true;
      if (reportStartDate && reportEndDate) {
        matchDate = item.tanggalPengerjaan >= reportStartDate && item.tanggalPengerjaan <= reportEndDate;
      } else if (reportStartDate) {
        matchDate = item.tanggalPengerjaan >= reportStartDate;
      } else if (reportEndDate) {
        matchDate = item.tanggalPengerjaan <= reportEndDate;
      } else if (reportDateFilter) {
        matchDate = item.tanggalPengerjaan === reportDateFilter;
      }

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
    reportStartDate,
    reportEndDate,
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

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const dateComparison = a.tanggalPengerjaan.localeCompare(b.tanggalPengerjaan);
      return reportDateSortOrder === 'asc' ? dateComparison : -dateComparison;
    });
  }, [filteredReports, reportDateSortOrder]);

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
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

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
    const visitCount = sourceReports.filter(r => r.metodePenanganan === 'Visit').length;
    const remoteCount = sourceReports.filter(r => r.metodePenanganan === 'Remote').length;
    const guideCount = sourceReports.filter(r => r.metodePenanganan === 'Guide' || !r.metodePenanganan).length;

    return {
      total,
      todayCount: todayReports.length,
      avgSlaFormatted,
      avgMinutes,
      activePicCount: uniquePics.size,
      visitCount,
      remoteCount,
      guideCount
    };
  }, [baseFilteredReports]);

  // Pagination for Reports
  const totalReportItems = filteredReports.length;
  const totalReportPages = Math.max(1, Math.ceil(totalReportItems / reportItemsPerPage));
  const startReportIndex = (reportCurrentPage - 1) * reportItemsPerPage;
  const endReportIndex = Math.min(startReportIndex + reportItemsPerPage, totalReportItems);
  const paginatedReports = sortedReports.slice(startReportIndex, endReportIndex);

  useEffect(() => {
    setReportCurrentPage(1);
  }, [searchReportQuery, selectedReportCategory, reportDateFilter, selectedReportUser, selectedReportKanwil, reportItemsPerPage, reportDateSortOrder]);

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
                Kelola hak akses personil, monitoring seluruh laporan IT Support se-Indonesia, dan evaluasi kepatuhan SLA.
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* Card 1: Total Laporan */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  {selectedReportUser !== 'Semua' ? 'Laporan Petugas' : 'Total Laporan'}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">{reportStats.total}</h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5 truncate">
                  {selectedReportUser !== 'Semua' ? selectedReportUser : 'Semua Petugas'}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0 ml-1">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 2: Laporan Hari Ini */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Hari Ini</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">{reportStats.todayCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">Laporan aktif</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 ml-1">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 3: Rata-Rata SLA */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Rata-Rata SLA</p>
                <h3 className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5 sm:mt-1 font-mono">{reportStats.avgSlaFormatted}</h3>
                <p className="text-[10px] sm:text-[11px] text-teal-600 font-bold mt-0.5 truncate">Kecepatan Respons</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0 ml-1">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 4: Petugas Terlibat */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Petugas</p>
                <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1">{reportStats.activePicCount}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">PIC IT Support</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0 ml-1">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 5: Metode Penanganan */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Metode</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-extrabold text-blue-700">V:{reportStats.visitCount}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-extrabold text-purple-700">R:{reportStats.remoteCount}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-extrabold text-amber-700">G:{reportStats.guideCount}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">Visit / Remote / Guide</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0 ml-1">
                <Laptop className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 6: Siklus Cut-Off 13 */}
            <div className="bg-white p-3 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Cut-Off 13
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1 pt-1 border-t border-emerald-100 text-center">
                <button
                  type="button"
                  onClick={() => handleReportPreset('cycle13')}
                  className="p-0.5 rounded hover:bg-emerald-100/60 transition-all cursor-pointer text-left"
                >
                  <p className="text-[8px] font-bold text-emerald-700 leading-tight">13 Lalu</p>
                  <p className="text-xs font-black text-emerald-900">{adminCycleData.c1Count}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset('cycle13_next')}
                  className="p-0.5 rounded hover:bg-teal-100/60 transition-all cursor-pointer border-l border-emerald-200/60 pl-1 text-left"
                >
                  <p className="text-[8px] font-bold text-teal-700 leading-tight">13 Ini</p>
                  <p className="text-xs font-black text-teal-900">{adminCycleData.c2Count}</p>
                </button>
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

                {/* Reset Filter */}
                {(searchReportQuery || reportDateFilter || reportStartDate || reportEndDate || reportActivePreset !== 'all' || selectedReportCategory !== 'Semua' || selectedReportUser !== 'Semua' || selectedReportKanwil !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchReportQuery('');
                      setReportDateFilter('');
                      setReportStartDate('');
                      setReportEndDate('');
                      setReportActivePreset('all');
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

              {/* Row 2: Cut-off Cycle & Date Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Periode:</span>
                <button
                  type="button"
                  onClick={() => handleReportPreset('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === 'all' && !reportDateFilter
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  Semua Data
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset('cycle13')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === 'cycle13'
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span>13 Lalu - 12 Ini</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">({adminCycleData.c1Label})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset('cycle13_next')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === 'cycle13_next'
                      ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-400/30'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  <span>13 Ini - 12 Depan</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">({adminCycleData.c2Label})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset('cycle21')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === 'cycle21'
                      ? 'bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  <span>Siklus 21</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">({adminCycleData.c21Label})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset('month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === 'month'
                      ? 'bg-purple-700 text-white shadow-xs ring-2 ring-purple-400/30'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  Bulan Ini
                </button>

                {/* Single Date Picker Button */}
                <div className="relative flex items-center shrink-0">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${reportDateFilter
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 ${reportDateFilter ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{reportDateFilter ? formatDateFormatted(reportDateFilter) : 'Pilih Tanggal'}</span>
                    {reportDateFilter && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReportDateFilter('');
                          setReportActivePreset('all');
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
                    onChange={(e) => {
                      setReportDateFilter(e.target.value);
                      setReportStartDate(e.target.value);
                      setReportEndDate(e.target.value);
                      setReportActivePreset('custom');
                    }}
                    className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                  />
                </div>
              </div>

              {/* Row 3: Category Pills (Synchronized real-time with active User/Kanwil/Date) */}
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
                    <th
                      aria-sort={reportDateSortOrder === 'asc' ? 'ascending' : 'descending'}
                      className="py-3.5 px-3 min-w-[100px] border-r border-slate-700/60"
                    >
                      <button
                        type="button"
                        onClick={() => setReportDateSortOrder((order) => order === 'asc' ? 'desc' : 'asc')}
                        aria-label={`Urutkan tanggal ${reportDateSortOrder === 'asc' ? 'menurun' : 'menaik'}`}
                        title={`Urutkan tanggal ${reportDateSortOrder === 'asc' ? 'menurun' : 'menaik'}`}
                        className="inline-flex items-center gap-1.5"
                      >
                        Tanggal
                        {reportDateSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">PIC Support</th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">Unit Kerja</th>
                    <th className="py-3.5 px-4 min-w-[120px] border-r border-slate-700/60">Nama User</th>
                    {selectedReportCategory === 'Semua' && (
                      <th className="py-3.5 px-3 min-w-[135px] border-r border-slate-700/60 text-center">Kategori</th>
                    )}
                    <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-700/60">Deskripsi Permohonan</th>
                    <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">Metode</th>
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
                      <td colSpan={selectedReportCategory === 'Semua' ? 14 : 13} className="py-16 text-center text-slate-500">
                        <RefreshCw className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                        <p className="font-bold text-xs">Memuat data seluruh laporan IT...</p>
                      </td>
                    </tr>
                  ) : paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan={selectedReportCategory === 'Semua' ? 14 : 13} className="py-16 text-center text-slate-500">
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
                          {selectedReportCategory === 'Semua' && (
                            <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {item.category}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-slate-700 border-r border-slate-100">
                            <p className="line-clamp-2 leading-relaxed">{item.deskripsiPermohonan}</p>
                          </td>
                          <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                              item.metodePenanganan === 'Visit'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : item.metodePenanganan === 'Remote'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.metodePenanganan || 'Guide'}
                            </span>
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
      {/* TAB 3: STATISTIK & MONITORING SELURUH KANWIL              */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Filter & Period Selection Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pegadaian-700 to-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Executive Monitoring & Analisis Kategori Kanwil
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      12 Kanwil
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Filter periode cut-off & periksa sebaran pengerjaan tiket per kategori di setiap Kantor Wilayah
                  </p>
                </div>
              </div>

              {/* Reset analytics button */}
              {(analyticsActivePreset !== 'all' || analyticsStartDate || analyticsEndDate || analyticsSelectedKanwil !== 'Semua' || analyticsSelectedCategory !== 'Semua') && (
                <button
                  type="button"
                  onClick={() => {
                    handleAnalyticsPreset('all');
                    setAnalyticsSelectedKanwil('Semua');
                    setAnalyticsSelectedCategory('Semua');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer self-start md:self-auto flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter Periode</span>
                </button>
              )}
            </div>

            {/* Presets Button Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Presets:
              </span>

              {/* Preset: Semua Data */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === 'all' && !analyticsStartDate && !analyticsEndDate
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                Semua Data ({allReports.length})
              </button>

              {/* Preset: 13 Lalu - 12 Ini */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset('cycle13')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsActivePreset === 'cycle13'
                    ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>13 Lalu - 12 Ini</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === 'cycle13' ? 'bg-white/20 text-white' : 'bg-emerald-200/70 text-emerald-900'}`}>
                  {adminCycleData.c1Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal">({adminCycleData.c1Label})</span>
              </button>

              {/* Preset: 13 Ini - 12 Depan */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset('cycle13_next')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsActivePreset === 'cycle13_next'
                    ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-400/30'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>13 Ini - 12 Depan</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === 'cycle13_next' ? 'bg-white/20 text-white' : 'bg-teal-200/70 text-teal-900'}`}>
                  {adminCycleData.c2Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal">({adminCycleData.c2Label})</span>
              </button>

              {/* Preset: Siklus 21 */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset('cycle21')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === 'cycle21'
                    ? 'bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400/30'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                <span>Siklus 21</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === 'cycle21' ? 'bg-white/20 text-white' : 'bg-indigo-200/70 text-indigo-900'}`}>
                  {adminCycleData.c21Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal ml-1">({adminCycleData.c21Label})</span>
              </button>

              {/* Preset: Bulan Ini */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset('month')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === 'month'
                    ? 'bg-purple-700 text-white shadow-xs ring-2 ring-purple-400/30'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                <span>Bulan Kalender Ini</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === 'month' ? 'bg-white/20 text-white' : 'bg-purple-200/70 text-purple-900'}`}>
                  {adminCycleData.monthCount}
                </span>
              </button>
            </div>

            {/* Secondary Filter Row: Custom Date Pickers & Scope Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Custom Date Range */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 pl-2">Dari:</span>
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => {
                    setAnalyticsStartDate(e.target.value);
                    setAnalyticsActivePreset('custom');
                  }}
                  className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-bold text-slate-500">s/d</span>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => {
                    setAnalyticsEndDate(e.target.value);
                    setAnalyticsActivePreset('custom');
                  }}
                  className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {(analyticsStartDate || analyticsEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnalyticsStartDate('');
                      setAnalyticsEndDate('');
                      setAnalyticsActivePreset('all');
                    }}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
                    title="Hapus filter rentang"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Kanwil Dropdown */}
              <select
                value={analyticsSelectedKanwil}
                onChange={(e) => setAnalyticsSelectedKanwil(e.target.value)}
                className={`px-3 py-1.5 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${
                  analyticsSelectedKanwil !== 'Semua'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="Semua">Semua Kantor Wilayah (12)</option>
                {KANWIL_LIST.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              {/* Filter Kategori Dropdown */}
              <select
                value={analyticsSelectedCategory}
                onChange={(e) => setAnalyticsSelectedCategory(e.target.value)}
                className={`px-3 py-1.5 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${
                  analyticsSelectedCategory !== 'Semua'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="Semua">Semua Kategori Pekerjaan</option>
                {CATEGORY_ITEMS.filter(c => c.name !== 'Semua').map((c) => (
                  <option key={c.name} value={c.name}>{c.label}</option>
                ))}
              </select>

              <div className="ml-auto text-xs text-slate-500 font-semibold">
                Terfilter: <strong className="text-emerald-700 font-black">{analyticsFilteredReports.length}</strong> dari {allReports.length} Laporan
              </div>
            </div>
          </div>

          {/* 8 Executive KPI Command Center Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Laporan Periode Terpilih */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Laporan</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{analyticsFilteredReports.length}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold truncate mt-0.5">
                  {analyticsActivePreset === 'cycle13'
                    ? 'Siklus 13 Lalu'
                    : analyticsActivePreset === 'cycle13_next'
                    ? 'Siklus 13 Ini'
                    : analyticsActivePreset === 'cycle21'
                    ? 'Siklus 21'
                    : analyticsActivePreset === 'month'
                    ? 'Bulan Ini'
                    : analyticsStartDate
                    ? 'Custom Range'
                    : 'Seluruh Riwayat'}
                </p>
              </div>
            </div>

            {/* Card 2: Siklus Cut-Off 13 (Dual Sub-boxes) */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Siklus 13 Cut-Off
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => handleAnalyticsPreset('cycle13')}
                  className="text-left p-1 rounded-lg hover:bg-emerald-100/60 transition-all cursor-pointer"
                >
                  <p className="text-[9px] font-bold text-emerald-700 leading-tight">13 Lalu-12 Ini</p>
                  <p className="text-base sm:text-lg font-black text-emerald-900">{adminCycleData.c1Count}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnalyticsPreset('cycle13_next')}
                  className="text-left p-1 rounded-lg hover:bg-teal-100/60 transition-all cursor-pointer border-l border-emerald-200/60 pl-2"
                >
                  <p className="text-[9px] font-bold text-teal-700 leading-tight">13 Ini-12 Dpn</p>
                  <p className="text-base sm:text-lg font-black text-teal-900">{adminCycleData.c2Count}</p>
                </button>
              </div>
            </div>

            {/* Card 3: Kategori Dominan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori Terbanyak</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 truncate" title={topCategorySummary.name}>
                  {topCategorySummary.label}
                </h3>
                <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                  {topCategorySummary.count} Laporan ({analyticsFilteredReports.length > 0 ? Math.round((topCategorySummary.count / analyticsFilteredReports.length) * 100) : 0}%)
                </p>
              </div>
            </div>

            {/* Card 4: Kanwil Teraktif */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Kanwil Teraktif</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black text-purple-900 truncate" title={topKanwilSummary.kanwilName}>
                  {topKanwilSummary.kanwilName}
                </h3>
                <p className="text-[11px] text-purple-600 font-bold mt-0.5">
                  {topKanwilSummary.total} Laporan ({analyticsFilteredReports.length > 0 ? Math.round((topKanwilSummary.total / analyticsFilteredReports.length) * 100) : 0}% Nasional)
                </p>
              </div>
            </div>

            {/* Card 5: SLA Rata-rata Nasional */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata SLA</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
                  {analyticsOverallSla.formatted}
                </h3>
                <p className="text-[11px] text-teal-600 font-bold mt-0.5">
                  {analyticsOverallSla.avgMinutes <= 15 ? '⚡ Kinerja Sangat Cepat' : 'Resolusi Terjaga'}
                </p>
              </div>
            </div>

            {/* Card 6: Metode Penanganan Dominan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Penanganan</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {analyticsMethodSummary.dominantMethod} ({analyticsMethodSummary.dominantPct}%)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-500">
                  <span className="text-blue-700">Visit {analyticsMethodSummary.visitCount}</span>
                  <span>•</span>
                  <span className="text-purple-700">Remote {analyticsMethodSummary.remoteCount}</span>
                  <span>•</span>
                  <span className="text-amber-700">Guide {analyticsMethodSummary.guideCount}</span>
                </div>
              </div>
            </div>

            {/* Card 7: Top Officer IT Support */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Top Petugas IT</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800 truncate" title={analyticsTopOfficer.name}>
                  {analyticsTopOfficer.name}
                </h3>
                <p className="text-[11px] text-amber-700 font-bold mt-0.5 truncate">
                  {analyticsTopOfficer.count} Laporan ({analyticsTopOfficer.kanwil})
                </p>
              </div>
            </div>

            {/* Card 8: Top Unit Kerja / Cabang Terbanyak */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Kerja Terbanyak</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800 truncate" title={analyticsTopUnitKerja.name}>
                  {analyticsTopUnitKerja.name}
                </h3>
                <p className="text-[11px] text-rose-700 font-bold mt-0.5 truncate">
                  {analyticsTopUnitKerja.count} Tiket Dilayani
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MATRIKS MONITORING PENGERJAAN SELURUH KANWIL PER KATEGORI */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Matrix Header & Tools */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pegadaian-700" />
                  Matriks Monitoring Pengerjaan Seluruh Kanwil per Kategori
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Klik pada angka kategori atau kanwil untuk langsung melihat daftar laporan detail di Tab Laporan.
                </p>
              </div>

              {/* Search & Sort Matrix */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kanwil..."
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={matrixSortField}
                  onChange={(e) => setMatrixSortField(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="total">Urutkan: Total Laporan</option>
                  <option value="hardware">Urutkan: Hardware</option>
                  <option value="software">Urutkan: Software</option>
                  <option value="network">Urutkan: Network</option>
                  <option value="sla">Urutkan: Kecepatan SLA</option>
                  <option value="name">Urutkan: Nama Kanwil</option>
                </select>

                <button
                  type="button"
                  onClick={() => setMatrixSortAsc(!matrixSortAsc)}
                  className="p-1.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-all cursor-pointer"
                  title={matrixSortAsc ? 'Urutan Naik (Ascending)' : 'Urutan Turun (Descending)'}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs align-middle border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white uppercase text-[10px] font-extrabold tracking-wider border-b-2 border-emerald-500/60">
                    <th className="py-3 px-3 w-10 text-center border-r border-slate-700/60">No</th>
                    <th className="py-3 px-4 min-w-[170px] border-r border-slate-700/60">Kantor Wilayah</th>
                    <th className="py-3 px-2 w-14 text-center border-r border-slate-700/60" title="Petugas IT Terdaftar">PIC</th>
                    <th className="py-3 px-3 min-w-[90px] text-center border-r border-slate-700/60 bg-emerald-950/60 text-emerald-300">
                      Total Laporan
                    </th>
                    <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">Hardware</th>
                    <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">Software</th>
                    <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">Network</th>
                    <th className="py-3 px-2.5 min-w-[90px] text-center border-r border-slate-700/60">Meeting/VC</th>
                    <th className="py-3 px-2.5 min-w-[80px] text-center border-r border-slate-700/60">Malware</th>
                    <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">Relokasi</th>
                    <th className="py-3 px-2.5 min-w-[75px] text-center border-r border-slate-700/60">Lainnya</th>
                    <th className="py-3 px-3 min-w-[85px] text-center border-r border-slate-700/60">Avg SLA</th>
                    <th className="py-3 px-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAndSortedMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400">
                        Tidak ada kanwil yang cocok dengan pencarian
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedMatrix.map((item, idx) => {
                      const isTopVolume = idx === 0 && matrixSortField === 'total' && !matrixSortAsc;
                      return (
                        <tr
                          key={item.kanwilName}
                          className={`transition-colors hover:bg-slate-50/80 ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold">{item.kanwilName}</span>
                              {isTopVolume && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                  Top 1
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center border-r border-slate-100">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                              {item.officersCount}
                            </span>
                          </td>

                          {/* Total Laporan Column (Clickable to Drill Down All) */}
                          <td className="py-3 px-3 text-center border-r border-slate-100 bg-emerald-50/30">
                            <button
                              type="button"
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Semua')}
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                item.total > 0
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:scale-105'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                              title={`Buka semua ${item.total} laporan dari ${item.kanwilName}`}
                            >
                              {item.total}
                            </button>
                          </td>

                          {/* Hardware Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.hardwareCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Hardware Kanwil')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.hardwareCount > 0
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.hardwareCount} Laporan Hardware - Klik untuk filter`}
                            >
                              {item.hardwareCount}
                            </button>
                          </td>

                          {/* Software Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.softwareCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Software Kanwil')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.softwareCount > 0
                                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.softwareCount} Laporan Software - Klik untuk filter`}
                            >
                              {item.softwareCount}
                            </button>
                          </td>

                          {/* Network Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.networkCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Network/Jaringan')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.networkCount > 0
                                  ? 'bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.networkCount} Laporan Jaringan - Klik untuk filter`}
                            >
                              {item.networkCount}
                            </button>
                          </td>

                          {/* Meeting & VC Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.meetingCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Video Confference & Meeting')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.meetingCount > 0
                                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.meetingCount} Laporan Video Conf - Klik untuk filter`}
                            >
                              {item.meetingCount}
                            </button>
                          </td>

                          {/* Malware Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.malwareCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Malware')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.malwareCount > 0
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.malwareCount} Laporan Malware - Klik untuk filter`}
                            >
                              {item.malwareCount}
                            </button>
                          </td>

                          {/* Relokasi Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.relokasiCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Relokasi/Renovasi')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.relokasiCount > 0
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.relokasiCount} Laporan Relokasi - Klik untuk filter`}
                            >
                              {item.relokasiCount}
                            </button>
                          </td>

                          {/* Lainnya Column */}
                          <td className="py-3 px-2.5 text-center border-r border-slate-100">
                            <button
                              type="button"
                              disabled={item.lainnyaCount === 0}
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Lainnya')}
                              className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                item.lainnyaCount > 0
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white border border-slate-200 cursor-pointer'
                                  : 'text-slate-300 font-normal cursor-default'
                              }`}
                              title={`${item.lainnyaCount} Laporan Lainnya - Klik untuk filter`}
                            >
                              {item.lainnyaCount}
                            </button>
                          </td>

                          {/* SLA Column */}
                          <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-bold">
                            {item.total > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                                item.avgMinutes <= 15
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : item.avgMinutes <= 30
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {item.avgSlaStr}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* Action Drill Down Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDrillDownFromAnalytics(item.kanwilName, 'Semua')}
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer inline-flex items-center justify-center"
                              title={`Buka Laporan ${item.kanwilName}`}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Matrix Total Footer */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-emerald-500">
                    <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-emerald-400">
                      Total Nasional :
                    </td>
                    <td className="py-3.5 px-2 text-center text-purple-300">
                      {matrixSummary.officersCount}
                    </td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 text-sm">
                      {matrixSummary.total}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-blue-300">
                      {matrixSummary.hardwareCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-indigo-300">
                      {matrixSummary.softwareCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-teal-300">
                      {matrixSummary.networkCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-purple-300">
                      {matrixSummary.meetingCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-rose-300">
                      {matrixSummary.malwareCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-amber-300">
                      {matrixSummary.relokasiCount}
                    </td>
                    <td className="py-3.5 px-2.5 text-center text-slate-300">
                      {matrixSummary.lainnyaCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-teal-300">
                      {analyticsOverallSla.formatted}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDrillDownFromAnalytics('Semua', 'Semua')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        title="Lihat Semua di Tab Laporan"
                      >
                        Semua
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed Visual Analytics Breakdown */}
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
                  const count = analyticsFilteredReports.filter(r => r.category === cat.name).length;
                  const pct = analyticsFilteredReports.length > 0 ? Math.round((count / analyticsFilteredReports.length) * 100) : 0;
                  return (
                    <div
                      key={cat.name}
                      onClick={() => handleDrillDownFromAnalytics(analyticsSelectedKanwil, cat.name)}
                      className="space-y-1 p-1.5 -mx-1.5 rounded-xl hover:bg-emerald-50/50 cursor-pointer transition-all"
                      title={`Klik untuk filter laporan kategori ${cat.label}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          {cat.label}
                        </span>
                        <span className="font-mono text-slate-500 font-semibold">{count} ({pct}%)</span>
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
                    {analyticsFilteredReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff <= 5;
                    }).length} Laporan
                  </span>
                </div>

                <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-teal-900">Standar (5 - 15 Menit)</span>
                    <p className="text-[11px] text-teal-700">Penanganan software / konfigurasi</p>
                  </div>
                  <span className="text-base font-black text-teal-800">
                    {analyticsFilteredReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff > 5 && diff <= 15;
                    }).length} Laporan
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-amber-900">Kompleks (&gt; 15 Menit)</span>
                    <p className="text-[11px] text-amber-700">Hardware / Relokasi / Jaringan</p>
                  </div>
                  <span className="text-base font-black text-amber-800">
                    {analyticsFilteredReports.filter(r => {
                      if (!r.waktuMulai || !r.waktuSelesai) return false;
                      const [sh, sm] = r.waktuMulai.split(':').map(Number);
                      const [eh, em] = r.waktuSelesai.split(':').map(Number);
                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                      if (diff < 0) diff += 1440;
                      return diff > 15;
                    }).length} Laporan
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
                  <p className="text-[11px] text-slate-400">Total pekerjaan tercatat pada periode ini</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {users
                  .filter(u => u.role !== 'Admin' && u.role !== 'Super Admin')
                  .filter(u => analyticsSelectedKanwil === 'Semua' || u.kanwil === analyticsSelectedKanwil)
                  .map(u => ({
                    ...u,
                    ticketCount: analyticsFilteredReports.filter(r => isReportMatchingUser(r, u)).length
                  }))
                  .sort((a, b) => b.ticketCount - a.ticketCount)
                  .map((u, i) => {
                    return (
                      <div
                        key={u.uid}
                        onClick={() => {
                          setSelectedReportUser(u.displayName || u.email);
                          setSelectedReportKanwil(u.kanwil || 'Semua');
                          setSelectedReportCategory('Semua');
                          setReportStartDate(analyticsStartDate);
                          setReportEndDate(analyticsEndDate);
                          setReportActivePreset(analyticsActivePreset);
                          setActiveTab('reports');
                        }}
                        className="flex items-center justify-between pt-2 text-xs hover:bg-slate-50 p-1 rounded-lg cursor-pointer transition-all"
                        title={`Klik untuk lihat laporan petugas ${u.displayName}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{u.displayName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.kanwil || 'Kanwil VIII'}</p>
                          </div>
                        </div>
                        <span className={`font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                          u.ticketCount > 0
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-slate-400 bg-slate-50 border-slate-200'
                        }`}>
                          {u.ticketCount} Laporan
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
