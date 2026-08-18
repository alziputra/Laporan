import { DailyReport } from '@/types/report';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'pegadaian_desktop_support_reports_v2';
const USER_REPORTS_COLLECTION = 'user-reports';

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
  async getAllReports(userId?: string, displayName?: string): Promise<DailyReport[]> {
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

        if (data.length > 0) {
          data.sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));
          return data;
        }

        // 2. If subcollection is empty, check root 'reports' collection for legacy migration for this user
        if (displayName) {
          const rootReportsRef = collection(db, 'reports');
          const rootSnap = await getDocs(rootReportsRef);
          const migratedData: DailyReport[] = [];

          for (const docSnap of rootSnap.docs) {
            const item = { id: docSnap.id, ...docSnap.data() } as DailyReport;
            const pic = (item.picSupport || '').toLowerCase();
            const name = displayName.toLowerCase();
            const isAlzi = name.includes('alzi') && (pic.includes('alzi') || pic.includes('kanwil viii'));
            const isMatch = isAlzi || pic.includes(name) || name.includes(pic);

            if (isMatch) {
              const newReportData: DailyReport = {
                ...item,
                userId,
                createdAt: item.createdAt || Date.now(),
                updatedAt: Date.now()
              };
              // Save document inside user-reports/{userId}/reports/{docId}
              await setDoc(doc(db, USER_REPORTS_COLLECTION, userId, 'reports', docSnap.id), newReportData);
              migratedData.push(newReportData);
            }
          }

          if (migratedData.length > 0) {
            migratedData.sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));
            return migratedData;
          }
        }

        return [];
      } catch (err) {
        console.error("Firestore get subcollection error, falling back to local:", err);
      }
    }

    // Local Storage Fallback
    const allLocal = getLocalReports();
    return allLocal.filter((r) => r.userId === userId || (!r.userId && displayName && r.picSupport?.toLowerCase().includes(displayName.toLowerCase())));
  },

  // Add new report into user's subcollection: user-reports/{userId}/reports
  async createReport(report: DailyReport, userId?: string): Promise<DailyReport> {
    const timestamp = Date.now();
    const targetUserId = userId || report.userId || '';

    const newReportData: DailyReport = {
      ...report,
      userId: targetUserId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (isFirebaseConfigured && db && targetUserId) {
      try {
        const userSubcollectionRef = collection(db, USER_REPORTS_COLLECTION, targetUserId, 'reports');
        const docRef = await addDoc(userSubcollectionRef, newReportData);
        return { ...newReportData, id: docRef.id };
      } catch (err) {
        console.error("Firestore subcollection add error, writing local:", err);
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
    const updatedAt = Date.now();
    const targetUserId = userId || report.userId || '';

    if (isFirebaseConfigured && db && targetUserId) {
      try {
        const docRef = doc(db, USER_REPORTS_COLLECTION, targetUserId, 'reports', id);
        await updateDoc(docRef, { ...report, updatedAt });
        return;
      } catch (err) {
        console.error("Firestore update error:", err);
      }
    }

    // Local Storage Fallback
    const current = getLocalReports();
    const updatedList = current.map((r) => r.id === id ? { ...r, ...report, updatedAt } : r);
    saveLocalReports(updatedList);
  },

  // Delete report from user-reports/{userId}/reports/{id}
  async deleteReport(id: string, userId?: string): Promise<void> {
    if (isFirebaseConfigured && db && userId) {
      try {
        const docRef = doc(db, USER_REPORTS_COLLECTION, userId, 'reports', id);
        await deleteDoc(docRef);
        return;
      } catch (err) {
        console.error("Firestore delete error:", err);
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
