import { DailyReport } from '@/features/reports/types/report';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { authService } from '@/features/auth/services/authService';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'pegadaian_desktop_support_reports_v2';
const USER_REPORTS_COLLECTION = 'user-reports';

const requireFirebaseInProduction = (): void => {
  if (process.env.NODE_ENV === 'production' && !isFirebaseConfigured) {
    throw new Error('Firebase wajib dikonfigurasi untuk data laporan produksi.');
  }
};

// Helper to get local data
const getLocalReports = (): DailyReport[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
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
  // Fetch reports from subcollection: user-reports/{userId}/reports
  async getAllReports(userId?: string): Promise<DailyReport[]> {
    requireFirebaseInProduction();

    if (!userId) {
      return []; // Data kosong jika belum login
    }

    if (isFirebaseConfigured && db) {
      try {
        // 1. Try fetching from subcollection: user-reports/{userId}/reports
        const userSubcollectionRef = collection(db, USER_REPORTS_COLLECTION, userId, 'reports');
        const snapshot = await getDocs(userSubcollectionRef);
        const data: DailyReport[] = [];

        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, userId, ...docSnap.data() } as DailyReport);
        });

        data.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        return data;
      } catch (err) {
        console.error("Firestore get subcollection error:", err);
        throw err;
      }
    }

    if (isFirebaseConfigured) {
      throw new Error('Firestore tidak tersedia; data lokal tidak digunakan sebagai pengganti.');
    }

    // Local Storage Fallback
    const allLocal = getLocalReports();
    return allLocal.filter((report) => report.userId === userId);
  },

  // Admin feature: Fetch all reports across all registered users
  async getAllUsersReports(users: { uid: string; displayName?: string }[]): Promise<DailyReport[]> {
    requireFirebaseInProduction();
    await authService.assertAdminAccess();

    if (isFirebaseConfigured) {
      if (!db) {
        throw new Error('Firestore tidak tersedia.');
      }

      const promises = users.map(async (user) => {
        const userSubcollectionRef = collection(db, USER_REPORTS_COLLECTION, user.uid, 'reports');
        const snapshot = await getDocs(userSubcollectionRef);
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          userId: user.uid,
          ...docSnap.data()
        })) as DailyReport[];
      });

      const results = await Promise.all(promises);
      const allReports = results.flat();

      if (allReports.length > 0) {
        allReports.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        return allReports;
      }

      const rootSnap = await getDocs(collection(db, 'reports'));
      const rootData = rootSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as DailyReport[];
      rootData.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return rootData;
    }

    return getLocalReports();
  },

  // Add new report into user's subcollection: user-reports/{userId}/reports
  async createReport(report: DailyReport, userId?: string): Promise<DailyReport> {
    requireFirebaseInProduction();
    const timestamp = Date.now();
    const targetUserId = userId || report.userId || '';

    const newReportData: DailyReport = {
      ...report,
      userId: targetUserId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (isFirebaseConfigured && (!db || !targetUserId)) {
      throw new Error('Sesi Firebase atau ID pengguna tidak tersedia.');
    }

    if (isFirebaseConfigured && db && targetUserId) {
      try {
        const userSubcollectionRef = collection(db, USER_REPORTS_COLLECTION, targetUserId, 'reports');
        const docRef = await addDoc(userSubcollectionRef, newReportData);
        return { ...newReportData, id: docRef.id };
      } catch (err) {
        console.error("Firestore subcollection add error:", err);
        throw err;
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const createdReport: DailyReport = {
      ...newReportData,
      id: 'rep-' + Date.now()
    };
    const updatedList = [createdReport, ...current];
    saveLocalReports(updatedList);
    return createdReport;
  },

  // Update existing report in user-reports/{userId}/reports/{id}
  async updateReport(id: string, report: Partial<DailyReport>, userId?: string): Promise<void> {
    requireFirebaseInProduction();
    const updatedAt = Date.now();
    const targetUserId = userId || report.userId || '';

    if (isFirebaseConfigured && (!db || !targetUserId)) {
      throw new Error('Sesi Firebase atau ID pengguna tidak tersedia.');
    }

    if (isFirebaseConfigured && db && targetUserId) {
      try {
        const docRef = doc(db, USER_REPORTS_COLLECTION, targetUserId, 'reports', id);
        await updateDoc(docRef, { ...report, updatedAt });
        return;
      } catch (err) {
        console.error("Firestore update error:", err);
        throw err;
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const updatedList = current.map((r) => r.id === id ? { ...r, ...report, updatedAt } : r);
    saveLocalReports(updatedList);
  },

  // Delete report from user-reports/{userId}/reports/{id}
  async deleteReport(id: string, userId?: string): Promise<void> {
    requireFirebaseInProduction();
    if (isFirebaseConfigured && (!db || !userId)) {
      throw new Error('Sesi Firebase atau ID pengguna tidak tersedia.');
    }

    if (isFirebaseConfigured && db && userId) {
      try {
        const docRef = doc(db, USER_REPORTS_COLLECTION, userId, 'reports', id);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.error("Firestore delete error:", err);
        throw err;
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
