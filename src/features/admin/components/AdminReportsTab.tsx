"use client";

import React from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Eye,
  FileSpreadsheet,
  Laptop,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { KANWIL_LIST, UserProfile } from "@/features/auth/types/user";
import { DailyReport } from "@/features/reports/types/report";
import {
  calculateSLA,
  formatDateFormatted,
  getDayName,
} from "@/features/reports/utils/exportUtils";
import { CATEGORY_ITEMS } from "@/features/admin/components/adminConstants";

type ReportPreset = "all" | "cycle13" | "cycle13_next" | "cycle21" | "month" | "today" | "custom";
type ReportPresetOption = Exclude<ReportPreset, "custom">;

interface AdminCycleData {
  c1Count: number;
  c1Label: string;
  c2Count: number;
  c2Label: string;
  c21Count: number;
  c21Label: string;
}

interface ReportStats {
  total: number;
  todayCount: number;
  avgSlaFormatted: string;
  activePicCount: number;
  visitCount: number;
  remoteCount: number;
  guideCount: number;
}

interface AdminReportsTabProps {
  adminCycleData: AdminCycleData;
  availableOfficersForFilter: UserProfile[];
  categoryPillCounts: Record<string, number>;
  getSLABadge: (sla: string) => React.ReactNode;
  handleKanwilFilterChange: (kanwil: string) => void;
  handleReportPreset: (preset: ReportPresetOption) => void;
  handleUserFilterChange: (userName: string) => void;
  loadingReports: boolean;
  paginatedReports: DailyReport[];
  reportActivePreset: ReportPreset;
  reportCurrentPage: number;
  reportDateFilter: string;
  reportDateSortOrder: "asc" | "desc";
  reportEndDate: string;
  reportStartDate: string;
  reportStats: ReportStats;
  searchReportQuery: string;
  selectedReportCategory: string;
  selectedReportKanwil: string;
  selectedReportUser: string;
  setReportActivePreset: React.Dispatch<React.SetStateAction<ReportPreset>>;
  setReportCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setReportDateFilter: React.Dispatch<React.SetStateAction<string>>;
  setReportDateSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  setReportEndDate: React.Dispatch<React.SetStateAction<string>>;
  setReportStartDate: React.Dispatch<React.SetStateAction<string>>;
  setSearchReportQuery: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportCategory: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportKanwil: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportUser: React.Dispatch<React.SetStateAction<string>>;
  setViewingReport: React.Dispatch<React.SetStateAction<DailyReport | null>>;
  startReportIndex: number;
  endReportIndex: number;
  totalReportItems: number;
  totalReportPages: number;
  dateInputRef: React.RefObject<HTMLInputElement>;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  adminCycleData,
  availableOfficersForFilter,
  categoryPillCounts,
  getSLABadge,
  handleKanwilFilterChange,
  handleReportPreset,
  handleUserFilterChange,
  loadingReports,
  paginatedReports,
  reportActivePreset,
  reportCurrentPage,
  reportDateFilter,
  reportDateSortOrder,
  reportEndDate,
  reportStartDate,
  reportStats,
  searchReportQuery,
  selectedReportCategory,
  selectedReportKanwil,
  selectedReportUser,
  setReportActivePreset,
  setReportCurrentPage,
  setReportDateFilter,
  setReportDateSortOrder,
  setReportEndDate,
  setReportStartDate,
  setSearchReportQuery,
  setSelectedReportCategory,
  setSelectedReportKanwil,
  setSelectedReportUser,
  setViewingReport,
  startReportIndex,
  endReportIndex,
  totalReportItems,
  totalReportPages,
  dateInputRef,
}) => (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Reports Overview KPI Cards (Real-time Filtered) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* Card 1: Total Laporan */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  {selectedReportUser !== "Semua"
                    ? "Laporan Petugas"
                    : "Total Laporan"}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
                  {reportStats.total}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-0.5 truncate">
                  {selectedReportUser !== "Semua"
                    ? selectedReportUser
                    : "Semua Petugas"}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0 ml-1">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 2: Laporan Hari Ini */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Hari Ini
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">
                  {reportStats.todayCount}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  Laporan aktif
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 ml-1">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 3: Rata-Rata SLA */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Rata-Rata SLA
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5 sm:mt-1 font-mono">
                  {reportStats.avgSlaFormatted}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-teal-600 font-bold mt-0.5 truncate">
                  Kecepatan Respons
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0 ml-1">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 4: Petugas Terlibat */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Petugas
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5 sm:mt-1">
                  {reportStats.activePicCount}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  PIC IT Support
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0 ml-1">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Card 5: Metode Penanganan */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  Metode
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-extrabold text-blue-700">
                    V:{reportStats.visitCount}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-extrabold text-purple-700">
                    R:{reportStats.remoteCount}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-extrabold text-amber-700">
                    G:{reportStats.guideCount}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                  Visit / Remote / Guide
                </p>
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
                  onClick={() => handleReportPreset("cycle13")}
                  className="p-0.5 rounded hover:bg-emerald-100/60 transition-all cursor-pointer text-left"
                >
                  <p className="text-[8px] font-bold text-emerald-700 leading-tight">
                    13 Lalu
                  </p>
                  <p className="text-xs font-black text-emerald-900">
                    {adminCycleData.c1Count}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset("cycle13_next")}
                  className="p-0.5 rounded hover:bg-teal-100/60 transition-all cursor-pointer border-l border-emerald-200/60 pl-1 text-left"
                >
                  <p className="text-[8px] font-bold text-teal-700 leading-tight">
                    13 Ini
                  </p>
                  <p className="text-xs font-black text-teal-900">
                    {adminCycleData.c2Count}
                  </p>
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
                      onClick={() => setSearchReportQuery("")}
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
                  className={`px-3 py-2 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${
                    selectedReportUser !== "Semua"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="Semua">
                    Semua Petugas IT ({availableOfficersForFilter.length})
                  </option>
                  {availableOfficersForFilter.map((u) => (
                    <option key={u.uid} value={u.displayName || u.email}>
                      {u.displayName} ({u.kanwil || "Kanwil"})
                    </option>
                  ))}
                </select>

                {/* Filter Kantor Wilayah (Synchronized) */}
                <select
                  value={selectedReportKanwil}
                  onChange={(e) => handleKanwilFilterChange(e.target.value)}
                  className={`px-3 py-2 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${
                    selectedReportKanwil !== "Semua"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="Semua">Semua Kanwil</option>
                  {KANWIL_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>

                {/* Reset Filter */}
                {(searchReportQuery ||
                  reportDateFilter ||
                  reportStartDate ||
                  reportEndDate ||
                  reportActivePreset !== "all" ||
                  selectedReportCategory !== "Semua" ||
                  selectedReportUser !== "Semua" ||
                  selectedReportKanwil !== "Semua") && (
                  <button
                    onClick={() => {
                      setSearchReportQuery("");
                      setReportDateFilter("");
                      setReportStartDate("");
                      setReportEndDate("");
                      setReportActivePreset("all");
                      setSelectedReportCategory("Semua");
                      setSelectedReportUser("Semua");
                      setSelectedReportKanwil("Semua");
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Row 2: Cut-off Cycle & Date Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">
                  Periode:
                </span>
                <button
                  type="button"
                  onClick={() => handleReportPreset("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === "all" && !reportDateFilter
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  Semua Data
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset("cycle13")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === "cycle13"
                      ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/30"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <span>13 Lalu - 12 Ini</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">
                    ({adminCycleData.c1Label})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset("cycle13_next")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === "cycle13_next"
                      ? "bg-teal-700 text-white shadow-xs ring-2 ring-teal-400/30"
                      : "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                  }`}
                >
                  <span>13 Ini - 12 Depan</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">
                    ({adminCycleData.c2Label})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset("cycle21")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === "cycle21"
                      ? "bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400/30"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                  }`}
                >
                  <span>Siklus 21</span>
                  <span className="ml-1.5 opacity-75 font-mono text-[10px]">
                    ({adminCycleData.c21Label})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportPreset("month")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    reportActivePreset === "month"
                      ? "bg-purple-700 text-white shadow-xs ring-2 ring-purple-400/30"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      reportDateFilter
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <Calendar
                      className={`w-3.5 h-3.5 ${reportDateFilter ? "text-emerald-700" : "text-slate-400"}`}
                    />
                    <span>
                      {reportDateFilter
                        ? formatDateFormatted(reportDateFilter)
                        : "Pilih Tanggal"}
                    </span>
                    {reportDateFilter && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReportDateFilter("");
                          setReportActivePreset("all");
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
                      setReportActivePreset("custom");
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-pegadaian-700 text-white shadow-xs ring-2 ring-emerald-400/30"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600 font-bold"
                        }`}
                      >
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
                    <th className="py-3.5 px-3 w-12 text-center border-r border-slate-700/60">
                      No
                    </th>
                    <th className="py-3.5 px-3 min-w-[85px] border-r border-slate-700/60">
                      Hari
                    </th>
                    <th
                      aria-sort={
                        reportDateSortOrder === "asc"
                          ? "ascending"
                          : "descending"
                      }
                      className="py-3.5 px-3 min-w-[100px] border-r border-slate-700/60"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setReportDateSortOrder((order) =>
                            order === "asc" ? "desc" : "asc",
                          )
                        }
                        aria-label={`Urutkan tanggal ${reportDateSortOrder === "asc" ? "menurun" : "menaik"}`}
                        title={`Urutkan tanggal ${reportDateSortOrder === "asc" ? "menurun" : "menaik"}`}
                        className="inline-flex items-center gap-1.5"
                      >
                        Tanggal
                        {reportDateSortOrder === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">
                      PIC Support
                    </th>
                    <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-700/60">
                      Unit Kerja
                    </th>
                    <th className="py-3.5 px-4 min-w-[120px] border-r border-slate-700/60">
                      Nama User
                    </th>
                    {selectedReportCategory === "Semua" && (
                      <th className="py-3.5 px-3 min-w-[135px] border-r border-slate-700/60 text-center">
                        Kategori
                      </th>
                    )}
                    <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-700/60">
                      Deskripsi Permohonan
                    </th>
                    <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">
                      Metode
                    </th>
                    <th className="py-3.5 px-4 min-w-[220px] border-r border-slate-700/60">
                      Solusi Issue
                    </th>
                    <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">
                      Mulai
                    </th>
                    <th className="py-3.5 px-3 min-w-[70px] border-r border-slate-700/60 text-center">
                      Selesai
                    </th>
                    <th className="py-3.5 px-3 min-w-[95px] border-r border-slate-700/60 text-center">
                      SLA
                    </th>
                    <th className="py-3.5 px-3 w-16 text-center">Detail</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingReports ? (
                    <tr>
                      <td
                        colSpan={selectedReportCategory === "Semua" ? 14 : 13}
                        className="py-16 text-center text-slate-500"
                      >
                        <RefreshCw className="w-7 h-7 animate-spin text-pegadaian-600 mx-auto mb-2" />
                        <p className="font-bold text-xs">
                          Memuat data seluruh laporan IT...
                        </p>
                      </td>
                    </tr>
                  ) : paginatedReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedReportCategory === "Semua" ? 14 : 13}
                        className="py-16 text-center text-slate-500"
                      >
                        <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">
                          Tidak ada laporan ditemukan
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Coba sesuaikan filter petugas, kanwil, atau kategori
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((item, index) => {
                      const slaStr = calculateSLA(
                        item.waktuMulai,
                        item.waktuSelesai,
                      );
                      const dayName = getDayName(item.tanggalPengerjaan);
                      const formattedDate = formatDateFormatted(
                        item.tanggalPengerjaan,
                      );
                      const rowNumber = startReportIndex + index + 1;
                      const isEven = index % 2 === 1;

                      return (
                        <tr
                          key={item.id || index}
                          onClick={() => setViewingReport(item)}
                          className={`transition-colors cursor-pointer hover:bg-emerald-50/40 ${
                            isEven ? "bg-slate-50/40" : "bg-white"
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
                          {selectedReportCategory === "Semua" && (
                            <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {item.category}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-slate-700 border-r border-slate-100">
                            <p className="line-clamp-2 leading-relaxed">
                              {item.deskripsiPermohonan}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                                item.metodePenanganan === "Visit"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : item.metodePenanganan === "Remote"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.metodePenanganan || "Guide"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium border-r border-slate-100">
                            <p className="line-clamp-2 leading-relaxed">
                              {item.solusiIssue}
                            </p>
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
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                  Menampilkan <strong>{startReportIndex + 1}</strong>-
                  <strong>{endReportIndex}</strong> dari{" "}
                  <strong className="text-pegadaian-800">
                    {totalReportItems}
                  </strong>{" "}
                  Data Laporan
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
                    onClick={() =>
                      setReportCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={reportCurrentPage === 1}
                    className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    {reportCurrentPage} / {totalReportPages}
                  </span>
                  <button
                    onClick={() =>
                      setReportCurrentPage((p) =>
                        Math.min(totalReportPages, p + 1),
                      )
                    }
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

);
