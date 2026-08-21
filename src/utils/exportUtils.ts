import { DailyReport } from '@/types/report';
import * as XLSX from 'xlsx';

// SLA Calculator: HH:MM:SS format
export const calculateSLA = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '0:00:00';
  const [sHours, sMins] = startTime.split(':').map(Number);
  const [eHours, eMins] = endTime.split(':').map(Number);

  let startTotalMins = (sHours || 0) * 60 + (sMins || 0);
  let endTotalMins = (eHours || 0) * 60 + (eMins || 0);

  if (endTotalMins < startTotalMins) {
    endTotalMins += 24 * 60;
  }

  const diffMins = endTotalMins - startTotalMins;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const secs = 0;

  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get Day Name in English (e.g. Thursday, Friday)
export const getDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr);
  return days[d.getDay()] || '';
};

// Format Date as DD-MMM-YYYY (e.g. 13-Aug-2026)
export const formatDateFormatted = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthIdx = parseInt(month, 10) - 1;
  return `${day}-${months[monthIdx] || month}-${year}`;
};

// Format Date Range Label for Header
export const formatDateRangeLabel = (startDate: string, endDate: string): string => {
  const monthsID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatID = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const mIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${monthsID[mIdx] || m} ${y}`;
  };

  if (startDate && endDate) {
    return `${formatID(startDate)} - ${formatID(endDate)}`;
  }
  return 'Semua Periode';
};

export const exportToExcel = (reports: DailyReport[], startDate: string, endDate: string) => {
  if (!reports || reports.length === 0) {
    alert("Tidak ada data laporan pada rentang tanggal yang dipilih!");
    return;
  }

  // Sort reports ascending (A-Z / 1-10) by tanggalPengerjaan (oldest to newest date)
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = a.tanggalPengerjaan || '';
    const dateB = b.tanggalPengerjaan || '';
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB); // Ascending date order (A-Z / 1-10)
    }
    const timeA = a.waktuMulai || '';
    const timeB = b.waktuMulai || '';
    return timeA.localeCompare(timeB);
  });

  const workbook = XLSX.utils.book_new();
  const periodLabel = formatDateRangeLabel(startDate, endDate);

  // Category Tabs mapping to match screenshot bottom tabs
  const categoryTabs = [
    { key: 'Software Kanwil', tabName: 'Software' },
    { key: 'Hardware Kanwil', tabName: 'Hardware' },
    { key: 'Network/Jaringan', tabName: 'Network' },
    { key: 'Video Confference & Meeting', tabName: 'Meeting' },
    { key: 'Malware', tabName: 'Malware' },
    { key: 'Relokasi/Renovasi', tabName: 'Relokasi' },
    { key: 'Lainnya', tabName: 'Lainnya' },
  ];

  // Helper to build worksheet array matching exact Pegadaian report format
  const buildSheetData = (catReports: DailyReport[], categoryName: string) => {
    const titleRow1 = [
      `Daftar supporting ${categoryName} di kantor wilayah pada Departemen IT Operation di PT. Pegadaian`
    ];
    const titleRow2 = [
      `Manage Service Support Kantor Wilayah Periode ( ${periodLabel} )`
    ];
    const headerColumns = [
      'No.',
      'Hari',
      'Tanggal Pelaporan',
      'PIC',
      'Unit kerja',
      'Nama user',
      'Deskripsi permohonan',
      'Metode Penanganan',
      'Solusi Issue',
      'Waktu Pengerjaan',
      'Waktu Selesai',
      'SLA'
    ];

    const dataRows = catReports.map((item, idx) => [
      idx + 1,
      getDayName(item.tanggalPengerjaan),
      formatDateFormatted(item.tanggalPengerjaan),
      item.picSupport,
      item.unitKerja,
      item.nama,
      item.deskripsiPermohonan,
      item.metodePenanganan,
      item.solusiIssue,
      item.waktuMulai,
      item.waktuSelesai,
      calculateSLA(item.waktuMulai, item.waktuSelesai)
    ]);

    return [
      titleRow1,
      titleRow2,
      headerColumns,
      ...dataRows
    ];
  };

  // Helper to apply styling & color branding to worksheet
  const styleWorksheet = (ws: XLSX.WorkSheet, totalRows: number) => {
    ws['!cols'] = [
      { wch: 6 },  // A: No.
      { wch: 14 }, // B: Hari
      { wch: 18 }, // C: Tanggal Pelaporan
      { wch: 20 }, // D: PIC
      { wch: 26 }, // E: Unit kerja
      { wch: 24 }, // F: Nama user
      { wch: 45 }, // G: Deskripsi permohonan
      { wch: 18 }, // H: Metode Penanganan
      { wch: 45 }, // I: Solusi Issue
      { wch: 16 }, // J: Waktu Pengerjaan
      { wch: 16 }, // K: Waktu Selesai
      { wch: 14 }, // L: SLA
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Merge A1:L1 (Title Cyan)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Merge A2:L2 (Subtitle Yellow)
    ];

    const getColLetter = (c: number) => String.fromCharCode(65 + c);

    // Row 1 Title (Cyan Background #00BCD4)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}1`;
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        fill: { patternType: 'solid', fgColor: { rgb: '00BCD4' } },
        font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      };
    }

    // Row 2 Subtitle (Yellow Background #FFD600)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}2`;
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFD600' } },
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '333333' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      };
    }

    // Row 3 Column Headers (Gold #FFC107 Background)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}3`;
      if (ws[cellRef]) {
        const isCenter = [0, 1, 2, 7, 9, 10, 11].includes(c);
        ws[cellRef].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFC107' } },
          font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: isCenter ? 'center' : 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }

    // Data Rows Styling
    for (let r = 3; r < totalRows; r++) {
      const rowNum = r + 1;
      const isEven = r % 2 === 0;
      const bgHex = isEven ? 'F9FAFB' : 'FFFFFF';

      for (let c = 0; c < 12; c++) {
        const cellRef = `${getColLetter(c)}${rowNum}`;
        if (ws[cellRef]) {
          const isCenter = [0, 1, 2, 7, 9, 10, 11].includes(c);
          ws[cellRef].s = {
            fill: { patternType: 'solid', fgColor: { rgb: bgHex } },
            font: { name: 'Arial', sz: 10, color: { rgb: '1E293B' } },
            alignment: { horizontal: isCenter ? 'center' : 'left', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
              left: { style: 'thin', color: { rgb: 'E2E8F0' } },
              right: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          };
        }
      }
    }
  };

  // 1. Add sheet for All Data (Semua Laporan)
  const allSheetData = buildSheetData(sortedReports, 'All Services');
  const allWorksheet = XLSX.utils.aoa_to_sheet(allSheetData);
  styleWorksheet(allWorksheet, allSheetData.length);
  XLSX.utils.book_append_sheet(workbook, allWorksheet, 'Semua Laporan');

  // 2. Add individual category sheets matching bottom tabs
  categoryTabs.forEach((cat) => {
    const catReports = sortedReports.filter(r => r.category === cat.key);
    const sheetData = buildSheetData(catReports, cat.tabName);
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    styleWorksheet(ws, sheetData.length);
    XLSX.utils.book_append_sheet(workbook, ws, cat.tabName);
  });

  const formattedStart = startDate ? startDate.replace(/-/g, '') : 'Awal';
  const formattedEnd = endDate ? endDate.replace(/-/g, '') : 'Akhir';
  const fileName = `Laporan_Manage_Service_Support_Kanwil_${formattedStart}_sd_${formattedEnd}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
