"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Download,
  FileSpreadsheet,
  Zap,
  BarChart3,
  X,
} from "lucide-react";
import {
  UserProfile,
  KANWIL_LIST,
  AdminUserSavePayload,
} from "@/features/auth/types/user";
import { DailyReport } from "@/features/reports/types/report";
import { authService } from "@/features/auth/services/authService";
import { reportsService } from "@/features/reports/services/reportsService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AdminUserModal } from "@/features/admin/components/AdminUserModal";
import { AdminUsersTab } from "@/features/admin/components/AdminUsersTab";
import { AdminReportsTab } from "@/features/admin/components/AdminReportsTab";
import { AdminAnalyticsMatrix } from "@/features/admin/components/AdminAnalyticsMatrix";
import { AdminAnalyticsDashboard } from "@/features/admin/components/AdminAnalyticsDashboard";
import { CATEGORY_ITEMS } from "@/features/admin/components/adminConstants";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ReportDetailModal } from "@/features/reports/components/ReportDetailModal";
import { ExportModal } from "@/features/reports/components/ExportModal";

interface AdminUserManagementProps {
  onBackToDashboard: () => void;
  onShowToast: (message: string, type?: "success" | "error") => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  onBackToDashboard,
  onShowToast,
}) => {
  const { userProfile: currentAdmin, refreshUserProfile } = useAuth();

  // Navigation Tab State: 'users' | 'reports' | 'analytics' (Default: 'analytics')
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "analytics">(
    "analytics",
  );

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
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [selectedUserKanwil, setSelectedUserKanwil] = useState("Semua");
  const [selectedUserRole, setSelectedUserRole] = useState("Semua");

  // Report Tab Filters
  const [searchReportQuery, setSearchReportQuery] = useState("");
  const [selectedReportKanwil, setSelectedReportKanwil] = useState("Semua");
  const [selectedReportUser, setSelectedReportUser] = useState("Semua");
  const [selectedReportCategory, setSelectedReportCategory] = useState("Semua");
  const [reportDateFilter, setReportDateFilter] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportActivePreset, setReportActivePreset] = useState<
    | "all"
    | "cycle13"
    | "cycle13_next"
    | "cycle21"
    | "month"
    | "today"
    | "custom"
  >("all");

  // Analytics Tab Filters & Sorting
  const [analyticsStartDate, setAnalyticsStartDate] = useState("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState("");
  const [analyticsActivePreset, setAnalyticsActivePreset] = useState<
    | "all"
    | "cycle13"
    | "cycle13_next"
    | "cycle21"
    | "month"
    | "today"
    | "custom"
  >("all");
  const [analyticsSelectedKanwil, setAnalyticsSelectedKanwil] =
    useState("Semua");
  const [analyticsSelectedCategory, setAnalyticsSelectedCategory] =
    useState("Semua");
  const [matrixSearchQuery, setMatrixSearchQuery] = useState("");
  const [matrixSortField, setMatrixSortField] = useState<
    "total" | "name" | "hardware" | "software" | "network" | "sla"
  >("total");
  const [matrixSortAsc, setMatrixSortAsc] = useState(false);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Password reset email modal state
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Report Detail Modal
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Pagination for Reports Tab
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [reportItemsPerPage, setReportItemsPerPage] = useState(10);
  const [reportDateSortOrder, setReportDateSortOrder] = useState<
    "asc" | "desc"
  >("desc");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load All Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await authService.getAllUsers();
      setUsers(data);
      return data;
    } catch (err) {
      console.error("Failed to load users:", err);
      onShowToast("Gagal memuat daftar pengguna.", "error");
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
      console.error("Failed to load all reports:", err);
      onShowToast("Gagal memuat seluruh laporan IT.", "error");
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
    onShowToast("Data berhasil diperbarui!");
  };

  // User Map for fast lookup by UID
  const userMap = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users]);

  // Robust matching helper to check if a report belongs to a user
  const isReportMatchingUser = (
    report: DailyReport,
    user: UserProfile,
  ): boolean => {
    if (!user) return false;
    // 1. Direct UID match
    if (report.userId && report.userId === user.uid) return true;

    // 2. Full Name / Email match
    const pic = (report.picSupport || "").toLowerCase().trim();
    const name = (user.displayName || "").toLowerCase().trim();
    const email = (user.email || "").toLowerCase().trim();

    if (name && pic.includes(name)) return true;
    if (email && pic.includes(email)) return true;

    // 3. First name match fallback (e.g. 'alzi', 'rizky', 'triwan')
    const firstName = name.split(" ")[0];
    if (firstName && firstName.length > 2 && pic.includes(firstName))
      return true;

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
    const matchedUser = users.find((u) => isReportMatchingUser(report, u));
    if (
      matchedUser?.kanwil &&
      KANWIL_LIST.includes(matchedUser.kanwil as any)
    ) {
      return matchedUser.kanwil;
    }

    // 3. Text pattern match in unitKerja and picSupport
    const text =
      `${report.unitKerja || ""} ${report.picSupport || ""}`.toLowerCase();

    // Check exact full Kanwil name first (e.g. 'Kanwil VIII - Jakarta 1')
    for (const k of KANWIL_LIST) {
      if (text.includes(k.toLowerCase())) return k;
    }

    // Check specific Jakarta 1 vs Jakarta 2
    if (
      text.includes("jakarta 2") ||
      text.includes("jakarta ii") ||
      text.includes("kanwil ix") ||
      text.includes("kanwil 9")
    ) {
      return "Kanwil IX - Jakarta 2";
    }
    if (
      text.includes("jakarta 1") ||
      text.includes("jakarta i") ||
      text.includes("kanwil viii") ||
      text.includes("kanwil 8")
    ) {
      return "Kanwil VIII - Jakarta 1";
    }

    // Check specific unique cities
    const cityToKanwil: Record<string, string> = {
      surabaya: "Kanwil XII - Surabaya",
      semarang: "Kanwil XI - Semarang",
      bandung: "Kanwil X - Bandung",
      denpasar: "Kanwil VII - Denpasar",
      makassar: "Kanwil VI - Makassar",
      manado: "Kanwil V - Manado",
      balikpapan: "Kanwil IV - Balikpapan",
      palembang: "Kanwil III - Palembang",
      pekanbaru: "Kanwil II - Pekanbaru",
      medan: "Kanwil I - Medan",
    };

    for (const [city, kVal] of Object.entries(cityToKanwil)) {
      if (text.includes(city)) return kVal;
    }

    // Exact Roman numerals in descending order with regex word boundary
    const romanPatterns: Array<[RegExp, string]> = [
      [/\bkanwil\s+(xii|12)\b/i, "Kanwil XII - Surabaya"],
      [/\bkanwil\s+(xi|11)\b/i, "Kanwil XI - Semarang"],
      [/\bkanwil\s+(x|10)\b/i, "Kanwil X - Bandung"],
      [/\bkanwil\s+(ix|9)\b/i, "Kanwil IX - Jakarta 2"],
      [/\bkanwil\s+(viii|8)\b/i, "Kanwil VIII - Jakarta 1"],
      [/\bkanwil\s+(vii|7)\b/i, "Kanwil VII - Denpasar"],
      [/\bkanwil\s+(vi|6)\b/i, "Kanwil VI - Makassar"],
      [/\bkanwil\s+(v|5)\b/i, "Kanwil V - Manado"],
      [/\bkanwil\s+(iv|4)\b/i, "Kanwil IV - Balikpapan"],
      [/\bkanwil\s+(iii|3)\b/i, "Kanwil III - Palembang"],
      [/\bkanwil\s+(ii|2)\b/i, "Kanwil II - Pekanbaru"],
      [/\bkanwil\s+(i|1)\b/i, "Kanwil I - Medan"],
    ];

    for (const [pattern, kVal] of romanPatterns) {
      if (pattern.test(text)) return kVal;
    }

    return null;
  };

  // Robust matching helper to check if a report belongs to a Kanwil
  const isReportMatchingKanwil = (
    report: DailyReport,
    kanwil: string,
  ): boolean => {
    if (kanwil === "Semua") return true;
    const reportKanwil = getReportKanwil(report);
    return reportKanwil === kanwil;
  };

  // Switch tab and drill down to a specific user's reports
  const handleDrillDownUserReports = (user: UserProfile) => {
    setSelectedReportUser(user.displayName || user.email);
    if (user.kanwil) {
      setSelectedReportKanwil(user.kanwil);
    }
    setSelectedReportCategory("Semua");
    setReportDateFilter("");
    setSearchReportQuery("");
    setActiveTab("reports");
  };

  // Filter non-admin users for PIC dropdown in Tab 2
  const availableOfficersForFilter = useMemo(() => {
    const nonAdminUsers = users.filter(
      (u) => u.role !== "Admin" && u.role !== "Super Admin",
    );
    if (selectedReportKanwil === "Semua") {
      return nonAdminUsers;
    }
    return nonAdminUsers.filter((u) => u.kanwil === selectedReportKanwil);
  }, [users, selectedReportKanwil]);

  // Synchronized Filter Change Handlers
  const handleUserFilterChange = (userName: string) => {
    setSelectedReportUser(userName);
    if (userName !== "Semua") {
      const targetUser = users.find(
        (u) => (u.displayName || u.email) === userName,
      );
      if (targetUser && targetUser.kanwil) {
        setSelectedReportKanwil(targetUser.kanwil);
      }
    }
  };

  const handleKanwilFilterChange = (kanwilName: string) => {
    setSelectedReportKanwil(kanwilName);
    if (kanwilName !== "Semua" && selectedReportUser !== "Semua") {
      const targetUser = users.find(
        (u) => (u.displayName || u.email) === selectedReportUser,
      );
      if (targetUser && targetUser.kanwil && targetUser.kanwil !== kanwilName) {
        setSelectedReportUser("Semua");
      }
    }
  };

  // --- Calculations for Users Tab ---
  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(
      (u) => u.role === "Admin" || u.role === "Super Admin",
    ).length;
    const supervisorCount = users.filter((u) => u.role === "Supervisor").length;
    const supportCount = users.filter(
      (u) => u.role === "Desktop Support" || !u.role,
    ).length;
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

      const matchKanwil =
        selectedUserKanwil === "Semua" || u.kanwil === selectedUserKanwil;
      const matchRole =
        selectedUserRole === "Semua" ||
        u.role === selectedUserRole ||
        (selectedUserRole === "Desktop Support" && !u.role);

      return matchSearch && matchKanwil && matchRole;
    });
  }, [users, searchUserQuery, selectedUserKanwil, selectedUserRole]);

  // Date Formatter Helper
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Dynamic Cycle 13 & 21 calculation for Admin
  const adminCycleData = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    const toISO = (d: Date) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${yr}-${mo}-${da}`;
    };

    const monthNamesShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

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
    const c1Count = allReports.filter(
      (r) =>
        r.tanggalPengerjaan >= c1StartISO && r.tanggalPengerjaan <= c1EndISO,
    ).length;
    const c2Count = allReports.filter(
      (r) =>
        r.tanggalPengerjaan >= c2StartISO && r.tanggalPengerjaan <= c2EndISO,
    ).length;
    const c21Count = allReports.filter(
      (r) =>
        r.tanggalPengerjaan >= c21StartISO && r.tanggalPengerjaan <= c21EndISO,
    ).length;
    const monthCount = allReports.filter(
      (r) => r.tanggalPengerjaan >= mStartISO && r.tanggalPengerjaan <= mEndISO,
    ).length;

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
      monthCount,
    };
  }, [allReports]);

  // Analytics Preset Handler
  const handleAnalyticsPreset = (
    type: "all" | "cycle13" | "cycle13_next" | "cycle21" | "month" | "today",
  ) => {
    setAnalyticsActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth();

    if (type === "cycle13") {
      setAnalyticsStartDate(adminCycleData.c1StartISO);
      setAnalyticsEndDate(adminCycleData.c1EndISO);
    } else if (type === "cycle13_next") {
      setAnalyticsStartDate(adminCycleData.c2StartISO);
      setAnalyticsEndDate(adminCycleData.c2EndISO);
    } else if (type === "cycle21") {
      setAnalyticsStartDate(adminCycleData.c21StartISO);
      setAnalyticsEndDate(adminCycleData.c21EndISO);
    } else if (type === "month") {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setAnalyticsStartDate(formatDateISO(start));
      setAnalyticsEndDate(formatDateISO(end));
    } else if (type === "today") {
      const today = formatDateISO(curr);
      setAnalyticsStartDate(today);
      setAnalyticsEndDate(today);
    } else if (type === "all") {
      setAnalyticsStartDate("");
      setAnalyticsEndDate("");
    }
  };

  // Report Tab Preset Handler
  const handleReportPreset = (
    type: "all" | "cycle13" | "cycle13_next" | "cycle21" | "month" | "today",
  ) => {
    setReportActivePreset(type);
    const curr = new Date();
    const y = curr.getFullYear();
    const m = curr.getMonth();

    if (type === "cycle13") {
      setReportStartDate(adminCycleData.c1StartISO);
      setReportEndDate(adminCycleData.c1EndISO);
      setReportDateFilter("");
    } else if (type === "cycle13_next") {
      setReportStartDate(adminCycleData.c2StartISO);
      setReportEndDate(adminCycleData.c2EndISO);
      setReportDateFilter("");
    } else if (type === "cycle21") {
      setReportStartDate(adminCycleData.c21StartISO);
      setReportEndDate(adminCycleData.c21EndISO);
      setReportDateFilter("");
    } else if (type === "month") {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setReportStartDate(formatDateISO(start));
      setReportEndDate(formatDateISO(end));
      setReportDateFilter("");
    } else if (type === "today") {
      const today = formatDateISO(curr);
      setReportStartDate(today);
      setReportEndDate(today);
      setReportDateFilter(today);
    } else if (type === "all") {
      setReportStartDate("");
      setReportEndDate("");
      setReportDateFilter("");
    }
  };

  // Quick Drill-Down from Analytics Matrix to Tab 2
  const handleDrillDownFromAnalytics = (
    kanwil: string,
    category: string = "Semua",
  ) => {
    setSelectedReportKanwil(kanwil);
    setSelectedReportCategory(category);
    setSelectedReportUser("Semua");
    setReportStartDate(analyticsStartDate);
    setReportEndDate(analyticsEndDate);
    setReportActivePreset(analyticsActivePreset);
    setReportDateFilter("");
    setSearchReportQuery("");
    setActiveTab("reports");
  };

  // --- Calculations for Analytics Tab ---
  // Analytics Filtered Dataset
  const analyticsFilteredReports = useMemo(() => {
    return allReports.filter((item) => {
      // Date filter
      if (analyticsStartDate && analyticsEndDate) {
        if (
          item.tanggalPengerjaan < analyticsStartDate ||
          item.tanggalPengerjaan > analyticsEndDate
        )
          return false;
      } else if (analyticsStartDate) {
        if (item.tanggalPengerjaan < analyticsStartDate) return false;
      } else if (analyticsEndDate) {
        if (item.tanggalPengerjaan > analyticsEndDate) return false;
      }

      // Kanwil filter
      if (analyticsSelectedKanwil !== "Semua") {
        if (!isReportMatchingKanwil(item, analyticsSelectedKanwil))
          return false;
      }

      // Category filter
      if (analyticsSelectedCategory !== "Semua") {
        if (item.category !== analyticsSelectedCategory) return false;
      }

      return true;
    });
  }, [
    allReports,
    analyticsStartDate,
    analyticsEndDate,
    analyticsSelectedKanwil,
    analyticsSelectedCategory,
    users,
    userMap,
  ]);

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

      const hardwareCount = kanwilReports.filter(
        (r) => r.category === "Hardware Kanwil",
      ).length;
      const softwareCount = kanwilReports.filter(
        (r) => r.category === "Software Kanwil",
      ).length;
      const networkCount = kanwilReports.filter(
        (r) => r.category === "Network/Jaringan",
      ).length;
      const meetingCount = kanwilReports.filter(
        (r) => r.category === "Video Confference & Meeting",
      ).length;
      const malwareCount = kanwilReports.filter(
        (r) => r.category === "Malware",
      ).length;
      const relokasiCount = kanwilReports.filter(
        (r) => r.category === "Relokasi/Renovasi",
      ).length;
      const lainnyaCount = kanwilReports.filter(
        (r) => r.category === "Lainnya",
      ).length;

      const officers = users.filter(
        (u) =>
          u.kanwil === kanwilName &&
          u.role !== "Admin" &&
          u.role !== "Super Admin",
      );

      let totalMinutes = 0;
      let validSLACount = 0;
      kanwilReports.forEach((r) => {
        if (r.waktuMulai && r.waktuSelesai) {
          const [sh, sm] = r.waktuMulai.split(":").map(Number);
          const [eh, em] = r.waktuSelesai.split(":").map(Number);
          let diff = eh * 60 + em - (sh * 60 + sm);
          if (diff < 0) diff += 1440;
          totalMinutes += diff;
          validSLACount++;
        }
      });
      const avgMinutes =
        validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgRemMins = avgMinutes % 60;
      const avgSlaStr = `${avgHours}:${avgRemMins.toString().padStart(2, "0")}:00`;
      const nationalTotal = analyticsFilteredReports.length;
      const pctOfNational =
        nationalTotal > 0 ? Math.round((total / nationalTotal) * 100) : 0;

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
        pctOfNational,
      };
    });

    if (unassignedReports.length > 0) {
      const total = unassignedReports.length;
      const hardwareCount = unassignedReports.filter(
        (r) => r.category === "Hardware Kanwil",
      ).length;
      const softwareCount = unassignedReports.filter(
        (r) => r.category === "Software Kanwil",
      ).length;
      const networkCount = unassignedReports.filter(
        (r) => r.category === "Network/Jaringan",
      ).length;
      const meetingCount = unassignedReports.filter(
        (r) => r.category === "Video Confference & Meeting",
      ).length;
      const malwareCount = unassignedReports.filter(
        (r) => r.category === "Malware",
      ).length;
      const relokasiCount = unassignedReports.filter(
        (r) => r.category === "Relokasi/Renovasi",
      ).length;
      const lainnyaCount = unassignedReports.filter(
        (r) => r.category === "Lainnya",
      ).length;

      let totalMinutes = 0;
      let validSLACount = 0;
      unassignedReports.forEach((r) => {
        if (r.waktuMulai && r.waktuSelesai) {
          const [sh, sm] = r.waktuMulai.split(":").map(Number);
          const [eh, em] = r.waktuSelesai.split(":").map(Number);
          let diff = eh * 60 + em - (sh * 60 + sm);
          if (diff < 0) diff += 1440;
          totalMinutes += diff;
          validSLACount++;
        }
      });
      const avgMinutes =
        validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgRemMins = avgMinutes % 60;
      const avgSlaStr = `${avgHours}:${avgRemMins.toString().padStart(2, "0")}:00`;
      const nationalTotal = analyticsFilteredReports.length;
      const pctOfNational =
        nationalTotal > 0 ? Math.round((total / nationalTotal) * 100) : 0;

      list.push({
        kanwilName: "Kantor Pusat / Lainnya",
        officersCount: users.filter(
          (u) =>
            !KANWIL_LIST.includes(u.kanwil as any) &&
            u.role !== "Admin" &&
            u.role !== "Super Admin",
        ).length,
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
        pctOfNational,
      });
    }

    return list;
  }, [analyticsFilteredReports, users, userMap]);

  // Matrix Filtered & Sorted
  const filteredAndSortedMatrix = useMemo(() => {
    let result = kanwilCategoryMatrix;
    if (matrixSearchQuery.trim()) {
      const q = matrixSearchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        item.kanwilName.toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (matrixSortField === "total") {
        valA = a.total;
        valB = b.total;
      } else if (matrixSortField === "hardware") {
        valA = a.hardwareCount;
        valB = b.hardwareCount;
      } else if (matrixSortField === "software") {
        valA = a.softwareCount;
        valB = b.softwareCount;
      } else if (matrixSortField === "network") {
        valA = a.networkCount;
        valB = b.networkCount;
      } else if (matrixSortField === "sla") {
        valA = a.avgMinutes;
        valB = b.avgMinutes;
      } else if (matrixSortField === "name") {
        valA = a.kanwilName;
        valB = b.kanwilName;
        return matrixSortAsc
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return matrixSortAsc
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
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
        officersCount: acc.officersCount + item.officersCount,
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
        officersCount: 0,
      },
    );
  }, [kanwilCategoryMatrix]);

  // Analytics Top Category
  const topCategorySummary = useMemo(() => {
    const cats = CATEGORY_ITEMS.filter((c) => c.name !== "Semua")
      .map((c) => ({
        name: c.name,
        label: c.label,
        count: analyticsFilteredReports.filter((r) => r.category === c.name)
          .length,
      }))
      .sort((a, b) => b.count - a.count);
    return cats[0] || { name: "-", label: "-", count: 0 };
  }, [analyticsFilteredReports]);

  // Analytics Top Kanwil
  const topKanwilSummary = useMemo(() => {
    const sorted = [...kanwilCategoryMatrix].sort((a, b) => b.total - a.total);
    return sorted[0] || { kanwilName: "-", total: 0 };
  }, [kanwilCategoryMatrix]);

  const analyticsTopKanwilRanking = useMemo(
    () =>
      kanwilCategoryMatrix
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [kanwilCategoryMatrix],
  );

  const analyticsWeekdayDistribution = useMemo(() => {
    const weekdays = [
      { label: "Sen", day: 1, count: 0 },
      { label: "Sel", day: 2, count: 0 },
      { label: "Rab", day: 3, count: 0 },
      { label: "Kam", day: 4, count: 0 },
      { label: "Jum", day: 5, count: 0 },
      { label: "Sab", day: 6, count: 0 },
      { label: "Min", day: 0, count: 0 },
    ];

    analyticsFilteredReports.forEach((report) => {
      const date = new Date(`${report.tanggalPengerjaan}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;
      const weekday = weekdays.find((item) => item.day === date.getDay());
      if (weekday) weekday.count += 1;
    });

    return weekdays;
  }, [analyticsFilteredReports]);
  const maxWeekdayCount = Math.max(
    1,
    ...analyticsWeekdayDistribution.map((day) => day.count),
  );

  // Analytics Overall SLA
  const analyticsOverallSla = useMemo(() => {
    let totalMins = 0;
    let count = 0;
    analyticsFilteredReports.forEach((r) => {
      if (r.waktuMulai && r.waktuSelesai) {
        const [sh, sm] = r.waktuMulai.split(":").map(Number);
        const [eh, em] = r.waktuSelesai.split(":").map(Number);
        let diff = eh * 60 + em - (sh * 60 + sm);
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
      formatted: `${h}:${m.toString().padStart(2, "0")}:00`,
    };
  }, [analyticsFilteredReports]);

  // Analytics Method Breakdown
  const analyticsMethodSummary = useMemo(() => {
    const total = analyticsFilteredReports.length;
    const visitCount = analyticsFilteredReports.filter(
      (r) => r.metodePenanganan === "Visit",
    ).length;
    const remoteCount = analyticsFilteredReports.filter(
      (r) => r.metodePenanganan === "Remote",
    ).length;
    const guideCount = analyticsFilteredReports.filter(
      (r) => r.metodePenanganan === "Guide" || !r.metodePenanganan,
    ).length;

    const visitPct = total > 0 ? Math.round((visitCount / total) * 100) : 0;
    const remotePct = total > 0 ? Math.round((remoteCount / total) * 100) : 0;
    const guidePct = total > 0 ? Math.round((guideCount / total) * 100) : 0;

    let dominantMethod = "Remote";
    let dominantCount = remoteCount;
    let dominantPct = remotePct;

    if (visitCount >= remoteCount && visitCount >= guideCount) {
      dominantMethod = "Visit";
      dominantCount = visitCount;
      dominantPct = visitPct;
    } else if (guideCount >= remoteCount && guideCount >= visitCount) {
      dominantMethod = "Guide";
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
      dominantPct,
    };
  }, [analyticsFilteredReports]);

  // Analytics Top Officer IT Support
  const analyticsTopOfficer = useMemo(() => {
    const supportUsers = users.filter(
      (u) => u.role !== "Admin" && u.role !== "Super Admin",
    );
    const officerCounts = supportUsers
      .map((u) => ({
        name: u.displayName || u.email,
        kanwil: u.kanwil || "Kanwil",
        count: analyticsFilteredReports.filter((r) =>
          isReportMatchingUser(r, u),
        ).length,
      }))
      .sort((a, b) => b.count - a.count);

    return officerCounts[0] || { name: "-", kanwil: "-", count: 0 };
  }, [users, analyticsFilteredReports, userMap]);

  // Analytics Top Unit Kerja / Cabang
  const analyticsTopUnitKerja = useMemo(() => {
    const unitMap: Record<string, number> = {};
    analyticsFilteredReports.forEach((r) => {
      const u = (r.unitKerja || "").trim();
      if (u) {
        unitMap[u] = (unitMap[u] || 0) + 1;
      }
    });

    const entries = Object.entries(unitMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return entries[0] || { name: "-", count: 0 };
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
        (item.deskripsiPermohonan &&
          item.deskripsiPermohonan.toLowerCase().includes(q)) ||
        (item.solusiIssue && item.solusiIssue.toLowerCase().includes(q)) ||
        (item.picSupport && item.picSupport.toLowerCase().includes(q));

      let matchDate = true;
      if (reportStartDate && reportEndDate) {
        matchDate =
          item.tanggalPengerjaan >= reportStartDate &&
          item.tanggalPengerjaan <= reportEndDate;
      } else if (reportStartDate) {
        matchDate = item.tanggalPengerjaan >= reportStartDate;
      } else if (reportEndDate) {
        matchDate = item.tanggalPengerjaan <= reportEndDate;
      } else if (reportDateFilter) {
        matchDate = item.tanggalPengerjaan === reportDateFilter;
      }

      let matchUser = true;
      if (selectedReportUser !== "Semua") {
        const targetUser = users.find(
          (u) => (u.displayName || u.email) === selectedReportUser,
        );
        if (targetUser) {
          matchUser = isReportMatchingUser(item, targetUser);
        } else {
          matchUser =
            item.picSupport
              ?.toLowerCase()
              .includes(selectedReportUser.toLowerCase()) || false;
        }
      }

      let matchKanwil = true;
      if (selectedReportKanwil !== "Semua") {
        if (selectedReportUser !== "Semua") {
          const targetUser = users.find(
            (u) => (u.displayName || u.email) === selectedReportUser,
          );
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
    userMap,
  ]);

  // 2. Final filtered reports (Base + Category filter)
  const filteredReports = useMemo(() => {
    if (selectedReportCategory === "Semua") {
      return baseFilteredReports;
    }
    return baseFilteredReports.filter(
      (r) => r.category === selectedReportCategory,
    );
  }, [baseFilteredReports, selectedReportCategory]);

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const dateComparison = a.tanggalPengerjaan.localeCompare(
        b.tanggalPengerjaan,
      );
      return reportDateSortOrder === "asc" ? dateComparison : -dateComparison;
    });
  }, [filteredReports, reportDateSortOrder]);

  // 3. Category count pills dynamically synced with current filters
  const categoryPillCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Semua: baseFilteredReports.length,
    };
    CATEGORY_ITEMS.forEach((cat) => {
      if (cat.name !== "Semua") {
        counts[cat.name] = baseFilteredReports.filter(
          (r) => r.category === cat.name,
        ).length;
      }
    });
    return counts;
  }, [baseFilteredReports]);

  // 4. Real-time KPI Stats in Tab 2 dynamically synced
  const reportStats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    const sourceReports = baseFilteredReports;
    const total = sourceReports.length;
    const todayReports = sourceReports.filter(
      (r) => r.tanggalPengerjaan === todayStr,
    );

    let totalMinutes = 0;
    let validSLACount = 0;
    sourceReports.forEach((r) => {
      if (r.waktuMulai && r.waktuSelesai) {
        const [sh, sm] = r.waktuMulai.split(":").map(Number);
        const [eh, em] = r.waktuSelesai.split(":").map(Number);
        let startM = (sh || 0) * 60 + (sm || 0);
        let endM = (eh || 0) * 60 + (em || 0);
        if (endM < startM) endM += 24 * 60;
        totalMinutes += endM - startM;
        validSLACount++;
      }
    });

    const avgMinutes =
      validSLACount > 0 ? Math.round(totalMinutes / validSLACount) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgRemMins = avgMinutes % 60;
    const avgSlaFormatted = `${avgHours}:${avgRemMins.toString().padStart(2, "0")}:00`;

    const uniquePics = new Set(
      sourceReports.map((r) => r.picSupport?.toLowerCase()).filter(Boolean),
    );
    const visitCount = sourceReports.filter(
      (r) => r.metodePenanganan === "Visit",
    ).length;
    const remoteCount = sourceReports.filter(
      (r) => r.metodePenanganan === "Remote",
    ).length;
    const guideCount = sourceReports.filter(
      (r) => r.metodePenanganan === "Guide" || !r.metodePenanganan,
    ).length;

    return {
      total,
      todayCount: todayReports.length,
      avgSlaFormatted,
      avgMinutes,
      activePicCount: uniquePics.size,
      visitCount,
      remoteCount,
      guideCount,
    };
  }, [baseFilteredReports]);

  // Pagination for Reports
  const totalReportItems = filteredReports.length;
  const totalReportPages = Math.max(
    1,
    Math.ceil(totalReportItems / reportItemsPerPage),
  );
  const startReportIndex = (reportCurrentPage - 1) * reportItemsPerPage;
  const endReportIndex = Math.min(
    startReportIndex + reportItemsPerPage,
    totalReportItems,
  );
  const paginatedReports = sortedReports.slice(
    startReportIndex,
    endReportIndex,
  );

  useEffect(() => {
    setReportCurrentPage(1);
  }, [
    searchReportQuery,
    selectedReportCategory,
    reportDateFilter,
    selectedReportUser,
    selectedReportKanwil,
    reportItemsPerPage,
    reportDateSortOrder,
  ]);

  // SLA Color Helper
  const getSLABadge = (slaStr: string) => {
    const [h, m] = slaStr.split(":").map(Number);
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
      onShowToast(
        payload.uid
          ? "Data pengguna berhasil diperbarui."
          : "Pengguna baru berhasil ditambahkan.",
      );
      await loadUsers();
      if (currentAdmin?.uid === payload.uid) {
        refreshUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || "Gagal menyimpan pengguna.", "error");
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
      onShowToast(err.message || "Gagal mengubah role pengguna.", "error");
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
      onShowToast(err.message || "Gagal menghapus pengguna.", "error");
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    try {
      setResetLoading(true);
      await authService.adminResetPasswordEmail(resettingUser.email);
      onShowToast(
        `Instruksi reset kata sandi dikirim ke ${resettingUser.email}.`,
      );
      setIsResetModalOpen(false);
      setResettingUser(null);
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || "Gagal mereset kata sandi.", "error");
    } finally {
      setResetLoading(false);
    }
  };

  const formatDate = (dateVal?: any) => {
    if (!dateVal) return "-";
    try {
      const d =
        typeof dateVal === "number" ? new Date(dateVal) : new Date(dateVal);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
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
                Kelola hak akses personil, monitoring seluruh laporan Manage Service se-Indonesia, dan evaluasi kepatuhan SLA.
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
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            {activeTab === "users" ? (
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
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${
              activeTab === "reports"
                ? "bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
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
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-pegadaian-900 shadow-md ring-2 ring-emerald-400/30"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
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

      {activeTab === "users" && (
        <AdminUsersTab
          currentAdmin={currentAdmin}
          userStats={userStats}
          usersCount={users.length}
          searchUserQuery={searchUserQuery}
          onSearchUserQueryChange={setSearchUserQuery}
          selectedUserKanwil={selectedUserKanwil}
          onSelectedUserKanwilChange={setSelectedUserKanwil}
          selectedUserRole={selectedUserRole}
          onSelectedUserRoleChange={setSelectedUserRole}
          loadingUsers={loadingUsers}
          filteredUsers={filteredUsers}
          onQuickRoleChange={handleQuickRoleChange}
          formatDate={formatDate}
          onDrillDownUserReports={handleDrillDownUserReports}
          onEditUser={(user) => {
            setEditingUser(user);
            setIsUserModalOpen(true);
          }}
          onResetPassword={(user) => {
            setResettingUser(user);
            setIsResetModalOpen(true);
          }}
          onDeleteUser={(user) => {
            setDeletingUser(user);
            setIsDeleteModalOpen(true);
          }}
        />
      )}

      {activeTab === "reports" && (
        <AdminReportsTab
          adminCycleData={adminCycleData}
          availableOfficersForFilter={availableOfficersForFilter}
          categoryPillCounts={categoryPillCounts}
          getSLABadge={getSLABadge}
          handleKanwilFilterChange={handleKanwilFilterChange}
          handleReportPreset={handleReportPreset}
          handleUserFilterChange={handleUserFilterChange}
          loadingReports={loadingReports}
          paginatedReports={paginatedReports}
          reportActivePreset={reportActivePreset}
          reportCurrentPage={reportCurrentPage}
          reportDateFilter={reportDateFilter}
          reportDateSortOrder={reportDateSortOrder}
          reportEndDate={reportEndDate}
          reportStartDate={reportStartDate}
          reportStats={reportStats}
          searchReportQuery={searchReportQuery}
          selectedReportCategory={selectedReportCategory}
          selectedReportKanwil={selectedReportKanwil}
          selectedReportUser={selectedReportUser}
          setReportActivePreset={setReportActivePreset}
          setReportCurrentPage={setReportCurrentPage}
          setReportDateFilter={setReportDateFilter}
          setReportDateSortOrder={setReportDateSortOrder}
          setReportEndDate={setReportEndDate}
          setReportStartDate={setReportStartDate}
          setSearchReportQuery={setSearchReportQuery}
          setSelectedReportCategory={setSelectedReportCategory}
          setSelectedReportKanwil={setSelectedReportKanwil}
          setSelectedReportUser={setSelectedReportUser}
          setViewingReport={setViewingReport}
          startReportIndex={startReportIndex}
          endReportIndex={endReportIndex}
          totalReportItems={totalReportItems}
          totalReportPages={totalReportPages}
          dateInputRef={dateInputRef}
        />
      )}

      {activeTab === "analytics" && (
        <AdminAnalyticsDashboard
          adminCycleData={adminCycleData}
          allReports={allReports}
          analyticsActivePreset={analyticsActivePreset}
          analyticsEndDate={analyticsEndDate}
          analyticsFilteredReports={analyticsFilteredReports}
          analyticsMethodSummary={analyticsMethodSummary}
          analyticsOverallSla={analyticsOverallSla}
          analyticsSelectedCategory={analyticsSelectedCategory}
          analyticsSelectedKanwil={analyticsSelectedKanwil}
          analyticsStartDate={analyticsStartDate}
          analyticsTopKanwilRanking={analyticsTopKanwilRanking}
          analyticsTopOfficer={analyticsTopOfficer}
          analyticsTopUnitKerja={analyticsTopUnitKerja}
          analyticsWeekdayDistribution={analyticsWeekdayDistribution}
          handleAnalyticsPreset={handleAnalyticsPreset}
          handleDrillDownFromAnalytics={handleDrillDownFromAnalytics}
          isReportMatchingUser={isReportMatchingUser}
          maxWeekdayCount={maxWeekdayCount}
          setActiveTab={setActiveTab}
          setAnalyticsActivePreset={setAnalyticsActivePreset}
          setAnalyticsEndDate={setAnalyticsEndDate}
          setAnalyticsSelectedCategory={setAnalyticsSelectedCategory}
          setAnalyticsSelectedKanwil={setAnalyticsSelectedKanwil}
          setAnalyticsStartDate={setAnalyticsStartDate}
          setReportActivePreset={setReportActivePreset}
          setReportEndDate={setReportEndDate}
          setReportStartDate={setReportStartDate}
          setSelectedReportCategory={setSelectedReportCategory}
          setSelectedReportKanwil={setSelectedReportKanwil}
          setSelectedReportUser={setSelectedReportUser}
          topCategorySummary={topCategorySummary}
          topKanwilSummary={topKanwilSummary}
          users={users}
        />
      )}

      {activeTab === "analytics" && (
        <AdminAnalyticsMatrix
          filteredAndSortedMatrix={filteredAndSortedMatrix}
          matrixSearchQuery={matrixSearchQuery}
          setMatrixSearchQuery={setMatrixSearchQuery}
          matrixSortField={matrixSortField}
          setMatrixSortField={setMatrixSortField}
          matrixSortAsc={matrixSortAsc}
          setMatrixSortAsc={setMatrixSortAsc}
          matrixSummary={matrixSummary}
          analyticsOverallSla={analyticsOverallSla}
          handleDrillDownFromAnalytics={handleDrillDownFromAnalytics}
        />
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

      {/* Admin Password Reset Email */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-100 mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              Reset Kata Sandi
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Kirim instruksi reset kata sandi ke akun{" "}
              <strong className="text-slate-800">
                {resettingUser.displayName}
              </strong>{" "}
              ({resettingUser.email}).
            </p>

            <form
              onSubmit={handleConfirmResetPassword}
              className="mt-5 space-y-4"
            >
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
                  {resetLoading ? "Mengirim..." : "Kirim Email Reset"}
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
          initialUser={
            selectedReportUser !== "Semua" ? selectedReportUser : undefined
          }
        />
      )}
    </div>
  );
};
