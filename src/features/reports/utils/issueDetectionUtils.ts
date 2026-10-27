import { DailyReport, ReportCategory, MetodePenanganan } from '@/types/report';

export interface DetectedIssue {
  id: string;
  title: string;
  category: ReportCategory;
  deskripsi: string;
  solusi: string;
  metodePenanganan: MetodePenanganan;
  frequency: number; // Berapa kali masalah ini pernah terjadi di riwayat laporan nyata
  lastReportedDate: string; // Tanggal pengerjaan terakhir
  commonUnits: string[]; // Unit kerja/cabang yang sering mengalami
  recentReportIds: string[];
  isCustom?: boolean;
}

/**
 * Normalisasi teks untuk pengelompokan kemiripan (membersihkan spasi, tanda baca, huruf kecil)
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menghitung kemiripan kata sederhana (Jaccard similarity of words)
 */
function calculateTextSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeText(str1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeText(str2).split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  const unionSet = new Set<string>();
  
  words1.forEach(w => {
    unionSet.add(w);
    if (words2.has(w)) intersection++;
  });
  
  words2.forEach(w => {
    unionSet.add(w);
  });

  const union = unionSet.size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Menghasilkan judul ringkas dari deskripsi masalah
 */
function generateTitleFromDescription(deskripsi: string): string {
  const clean = deskripsi.trim().replace(/\n/g, ' ');
  if (clean.length <= 45) return clean;
  // Ambil kalimat pertama atau 45 karakter pertama
  const firstSentence = clean.split(/[.,;]/)[0];
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence.trim();
  }
  return clean.substring(0, 42).trim() + '...';
}

/**
 * Normalisasi string kategori agar selalu cocok dengan ReportCategory resmi
 */
export function normalizeCategory(cat: string | undefined): ReportCategory {
  if (!cat) return 'Lainnya';
  const c = cat.toLowerCase().trim();
  if (c.includes('hard')) return 'Hardware Kanwil';
  if (c.includes('soft')) return 'Software Kanwil';
  if (c.includes('net') || c.includes('jaring')) return 'Network/Jaringan';
  if (c.includes('video') || c.includes('meet') || c.includes('vc')) return 'Video Confference & Meeting';
  if (c.includes('malware') || c.includes('virus') || c.includes('secur')) return 'Malware';
  if (c.includes('relo') || c.includes('reno')) return 'Relokasi/Renovasi';
  return 'Lainnya';
}

/**
 * Menganalisis seluruh riwayat laporan nyata dan mendeteksi masalah-masalah yang berulang/sering diketik
 */
export function detectRecurringIssues(reports: DailyReport[]): DetectedIssue[] {
  if (!reports || reports.length === 0) return [];

  const groups: {
    representative: DailyReport;
    allReports: DailyReport[];
    frequency: number;
    category: ReportCategory;
  }[] = [];

  // Urutkan laporan dari yang paling baru
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = a.tanggalPengerjaan || '';
    const dateB = b.tanggalPengerjaan || '';
    return dateB.localeCompare(dateA);
  });

  for (const report of sortedReports) {
    const deskripsi = report.deskripsiPermohonan?.trim();
    if (!deskripsi || deskripsi.length < 3) continue;

    const cat = normalizeCategory(report.category);
    let matchedGroup: typeof groups[0] | null = null;

    // Cari grup yang memiliki kategori sama dan kemiripan teks deskripsi > 40%
    for (const group of groups) {
      if (group.category === cat) {
        const similarity = calculateTextSimilarity(group.representative.deskripsiPermohonan, deskripsi);
        const exactInclude = 
          normalizeText(group.representative.deskripsiPermohonan).includes(normalizeText(deskripsi)) ||
          normalizeText(deskripsi).includes(normalizeText(group.representative.deskripsiPermohonan));

        if (similarity >= 0.45 || exactInclude) {
          matchedGroup = group;
          break;
        }
      }
    }

    if (matchedGroup) {
      matchedGroup.frequency += 1;
      matchedGroup.allReports.push(report);
    } else {
      groups.push({
        representative: report,
        allReports: [report],
        frequency: 1,
        category: cat,
      });
    }
  }

  // Petakan ke objek DetectedIssue
  const detectedList: DetectedIssue[] = groups.map((g, index) => {
    const latest = g.allReports[0] || g.representative;
    
    // Cari solusi yang paling lengkap / paling baru
    const bestSolutionReport = g.allReports.find(r => r.solusiIssue && r.solusiIssue.trim().length > 10) || latest;

    // Kumpulkan unit kerja yang pernah mengalami masalah ini
    const rawUnits = g.allReports.map(r => r.unitKerja).filter(Boolean) as string[];
    const units = rawUnits.filter((u, i) => rawUnits.indexOf(u) === i).slice(0, 3);

    return {
      id: `detected-${g.category.replace(/\s+/g, '-').toLowerCase()}-${index}`,
      title: generateTitleFromDescription(latest.deskripsiPermohonan),
      category: g.category,
      deskripsi: latest.deskripsiPermohonan.trim(),
      solusi: bestSolutionReport.solusiIssue?.trim() || 'Pemeriksaan dan perbaikan telah dilakukan.',
      metodePenanganan: latest.metodePenanganan || 'Visit',
      frequency: g.frequency,
      lastReportedDate: latest.tanggalPengerjaan || '',
      commonUnits: units,
      recentReportIds: g.allReports.map(r => r.id || '').filter(Boolean),
    };
  });

  // Urutkan berdasarkan frekuensi tertinggi (paling sering terjadi), lalu tanggal terbaru
  return detectedList.sort((a, b) => {
    if (b.frequency !== a.frequency) {
      return b.frequency - a.frequency;
    }
    return (b.lastReportedDate || '').localeCompare(a.lastReportedDate || '');
  });
}

/**
 * Mencari rekomendasi kendala serupa saat pengguna mengetik di form
 */
export function findSimilarHistoricalIssues(
  query: string,
  category: ReportCategory | string,
  detectedIssues: DetectedIssue[],
  limit: number = 4
): DetectedIssue[] {
  if (!query || query.trim().length < 2) {
    // Jika query masih pendek, kembalikan isu paling sering terjadi di kategori aktif
    return detectedIssues
      .filter(i => category === 'Semua' || i.category === category)
      .slice(0, limit);
  }

  const cleanQuery = normalizeText(query);
  const keywords = cleanQuery.split(' ').filter(k => k.length > 1);

  const scored = detectedIssues
    .map(issue => {
      const targetText = normalizeText(`${issue.title} ${issue.deskripsi} ${issue.solusi}`);
      let matchScore = 0;

      // Pencocokan substring langsung
      if (targetText.includes(cleanQuery)) {
        matchScore += 10;
      }

      // Pencocokan keyword
      for (const kw of keywords) {
        if (targetText.includes(kw)) {
          matchScore += 3;
        }
      }

      // Bonus jika kategori sama
      if (issue.category === category) {
        matchScore += 4;
      }

      // Tambahkan bobot frekuensi riwayat
      matchScore += Math.min(issue.frequency, 8);

      return { issue, score: matchScore };
    })
    .filter(item => item.score > 3)
    .sort((a, b) => b.score - a.score)
    .map(item => item.issue);

  return scored.slice(0, limit);
}
