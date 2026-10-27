"use client";

import React from "react";
import {
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Search,
} from "lucide-react";

export type MatrixSortField =
  | "total"
  | "name"
  | "hardware"
  | "software"
  | "network"
  | "sla";

interface MatrixRow {
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
}

interface MatrixSummary {
  officersCount: number;
  total: number;
  hardwareCount: number;
  softwareCount: number;
  networkCount: number;
  meetingCount: number;
  malwareCount: number;
  relokasiCount: number;
  lainnyaCount: number;
}

interface AdminAnalyticsMatrixProps {
  filteredAndSortedMatrix: MatrixRow[];
  matrixSearchQuery: string;
  setMatrixSearchQuery: (value: string) => void;
  matrixSortField: MatrixSortField;
  setMatrixSortField: (value: MatrixSortField) => void;
  matrixSortAsc: boolean;
  setMatrixSortAsc: (value: boolean) => void;
  matrixSummary: MatrixSummary;
  analyticsOverallSla: { formatted: string };
  handleDrillDownFromAnalytics: (kanwil: string, category?: string) => void;
}

export const AdminAnalyticsMatrix: React.FC<AdminAnalyticsMatrixProps> = ({
  filteredAndSortedMatrix,
  matrixSearchQuery,
  setMatrixSearchQuery,
  matrixSortField,
  setMatrixSortField,
  matrixSortAsc,
  setMatrixSortAsc,
  matrixSummary,
  analyticsOverallSla,
  handleDrillDownFromAnalytics,
}) => (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Matrix Header & Tools */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pegadaian-700" />
              Matriks Monitoring Pengerjaan Seluruh Kanwil per Kategori
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Klik pada angka kategori atau kanwil untuk langsung melihat daftar
              laporan detail di Tab Laporan.
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
              onChange={(e) =>
                setMatrixSortField(e.target.value as MatrixSortField)
              }
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
              title={
                matrixSortAsc
                  ? "Urutan Naik (Ascending)"
                  : "Urutan Turun (Descending)"
              }
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
                <th className="py-3 px-3 w-10 text-center border-r border-slate-700/60">
                  No
                </th>
                <th className="py-3 px-4 min-w-[170px] border-r border-slate-700/60">
                  Kantor Wilayah
                </th>
                <th
                  className="py-3 px-2 w-14 text-center border-r border-slate-700/60"
                  title="Petugas IT Terdaftar"
                >
                  PIC
                </th>
                <th className="py-3 px-3 min-w-[90px] text-center border-r border-slate-700/60 bg-emerald-950/60 text-emerald-300">
                  Total Laporan
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">
                  Hardware
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">
                  Software
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">
                  Network
                </th>
                <th className="py-3 px-2.5 min-w-[90px] text-center border-r border-slate-700/60">
                  Meeting/VC
                </th>
                <th className="py-3 px-2.5 min-w-[80px] text-center border-r border-slate-700/60">
                  Malware
                </th>
                <th className="py-3 px-2.5 min-w-[85px] text-center border-r border-slate-700/60">
                  Relokasi
                </th>
                <th className="py-3 px-2.5 min-w-[75px] text-center border-r border-slate-700/60">
                  Lainnya
                </th>
                <th className="py-3 px-3 min-w-[85px] text-center border-r border-slate-700/60">
                  Avg SLA
                </th>
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
                  const isTopVolume =
                    idx === 0 && matrixSortField === "total" && !matrixSortAsc;
                  return (
                    <tr
                      key={item.kanwilName}
                      className={`transition-colors hover:bg-slate-50/80 ${idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold">
                            {item.kanwilName}
                          </span>
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Semua",
                            )
                          }
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            item.total > 0
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:scale-105"
                              : "bg-slate-100 text-slate-400"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Hardware Kanwil",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.hardwareCount > 0
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Software Kanwil",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.softwareCount > 0
                              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Network/Jaringan",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.networkCount > 0
                              ? "bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Video Confference & Meeting",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.meetingCount > 0
                              ? "bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Malware",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.malwareCount > 0
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Relokasi/Renovasi",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.relokasiCount > 0
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Lainnya",
                            )
                          }
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            item.lainnyaCount > 0
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-700 hover:text-white border border-slate-200 cursor-pointer"
                              : "text-slate-300 font-normal cursor-default"
                          }`}
                          title={`${item.lainnyaCount} Laporan Lainnya - Klik untuk filter`}
                        >
                          {item.lainnyaCount}
                        </button>
                      </td>

                      {/* SLA Column */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 font-mono font-bold">
                        {item.total > 0 ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                              item.avgMinutes <= 15
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : item.avgMinutes <= 30
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
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
                          onClick={() =>
                            handleDrillDownFromAnalytics(
                              item.kanwilName,
                              "Semua",
                            )
                          }
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
                <td
                  colSpan={2}
                  className="py-3.5 px-4 text-right uppercase tracking-wider text-emerald-400"
                >
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
                    onClick={() =>
                      handleDrillDownFromAnalytics("Semua", "Semua")
                    }
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

);
