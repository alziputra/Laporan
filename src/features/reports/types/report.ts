export type ReportCategory = 
  | 'Hardware Kanwil'
  | 'Software Kanwil'
  | 'Network/Jaringan'
  | 'Video Confference & Meeting'
  | 'Malware'
  | 'Relokasi/Renovasi'
  | 'Lainnya';

export type MetodePenanganan = 
  | 'Guide'
  | 'Visit'
  | 'Remote';


export type ReportStatus = 'Selesai' | 'Dalam Proses' | 'Pending';

export interface DailyReport {
  id?: string;
  userId?: string;
  category: ReportCategory;
  nama: string;
  unitKerja: string;
  deskripsiPermohonan: string;
  metodePenanganan: MetodePenanganan;
  solusiIssue: string;
  picSupport: string;
  tanggalPengerjaan: string; // YYYY-MM-DD
  tanggalSelesai?: string;   // YYYY-MM-DD (Optional)
  waktuMulai: string;        // HH:mm
  waktuSelesai: string;      // HH:mm
  status: ReportStatus;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  category?: ReportCategory | 'Semua';
  status?: ReportStatus | 'Semua';
}
