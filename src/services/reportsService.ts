import { DailyReport } from '@/types/report';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'pegadaian_desktop_support_reports_v2';


// Helper to get local data
const getLocalReports = (): DailyReport[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

// Helper to save local data
const saveLocalReports = (reports: DailyReport[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  }
};

export const reportsService = {
  // Fetch all reports
  async getAllReports(): Promise<DailyReport[]> {
    if (isFirebaseConfigured && db) {
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data: DailyReport[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as DailyReport);
        });
        if (data.length > 0) return data;
      } catch (err) {
        console.error("Firestore get error, falling back to local:", err);
      }
    }
    return getLocalReports();
  },

  // Add new report
  async createReport(report: DailyReport): Promise<DailyReport> {
    const timestamp = Date.now();
    const newReportData = {
      ...report,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (isFirebaseConfigured && db) {
      try {
        const reportsRef = collection(db, 'reports');
        const docRef = await addDoc(reportsRef, newReportData);
        return { ...newReportData, id: docRef.id };
      } catch (err) {
        console.error("Firestore add error, writing local:", err);
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const createdReport = {
      ...newReportData,
      id: 'rep-' + Date.now()
    };
    const updatedList = [createdReport, ...current];
    saveLocalReports(updatedList);
    return createdReport;
  },

  // Update existing report
  async updateReport(id: string, report: Partial<DailyReport>): Promise<void> {
    const updatedAt = Date.now();
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'reports', id);
        await updateDoc(docRef, { ...report, updatedAt });
        return;
      } catch (err) {
        console.error("Firestore update error, updating local:", err);
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const updatedList = current.map((r) => r.id === id ? { ...r, ...report, updatedAt } : r);
    saveLocalReports(updatedList);
  },

  // Delete report
  async deleteReport(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'reports', id);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.error("Firestore delete error, deleting local:", err);
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const updatedList = current.filter((r) => r.id !== id);
    saveLocalReports(updatedList);
  },

  // Filter reports by date range and optional category/status
  filterReportsByDate(
    reports: DailyReport[],
    startDate: string,
    endDate: string,
    category: string = 'Semua',
    status: string = 'Semua'
  ): DailyReport[] {
    return reports.filter((item) => {
      const itemDate = item.tanggalPengerjaan;

      let inDateRange = true;
      if (startDate && endDate) {
        inDateRange = itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        inDateRange = itemDate >= startDate;
      } else if (endDate) {
        inDateRange = itemDate <= endDate;
      }

      const matchCategory = category === 'Semua' || item.category === category;
      const matchStatus = status === 'Semua' || item.status === status;

      return inDateRange && matchCategory && matchStatus;
    });
  }
};
