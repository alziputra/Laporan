import { DailyReport } from '@/types/report';
import XLSX from 'xlsx-js-style';

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
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return days[d.getDay()] || '';
  }
  const d = new Date(dateStr);
  return days[d.getDay()] || '';
};

// Format Date as DD-MMM-YYYY (e.g. 13-Aug-2026, 02-Sep-2026)
export const formatDateFormatted = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthIdx = parseInt(month, 10) - 1;
  const dayPadded = day.padStart(2, '0');
  return `${dayPadded}-${months[monthIdx] || month}-${year}`;
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
  } else if (startDate) {
    return `Mulai ${formatID(startDate)}`;
  } else if (endDate) {
    return `Sampai ${formatID(endDate)}`;
  }
  return 'Semua Periode';
};

// Map category string to official tab name
export const getCategoryTab = (category: string): string => {
  const c = (category || '').toLowerCase();
  if (c.includes('soft')) return 'Software';
  if (c.includes('hard')) return 'Hardware';
  if (c.includes('net')) return 'Network';
  if (c.includes('meet') || c.includes('video') || c.includes('confer')) return 'Meeting';
  if (c.includes('malware') || c.includes('virus') || c.includes('secur')) return 'Malware';
  if (c.includes('relok') || c.includes('renov')) return 'Relokasi';
  return 'Lainnya';
};

export const exportToExcel = (reports: DailyReport[], startDate: string, endDate: string) => {
  if (!reports || reports.length === 0) {
    alert("Tidak ada data laporan pada rentang tanggal yang dipilih!");
    return;
  }

  // Sort reports ascending by tanggalPengerjaan (oldest to newest date) then by waktuMulai
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = a.tanggalPengerjaan || '';
    const dateB = b.tanggalPengerjaan || '';
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const timeA = a.waktuMulai || '';
    const timeB = b.waktuMulai || '';
    return timeA.localeCompare(timeB);
  });

  const workbook = XLSX.utils.book_new();
  const periodLabel = formatDateRangeLabel(startDate, endDate);

  // Exact 7 Category Tabs in official order: Hardware, Software, Network, Meeting, Malware, Relokasi, Lainnya
  const categoryTabs = [
    { tabName: 'Hardware', titleName: 'Hardware' },
    { tabName: 'Software', titleName: 'Software' },
    { tabName: 'Network', titleName: 'Network' },
    { tabName: 'Meeting', titleName: 'Meeting' },
    { tabName: 'Malware', titleName: 'Malware' },
    { tabName: 'Relokasi', titleName: 'Relokasi' },
    { tabName: 'Lainnya', titleName: 'Lainnya' },
  ];

  // Helper to build worksheet array matching exact Pegadaian report format (12 columns A to L)
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
      item.picSupport || '',
      item.unitKerja || '',
      item.nama || '',
      item.deskripsiPermohonan || '',
      item.metodePenanganan || 'Guide',
      item.solusiIssue || '',
      item.waktuMulai || '',
      item.waktuSelesai || '',
      calculateSLA(item.waktuMulai, item.waktuSelesai)
    ]);

    return [
      titleRow1,
      titleRow2,
      headerColumns,
      ...dataRows
    ];
  };

  // Helper to style worksheet exactly matching the user's template (12 columns A to L)
  const styleWorksheet = (ws: XLSX.WorkSheet, totalRows: number, categoryName: string) => {
    // Column widths for columns A to L (12 columns)
    ws['!cols'] = [
      { wch: 6 },  // A: No.
      { wch: 14 }, // B: Hari
      { wch: 18 }, // C: Tanggal Pelaporan
      { wch: 42 }, // D: PIC
      { wch: 28 }, // E: Unit kerja
      { wch: 20 }, // F: Nama user
      { wch: 55 }, // G: Deskripsi permohonan
      { wch: 22 }, // H: Metode Penanganan
      { wch: 55 }, // I: Solusi Issue
      { wch: 18 }, // J: Waktu Pengerjaan
      { wch: 18 }, // K: Waktu Selesai
      { wch: 14 }, // L: SLA
    ];

    // Row heights
    ws['!rows'] = [
      { hpt: 24 }, // Row 1: Title
      { hpt: 20 }, // Row 2: Subtitle
      { hpt: 24 }, // Row 3: Column Headers
    ];

    // Merged ranges for Title and Subtitle across columns A to L (0 to 11)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Merge A1:L1 (Title Cyan)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Merge A2:L2 (Subtitle Yellow)
    ];

    // Ensure gridlines are visible
    ws['!views'] = [{ showGridLines: true }];

    const getColLetter = (c: number) => String.fromCharCode(65 + c);

    const thinBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    const titleText = `Daftar supporting ${categoryName} di kantor wilayah pada Departemen IT Operation di PT. Pegadaian`;
    const subtitleText = `Manage Service Support Kantor Wilayah Periode ( ${periodLabel} )`;

    // Row 1: Title (Cyan Background #00FFFF, centered, bold, 11pt, thin border across A1:L1)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}1`;
      if (!ws[cellRef]) ws[cellRef] = { v: c === 0 ? titleText : '', t: 's' };
      ws[cellRef].s = {
        fill: { patternType: 'solid', fgColor: { rgb: '00FFFF' } },
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };
    }

    // Row 2: Subtitle (Yellow Background #FFFF00, centered, bold, 10pt, thin border across A2:L2)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}2`;
      if (!ws[cellRef]) ws[cellRef] = { v: c === 0 ? subtitleText : '', t: 's' };
      ws[cellRef].s = {
        fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      };
    }

    // Row 3: Column Headers (Peach Background #F8CBAD, centered, bold, 10pt, thin border across A3:L3)
    for (let c = 0; c < 12; c++) {
      const cellRef = `${getColLetter(c)}3`;
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'F8CBAD' } },
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: thinBorder
        };
      }
    }

    // Row 4+: Data Rows (White Background #FFFFFF, 10pt, thin border across columns A to L)
    for (let r = 3; r < totalRows; r++) {
      const rowNum = r + 1;
      for (let c = 0; c < 12; c++) {
        const cellRef = `${getColLetter(c)}${rowNum}`;
        if (!ws[cellRef]) {
          ws[cellRef] = { v: '', t: 's' };
        }
        // Center align: No. (col 0), Waktu Pengerjaan (col 9), Waktu Selesai (col 10), SLA (col 11)
        const isCentered = c === 0 || c === 9 || c === 10 || c === 11;
        ws[cellRef].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
          font: { name: 'Calibri', sz: 10, color: { rgb: '000000' } },
          alignment: { 
            horizontal: isCentered ? 'center' : 'left', 
            vertical: 'center', 
            wrapText: true 
          },
          border: thinBorder
        };
      }
    }
  };

  // Populate the 7 category sheets matching the bottom tabs in the screenshot
  categoryTabs.forEach((cat) => {
    const catReports = sortedReports.filter(r => getCategoryTab(r.category) === cat.tabName);
    const sheetData = buildSheetData(catReports, cat.titleName);
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    styleWorksheet(ws, sheetData.length, cat.titleName);
    XLSX.utils.book_append_sheet(workbook, ws, cat.tabName);
  });

  const formattedStart = startDate ? startDate.replace(/-/g, '') : 'Awal';
  const formattedEnd = endDate ? endDate.replace(/-/g, '') : 'Akhir';
  const fileName = `Laporan_Manage_Service_Support_Kanwil_${formattedStart}_sd_${formattedEnd}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
