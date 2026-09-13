import { DailyReport, MetodePenanganan } from '@/types/report';

export type ChronicIssueType = 
  | 'fsck_os' 
  | 'network_cable' 
  | 'printer' 
  | 'app_cache' 
  | 'high_frequency';

export type SeverityLevel = 'critical' | 'high' | 'medium';

export interface UnitActionRecommendation {
  id: string;
  unitKerja: string;
  issueType: ChronicIssueType;
  issueTitle: string;
  frequency: number;
  severity: SeverityLevel;
  recommendedAction: string;
  suggestedMethod: MetodePenanganan;
  reason: string;
  relatedReports: DailyReport[];
  latestReportDate: string;
}

export interface ChronicUnitsSummary {
  totalUnitsNeedingAction: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  recommendations: UnitActionRecommendation[];
}

/**
 * Normalisasi nama unit kerja untuk pencocokan yang konsisten
 */
export function normalizeUnitName(unit: string): string {
  if (!unit) return 'Tanpa Unit Kerja';
  return unit.trim().replace(/\s+/g, ' ');
}

/**
 * Memeriksa apakah teks laporan mengandung kata kunci kendala FSCK / OS
 */
function isFsckOrOsIssue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('fsck') ||
    t.includes('file system') ||
    t.includes('filesystem') ||
    t.includes('initramfs') ||
    t.includes('bad block') ||
    t.includes('gagal boot') ||
    t.includes('cannot boot') ||
    t.includes('reboot berulang') ||
    t.includes('booting loop') ||
    (t.includes('lemot') && (t.includes('os') || t.includes('ubuntu') || t.includes('hang')))
  );
}

/**
 * Memeriksa apakah teks laporan mengandung kata kunci kendala kabel / jaringan fisik
 */
function isNetworkCableIssue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (t.includes('kabel') && (t.includes('lan') || t.includes('jaring') || t.includes('rj45') || t.includes('lepas') || t.includes('putus') || t.includes('colok'))) ||
    t.includes('lan putus') ||
    t.includes('jaringan putus') ||
    t.includes('port switch') ||
    t.includes('rto') ||
    t.includes('crimping') ||
    t.includes('network cable unplugged') ||
    (t.includes('tidak konek') && (t.includes('lan') || t.includes('kabel')))
  );
}

/**
 * Memeriksa apakah teks laporan mengandung kata kunci kendala Printer / Driver
 */
function isPrinterIssue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('printer') ||
    t.includes('ngeprint') ||
    t.includes('l5290') ||
    t.includes('epson') ||
    t.includes('lp0') ||
    t.includes('lp1') ||
    t.includes('spooler') ||
    t.includes('sharing printer') ||
    t.includes('driver printer') ||
    (t.includes('cetak') && (t.includes('hasil') || t.includes('tidak bisa')))
  );
}

/**
 * Memeriksa apakah teks laporan mengandung kata kunci kendala Web / Browser / Keyring
 */
function isAppCacheIssue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('keyring') ||
    t.includes('sprint muter') ||
    t.includes('eform') ||
    t.includes('bjdpl') ||
    (t.includes('chrome') && (t.includes('tidak bisa') || t.includes('muter') || t.includes('cache'))) ||
    t.includes('clear cache')
  );
}

/**
 * Menganalisis seluruh riwayat laporan dan mendeteksi unit kerja yang memerlukan tindakan korektif / preventif
 */
