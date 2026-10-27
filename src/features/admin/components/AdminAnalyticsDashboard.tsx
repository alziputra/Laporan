"use client";

import React from "react";
import {
  Activity,
  Award,
  BarChart3,
  Building,
  Building2,
  Calendar,
  FileSpreadsheet,
  FolderKanban,
  Laptop,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { UserProfile, KANWIL_LIST } from "@/features/auth/types/user";
import { DailyReport } from "@/features/reports/types/report";
import { CATEGORY_ITEMS } from "@/features/admin/components/adminConstants";

type AnalyticsPreset = "all" | "cycle13" | "cycle13_next" | "cycle21" | "month" | "today" | "custom";
type AnalyticsPresetOption = Exclude<AnalyticsPreset, "custom">;
type AdminTab = "users" | "reports" | "analytics";

interface AdminCycleData {
  c1Count: number;
  c1Label: string;
  c2Count: number;
  c2Label: string;
  c21Count: number;
  c21Label: string;
  monthCount: number;
}

interface AnalyticsMethodSummary {
  visitCount: number;
  visitPct: number;
  remoteCount: number;
  remotePct: number;
  guideCount: number;
  guidePct: number;
  dominantMethod: string;
  dominantCount: number;
  dominantPct: number;
}

interface AdminAnalyticsDashboardProps {
  adminCycleData: AdminCycleData;
  allReports: DailyReport[];
  analyticsActivePreset: AnalyticsPreset;
  analyticsEndDate: string;
  analyticsFilteredReports: DailyReport[];
  analyticsMethodSummary: AnalyticsMethodSummary;
  analyticsOverallSla: { avgMinutes: number; formatted: string };
  analyticsSelectedCategory: string;
  analyticsSelectedKanwil: string;
  analyticsStartDate: string;
  analyticsTopKanwilRanking: { kanwilName: string; total: number }[];
  analyticsTopOfficer: { name: string; kanwil: string; count: number };
  analyticsTopUnitKerja: { name: string; count: number };
  analyticsWeekdayDistribution: { label: string; day: number; count: number }[];
  handleAnalyticsPreset: (preset: AnalyticsPresetOption) => void;
  handleDrillDownFromAnalytics: (kanwil: string, category?: string) => void;
  isReportMatchingUser: (report: DailyReport, user: UserProfile) => boolean;
  maxWeekdayCount: number;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>>;
  setAnalyticsActivePreset: React.Dispatch<React.SetStateAction<AnalyticsPreset>>;
  setAnalyticsEndDate: React.Dispatch<React.SetStateAction<string>>;
  setAnalyticsSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  setAnalyticsSelectedKanwil: React.Dispatch<React.SetStateAction<string>>;
  setAnalyticsStartDate: React.Dispatch<React.SetStateAction<string>>;
  setReportActivePreset: React.Dispatch<React.SetStateAction<AnalyticsPreset>>;
  setReportEndDate: React.Dispatch<React.SetStateAction<string>>;
  setReportStartDate: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportCategory: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportKanwil: React.Dispatch<React.SetStateAction<string>>;
  setSelectedReportUser: React.Dispatch<React.SetStateAction<string>>;
  topCategorySummary: { name: string; label: string; count: number };
  topKanwilSummary: { kanwilName: string; total: number };
  users: UserProfile[];
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  adminCycleData,
  allReports,
  analyticsActivePreset,
  analyticsEndDate,
  analyticsFilteredReports,
  analyticsMethodSummary,
  analyticsOverallSla,
  analyticsSelectedCategory,
  analyticsSelectedKanwil,
  analyticsStartDate,
  analyticsTopKanwilRanking,
  analyticsTopOfficer,
  analyticsTopUnitKerja,
  analyticsWeekdayDistribution,
  handleAnalyticsPreset,
  handleDrillDownFromAnalytics,
  isReportMatchingUser,
  maxWeekdayCount,
  setActiveTab,
  setAnalyticsActivePreset,
  setAnalyticsEndDate,
  setAnalyticsSelectedCategory,
  setAnalyticsSelectedKanwil,
  setAnalyticsStartDate,
  setReportActivePreset,
  setReportEndDate,
  setReportStartDate,
  setSelectedReportCategory,
  setSelectedReportKanwil,
  setSelectedReportUser,
  topCategorySummary,
  topKanwilSummary,
  users,
}) => (
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
                    Filter periode cut-off & periksa sebaran pengerjaan tiket
                    per kategori di setiap Kantor Wilayah
                  </p>
                </div>
              </div>

              {/* Reset analytics button */}
              {(analyticsActivePreset !== "all" ||
                analyticsStartDate ||
                analyticsEndDate ||
                analyticsSelectedKanwil !== "Semua" ||
                analyticsSelectedCategory !== "Semua") && (
                <button
                  type="button"
                  onClick={() => {
                    handleAnalyticsPreset("all");
                    setAnalyticsSelectedKanwil("Semua");
                    setAnalyticsSelectedCategory("Semua");
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
                onClick={() => handleAnalyticsPreset("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === "all" &&
                  !analyticsStartDate &&
                  !analyticsEndDate
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                Semua Data ({allReports.length})
              </button>

              {/* Preset: 13 Lalu - 12 Ini */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset("cycle13")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsActivePreset === "cycle13"
                    ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/30"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>13 Lalu - 12 Ini</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === "cycle13" ? "bg-white/20 text-white" : "bg-emerald-200/70 text-emerald-900"}`}
                >
                  {adminCycleData.c1Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal">
                  ({adminCycleData.c1Label})
                </span>
              </button>

              {/* Preset: 13 Ini - 12 Depan */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset("cycle13_next")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsActivePreset === "cycle13_next"
                    ? "bg-teal-700 text-white shadow-xs ring-2 ring-teal-400/30"
                    : "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>13 Ini - 12 Depan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === "cycle13_next" ? "bg-white/20 text-white" : "bg-teal-200/70 text-teal-900"}`}
                >
                  {adminCycleData.c2Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal">
                  ({adminCycleData.c2Label})
                </span>
              </button>

              {/* Preset: Siklus 21 */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset("cycle21")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === "cycle21"
                    ? "bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400/30"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                }`}
              >
                <span>Siklus 21</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === "cycle21" ? "bg-white/20 text-white" : "bg-indigo-200/70 text-indigo-900"}`}
                >
                  {adminCycleData.c21Count}
                </span>
                <span className="opacity-75 text-[10px] font-normal ml-1">
                  ({adminCycleData.c21Label})
                </span>
              </button>

              {/* Preset: Bulan Ini */}
              <button
                type="button"
                onClick={() => handleAnalyticsPreset("month")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  analyticsActivePreset === "month"
                    ? "bg-purple-700 text-white shadow-xs ring-2 ring-purple-400/30"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                <span>Bulan Kalender Ini</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md font-mono ${analyticsActivePreset === "month" ? "bg-white/20 text-white" : "bg-purple-200/70 text-purple-900"}`}
                >
                  {adminCycleData.monthCount}
                </span>
              </button>
            </div>

            {/* Secondary Filter Row: Custom Date Pickers & Scope Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Custom Date Range */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 pl-2">
                  Dari:
                </span>
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => {
                    setAnalyticsStartDate(e.target.value);
                    setAnalyticsActivePreset("custom");
                  }}
                  className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-bold text-slate-500">
                  s/d
                </span>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => {
                    setAnalyticsEndDate(e.target.value);
                    setAnalyticsActivePreset("custom");
                  }}
                  className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {(analyticsStartDate || analyticsEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnalyticsStartDate("");
                      setAnalyticsEndDate("");
                      setAnalyticsActivePreset("all");
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
                  analyticsSelectedKanwil !== "Semua"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50"
                    : "border-slate-200 text-slate-700"
                }`}
              >
                <option value="Semua">Semua Kantor Wilayah (12)</option>
                {KANWIL_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              {/* Filter Kategori Dropdown */}
              <select
                value={analyticsSelectedCategory}
                onChange={(e) => setAnalyticsSelectedCategory(e.target.value)}
                className={`px-3 py-1.5 bg-white rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pegadaian-500 cursor-pointer ${
                  analyticsSelectedCategory !== "Semua"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300/50"
                    : "border-slate-200 text-slate-700"
                }`}
              >
                <option value="Semua">Semua Kategori Pekerjaan</option>
                {CATEGORY_ITEMS.filter((c) => c.name !== "Semua").map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="ml-auto text-xs text-slate-500 font-semibold">
                Terfilter:{" "}
                <strong className="text-emerald-700 font-black">
                  {analyticsFilteredReports.length}
                </strong>{" "}
                dari {allReports.length} Laporan
              </div>
            </div>
          </div>

          {/* 8 Executive KPI Command Center Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Laporan Periode Terpilih */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Laporan
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {analyticsFilteredReports.length}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold truncate mt-0.5">
                  {analyticsActivePreset === "cycle13"
                    ? "Siklus 13 Lalu"
                    : analyticsActivePreset === "cycle13_next"
                      ? "Siklus 13 Ini"
                      : analyticsActivePreset === "cycle21"
                        ? "Siklus 21"
                        : analyticsActivePreset === "month"
                          ? "Bulan Ini"
                          : analyticsStartDate
                            ? "Custom Range"
                            : "Seluruh Riwayat"}
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
                  onClick={() => handleAnalyticsPreset("cycle13")}
                  className="text-left p-1 rounded-lg hover:bg-emerald-100/60 transition-all cursor-pointer"
                >
                  <p className="text-[9px] font-bold text-emerald-700 leading-tight">
                    13 Lalu-12 Ini
                  </p>
                  <p className="text-base sm:text-lg font-black text-emerald-900">
                    {adminCycleData.c1Count}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnalyticsPreset("cycle13_next")}
                  className="text-left p-1 rounded-lg hover:bg-teal-100/60 transition-all cursor-pointer border-l border-emerald-200/60 pl-2"
                >
                  <p className="text-[9px] font-bold text-teal-700 leading-tight">
                    13 Ini-12 Dpn
                  </p>
                  <p className="text-base sm:text-lg font-black text-teal-900">
                    {adminCycleData.c2Count}
                  </p>
                </button>
              </div>
            </div>

            {/* Card 3: Kategori Dominan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kategori Terbanyak
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3
                  className="text-base sm:text-lg font-black text-slate-800 truncate"
                  title={topCategorySummary.name}
                >
                  {topCategorySummary.label}
                </h3>
                <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                  {topCategorySummary.count} Laporan (
                  {analyticsFilteredReports.length > 0
                    ? Math.round(
                        (topCategorySummary.count /
                          analyticsFilteredReports.length) *
                          100,
                      )
                    : 0}
                  %)
                </p>
              </div>
            </div>

            {/* Card 4: Kanwil Teraktif */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kanwil Teraktif
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3
                  className="text-base sm:text-lg font-black text-purple-900 truncate"
                  title={topKanwilSummary.kanwilName}
                >
                  {topKanwilSummary.kanwilName}
                </h3>
                <p className="text-[11px] text-purple-600 font-bold mt-0.5">
                  {topKanwilSummary.total} Laporan (
                  {analyticsFilteredReports.length > 0
                    ? Math.round(
                        (topKanwilSummary.total /
                          analyticsFilteredReports.length) *
                          100,
                      )
                    : 0}
                  % Nasional)
                </p>
              </div>
            </div>

            {/* Card 5: SLA Rata-rata Nasional */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rata-Rata SLA
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
                  {analyticsOverallSla.formatted}
                </h3>
                <p className="text-[11px] text-teal-600 font-bold mt-0.5">
                  {analyticsOverallSla.avgMinutes <= 15
                    ? "⚡ Kinerja Sangat Cepat"
                    : "Resolusi Terjaga"}
                </p>
              </div>
            </div>

            {/* Card 6: Metode Penanganan Dominan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Metode Penanganan
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {analyticsMethodSummary.dominantMethod} (
                    {analyticsMethodSummary.dominantPct}%)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-500">
                  <span className="text-blue-700">
                    Visit {analyticsMethodSummary.visitCount}
                  </span>
                  <span>•</span>
                  <span className="text-purple-700">
                    Remote {analyticsMethodSummary.remoteCount}
                  </span>
                  <span>•</span>
                  <span className="text-amber-700">
                    Guide {analyticsMethodSummary.guideCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 7: Top Officer IT Support */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Top Petugas IT
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3
                  className="text-sm sm:text-base font-black text-slate-800 truncate"
                  title={analyticsTopOfficer.name}
                >
                  {analyticsTopOfficer.name}
                </h3>
                <p className="text-[11px] text-amber-700 font-bold mt-0.5 truncate">
                  {analyticsTopOfficer.count} Laporan (
                  {analyticsTopOfficer.kanwil})
                </p>
              </div>
            </div>

            {/* Card 8: Top Unit Kerja / Cabang Terbanyak */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Unit Kerja Terbanyak
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <h3
                  className="text-sm sm:text-base font-black text-slate-800 truncate"
                  title={analyticsTopUnitKerja.name}
                >
                  {analyticsTopUnitKerja.name}
                </h3>
                <p className="text-[11px] text-rose-700 font-bold mt-0.5 truncate">
                  {analyticsTopUnitKerja.count} Tiket Dilayani
                </p>
              </div>
            </div>
          </div>

          {/* Activity Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Kanwil dengan Aktivitas Tertinggi
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      5 Kanwil dengan laporan terbanyak pada filter aktif
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  {analyticsFilteredReports.length} laporan
                </span>
              </div>

              {analyticsTopKanwilRanking.length > 0 ? (
                <div className="mt-5 space-y-3.5">
                  {analyticsTopKanwilRanking.map((item, index) => {
                    const maxCount = analyticsTopKanwilRanking[0].total;
                    const share =
                      analyticsFilteredReports.length > 0
                        ? Math.round(
                            (item.total / analyticsFilteredReports.length) *
                              100,
                          )
                        : 0;

                    return (
                      <button
                        key={item.kanwilName}
                        type="button"
                        disabled={
                          !KANWIL_LIST.some(
                            (kanwil) => kanwil === item.kanwilName,
                          )
                        }
                        onClick={() =>
                          handleDrillDownFromAnalytics(item.kanwilName)
                        }
                        className="group w-full text-left rounded-xl px-2 py-1.5 -mx-2 hover:bg-emerald-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={
                          KANWIL_LIST.some(
                            (kanwil) => kanwil === item.kanwilName,
                          )
                            ? `Lihat ${item.total} laporan ${item.kanwilName}`
                            : "Kanwil ini belum dapat difilter"
                        }
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="min-w-0 flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                              {index + 1}
                            </span>
                            <span className="truncate">{item.kanwilName}</span>
                          </span>
                          <span className="shrink-0 font-mono text-xs font-extrabold text-slate-700">
                            {item.total}
                            <span className="ml-1.5 text-[10px] font-semibold text-slate-400">
                              {share}%
                            </span>
                          </span>
                        </div>
                        <div className="ml-7 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                            style={{
                              width: `${Math.round((item.total / maxCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-slate-400">
                  Belum ada laporan pada filter ini.
                </div>
              )}
            </section>

            <section className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Aktivitas per Hari
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pola jumlah laporan menurut hari pengerjaan
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                  {analyticsFilteredReports.length} laporan
                </span>
              </div>

              <div
                className="mt-5 grid h-40 grid-cols-7 gap-2 border-b border-slate-200 px-1"
                role="img"
                aria-label="Grafik jumlah laporan berdasarkan hari pengerjaan"
              >
                {analyticsWeekdayDistribution.map((item) => {
                  const height =
                    item.count > 0
                      ? Math.max(
                          6,
                          Math.round((item.count / maxWeekdayCount) * 100),
                        )
                      : 0;

                  return (
                    <div
                      key={item.label}
                      className="flex min-w-0 flex-col items-center justify-end gap-2"
                      title={`${item.count} laporan pada hari ${item.label}`}
                    >
                      <span className="text-[10px] font-bold text-slate-500">
                        {item.count}
                      </span>
                      <div className="flex h-28 w-full items-end justify-center">
                        <div
                          className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${
                            item.count > 0
                              ? "bg-gradient-to-t from-indigo-600 to-violet-400"
                              : "bg-slate-100"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="pb-2 text-[10px] font-bold text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                Grafik mengikuti periode, Kanwil, dan kategori yang dipilih.
              </p>
            </section>
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
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Sebaran Kategori Issue
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Pekerjaan terbanyak dilaporkan
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {CATEGORY_ITEMS.filter((c) => c.name !== "Semua").map((cat) => {
                  const count = analyticsFilteredReports.filter(
                    (r) => r.category === cat.name,
                  ).length;
                  const pct =
                    analyticsFilteredReports.length > 0
                      ? Math.round(
                          (count / analyticsFilteredReports.length) * 100,
                        )
                      : 0;
                  return (
                    <div
                      key={cat.name}
                      onClick={() =>
                        handleDrillDownFromAnalytics(
                          analyticsSelectedKanwil,
                          cat.name,
                        )
                      }
                      className="space-y-1 p-1.5 -mx-1.5 rounded-xl hover:bg-emerald-50/50 cursor-pointer transition-all"
                      title={`Klik untuk filter laporan kategori ${cat.label}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          {cat.label}
                        </span>
                        <span className="font-mono text-slate-500 font-semibold">
                          {count} ({pct}%)
                        </span>
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
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Distribusi Kecepatan SLA
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Standar respons penanganan masalah
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900">
                      ⚡ Super Cepat (&lt; 5 Menit)
                    </span>
                    <p className="text-[11px] text-emerald-700">
                      Resolusi langsung
                    </p>
                  </div>
                  <span className="text-base font-black text-emerald-800">
                    {
                      analyticsFilteredReports.filter((r) => {
                        if (!r.waktuMulai || !r.waktuSelesai) return false;
                        const [sh, sm] = r.waktuMulai.split(":").map(Number);
                        const [eh, em] = r.waktuSelesai.split(":").map(Number);
                        let diff = eh * 60 + em - (sh * 60 + sm);
                        if (diff < 0) diff += 1440;
                        return diff <= 5;
                      }).length
                    }{" "}
                    Laporan
                  </span>
                </div>

                <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-teal-900">
                      Standar (5 - 15 Menit)
                    </span>
                    <p className="text-[11px] text-teal-700">
                      Penanganan software / konfigurasi
                    </p>
                  </div>
                  <span className="text-base font-black text-teal-800">
                    {
                      analyticsFilteredReports.filter((r) => {
                        if (!r.waktuMulai || !r.waktuSelesai) return false;
                        const [sh, sm] = r.waktuMulai.split(":").map(Number);
                        const [eh, em] = r.waktuSelesai.split(":").map(Number);
                        let diff = eh * 60 + em - (sh * 60 + sm);
                        if (diff < 0) diff += 1440;
                        return diff > 5 && diff <= 15;
                      }).length
                    }{" "}
                    Laporan
                  </span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-amber-900">
                      Kompleks (&gt; 15 Menit)
                    </span>
                    <p className="text-[11px] text-amber-700">
                      Hardware / Relokasi / Jaringan
                    </p>
                  </div>
                  <span className="text-base font-black text-amber-800">
                    {
                      analyticsFilteredReports.filter((r) => {
                        if (!r.waktuMulai || !r.waktuSelesai) return false;
                        const [sh, sm] = r.waktuMulai.split(":").map(Number);
                        const [eh, em] = r.waktuSelesai.split(":").map(Number);
                        let diff = eh * 60 + em - (sh * 60 + sm);
                        if (diff < 0) diff += 1440;
                        return diff > 15;
                      }).length
                    }{" "}
                    Laporan
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
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    Aktivitas Personil IT Support
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Total pekerjaan tercatat pada periode ini
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {users
                  .filter((u) => u.role !== "Admin" && u.role !== "Super Admin")
                  .filter(
                    (u) =>
                      analyticsSelectedKanwil === "Semua" ||
                      u.kanwil === analyticsSelectedKanwil,
                  )
                  .map((u) => ({
                    ...u,
                    ticketCount: analyticsFilteredReports.filter((r) =>
                      isReportMatchingUser(r, u),
                    ).length,
                  }))
                  .sort((a, b) => b.ticketCount - a.ticketCount)
                  .map((u, i) => {
                    return (
                      <div
                        key={u.uid}
                        onClick={() => {
                          setSelectedReportUser(u.displayName || u.email);
                          setSelectedReportKanwil(u.kanwil || "Semua");
                          setSelectedReportCategory("Semua");
                          setReportStartDate(analyticsStartDate);
                          setReportEndDate(analyticsEndDate);
                          setReportActivePreset(analyticsActivePreset);
                          setActiveTab("reports");
                        }}
                        className="flex items-center justify-between pt-2 text-xs hover:bg-slate-50 p-1 rounded-lg cursor-pointer transition-all"
                        title={`Klik untuk lihat laporan petugas ${u.displayName}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {u.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {u.kanwil || "Kanwil VIII"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                            u.ticketCount > 0
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : "text-slate-400 bg-slate-50 border-slate-200"
                          }`}
                        >
                          {u.ticketCount} Laporan
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

);