export function analyzeChronicIssues(reports: DailyReport[]): ChronicUnitsSummary {
  if (!reports || reports.length === 0) {
    return {
      totalUnitsNeedingAction: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      recommendations: []
    };
  }

  // 1. Kelompokkan laporan berdasarkan Unit Kerja
  const unitMap = new Map<string, DailyReport[]>();

  reports.forEach((report) => {
    const rawUnit = report.unitKerja?.trim();
    if (!rawUnit) return;
    const unitName = normalizeUnitName(rawUnit);
    const existing = unitMap.get(unitName) || [];
    existing.push(report);
    unitMap.set(unitName, existing);
  });

  const recommendations: UnitActionRecommendation[] = [];

  // 2. Analisis setiap unit kerja berdasarkan pola kendala
  unitMap.forEach((unitReports, unitName) => {
    // Urutkan laporan unit dari yang terbaru
    const sortedUnitReports = [...unitReports].sort((a, b) => 
      (b.tanggalPengerjaan || '').localeCompare(a.tanggalPengerjaan || '')
    );
    const latestDate = sortedUnitReports[0]?.tanggalPengerjaan || '';

    // A. Analisis FSCK / OS Corrupt
    const fsckReports = sortedUnitReports.filter((r) => {
      const fullText = `${r.deskripsiPermohonan || ''} ${r.solusiIssue || ''}`;
      return isFsckOrOsIssue(fullText);
    });

    if (fsckReports.length >= 2) {
      recommendations.push({
        id: `action-${unitName}-fsck`,
        unitKerja: unitName,
        issueType: 'fsck_os',
        issueTitle: 'Kendala File System (FSCK) / OS Rusak Berulang',
        frequency: fsckReports.length,
        severity: fsckReports.length >= 3 ? 'critical' : 'high',
        recommendedAction: 'Jadwalkan Segera Install Ulang OS Linux Bersih & Pengecekan Storage SSD/HDD',
        suggestedMethod: 'Visit',
        reason: `Unit kerja ini sudah ${fsckReports.length}x mengalami masalah filesystem (fsck). Perbaikan sementara via terminal berulang kali membuktikan adanya kerusakan file sistem permanen atau bad sector disk.`,
        relatedReports: fsckReports,
        latestReportDate: fsckReports[0]?.tanggalPengerjaan || latestDate
      });
    }

    // B. Analisis Kabel Jaringan / Port LAN
    const cableReports = sortedUnitReports.filter((r) => {
      const fullText = `${r.deskripsiPermohonan || ''} ${r.solusiIssue || ''}`;
      return isNetworkCableIssue(fullText);
    });

    if (cableReports.length >= 2) {
      recommendations.push({
        id: `action-${unitName}-network`,
        unitKerja: unitName,
        issueType: 'network_cable',
        issueTitle: 'Kabel LAN / Port Jaringan Sering Putus',
        frequency: cableReports.length,
        severity: 'high',
        recommendedAction: 'Wajib Jadwalkan VISIT Onsite untuk Cek Fisik Kabel, Crimping Ulang RJ45 & Tes Port Switch',
        suggestedMethod: 'Visit',
        reason: `Koneksi fisik jaringan di unit ini bermasalah ${cableReports.length}x. Panduan remote tidak lagi efektif; dibutuhkan inspeksi fisik kabel UTP dan penggantian konektor onsite.`,
        relatedReports: cableReports,
        latestReportDate: cableReports[0]?.tanggalPengerjaan || latestDate
      });
    }

    // C. Analisis Printer & Driver
    const printerReports = sortedUnitReports.filter((r) => {
      const fullText = `${r.deskripsiPermohonan || ''} ${r.solusiIssue || ''}`;
      return isPrinterIssue(fullText);
    });

    if (printerReports.length >= 3) {
      recommendations.push({
        id: `action-${unitName}-printer`,
        unitKerja: unitName,
        issueType: 'printer',
        issueTitle: 'Printer Sering Error / Gagal Cetak Berulang',
        frequency: printerReports.length,
        severity: 'medium',
        recommendedAction: 'Standarisasi Driver Printer Lokal, Ganti Kabel USB, atau Jadwalkan Servis Perangkat',
        suggestedMethod: 'Visit',
        reason: `Printer di unit ini tercatat sudah ${printerReports.length}x mengalami gangguan. Perlu standarisasi mapping port USB atau pengecekan hardware oleh teknisi printer.`,
        relatedReports: printerReports,
        latestReportDate: printerReports[0]?.tanggalPengerjaan || latestDate
      });
    }

    // D. Analisis Web Cache & Keyring
    const appCacheReports = sortedUnitReports.filter((r) => {
      const fullText = `${r.deskripsiPermohonan || ''} ${r.solusiIssue || ''}`;
      return isAppCacheIssue(fullText);
    });

    if (appCacheReports.length >= 3) {
      recommendations.push({
        id: `action-${unitName}-cache`,
        unitKerja: unitName,
        issueType: 'app_cache',
        issueTitle: 'Sesi Aplikasi Sprint / Browser Keyring Sering Error',
        frequency: appCacheReports.length,
        severity: 'medium',
        recommendedAction: 'Reset Total Profil Google Chrome / Keyring & Buatkan Prosedur Panduan ke Kasir',
        suggestedMethod: 'Remote',
        reason: `User kasir/pengelola unit ini sering terkendala sesi/keyring (${appCacheReports.length}x). Disarankan perbaikan profil tuntas dan berikan cheat sheet panduan operasional.`,
        relatedReports: appCacheReports,
        latestReportDate: appCacheReports[0]?.tanggalPengerjaan || latestDate
      });
    }

    // E. Analisis Hotspot Unit (Volume Tiket Tinggi Total >= 5)
    // Hanya tambahkan jika unit belum memiliki alert kritis lain
    const alreadyHasAlert = recommendations.some((rec) => rec.unitKerja === unitName);
    if (!alreadyHasAlert && unitReports.length >= 5) {
      recommendations.push({
        id: `action-${unitName}-volume`,
        unitKerja: unitName,
        issueType: 'high_frequency',
        issueTitle: 'Unit Hotspot (Volume Keluhan Sangat Tinggi)',
        frequency: unitReports.length,
        severity: 'medium',
        recommendedAction: 'Jadwalkan Kunjungan Preventive Maintenance Menyeluruh di Unit Ini',
        suggestedMethod: 'Visit',
        reason: `Unit ini tercatat telah ${unitReports.length}x menghubungi MS Kanwil. Tingginya frekuensi keluhan menandakan perlunya pemeliharaan menyeluruh pada PC dan jaringan unit.`,
        relatedReports: sortedUnitReports.slice(0, 5),
        latestReportDate: latestDate
      });
    }
  });

  // 3. Urutkan rekomendasi dari yang paling kritis (critical -> high -> medium) lalu frekuensi tertinggi
  const severityScore = { critical: 3, high: 2, medium: 1 };
  recommendations.sort((a, b) => {
    const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
    if (scoreDiff !== 0) return scoreDiff;
    return b.frequency - a.frequency;
  });

  // Hitung jumlah unit unik yang membutuhkan tindakan
  const uniqueUnits = new Set(recommendations.map((r) => r.unitKerja));

  return {
    totalUnitsNeedingAction: uniqueUnits.size,
    criticalCount: recommendations.filter((r) => r.severity === 'critical').length,
    highCount: recommendations.filter((r) => r.severity === 'high').length,
    mediumCount: recommendations.filter((r) => r.severity === 'medium').length,
    recommendations
  };
}
