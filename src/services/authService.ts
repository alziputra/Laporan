import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile, RegisterPayload, LoginPayload, DirectResetPayload } from '@/types/user';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const USER_REPORTS_COLLECTION = 'user-reports';
const LOCAL_USERS_KEY = 'pegadaian_user_reports_v1';
const LOCAL_CURRENT_USER_KEY = 'pegadaian_current_user_v1';

// Local storage helpers
const getLocalUsers = (): UserProfile[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: UserProfile[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
};

const getLocalCurrentUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setLocalCurrentUser = (user: UserProfile | null) => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
    }
  }
};

export const authService = {
  // Register User (Nama Lengkap, Email Aktif, Kantor Wilayah, Password)
  async register({ displayName, email, kanwil, password }: RegisterPayload): Promise<UserProfile> {
    const timestamp = Date.now();
    const cleanEmail = email.trim().toLowerCase();
    const unitKerja = `${kanwil} - ${displayName}`;

    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName });

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: cleanEmail,
          displayName,
          kanwil,
          unitKerja,
          role: 'Desktop Support',
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        const userDocRef = doc(db, USER_REPORTS_COLLECTION, firebaseUser.uid);
        await setDoc(userDocRef, userProfile);

        return userProfile;
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          throw new Error(`Email "${cleanEmail}" sudah terdaftar. Silakan gunakan email lain atau login.`);
        }
        throw err;
      }
    }

    // Local Storage Fallback Mode
    const existingUsers = getLocalUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" sudah terdaftar. Silakan gunakan email lain atau login.`);
    }

    const mockUid = 'user-' + Date.now();
    const newUserProfile: UserProfile = {
      uid: mockUid,
      email: cleanEmail,
      displayName,
      kanwil,
      unitKerja,
      role: 'Desktop Support',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    saveLocalUsers([...existingUsers, newUserProfile]);
    setLocalCurrentUser(newUserProfile);
    return newUserProfile;
  },

  // Login User by Email or Nama Lengkap
  async login({ nameOrEmail, password }: LoginPayload): Promise<UserProfile> {
    const trimmedInput = nameOrEmail.trim();
    let emailToUse = trimmedInput.toLowerCase();

    if (isFirebaseConfigured && auth && db) {
      if (!emailToUse.includes('@')) {
        try {
          const q = query(
            collection(db, USER_REPORTS_COLLECTION),
            where('displayName', '==', trimmedInput)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data() as UserProfile;
            emailToUse = data.email;
          }
        } catch (e) {
          console.error('Error searching user in Firestore:', e);
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const firebaseUser = userCredential.user;

      const profile = await this.getUserProfile(firebaseUser.uid);
      if (profile) return profile;

      const timestamp = Date.now();
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || emailToUse,
        displayName: firebaseUser.displayName || trimmedInput,
        kanwil: 'Kanwil I - Medan',
        unitKerja: trimmedInput,
        role: 'Desktop Support',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(doc(db, USER_REPORTS_COLLECTION, firebaseUser.uid), fallbackProfile);
      return fallbackProfile;
    }

    // Local Storage Fallback Mode
    const users = getLocalUsers();
    const foundUser = users.find(
      (u) =>
        u.displayName.toLowerCase() === trimmedInput.toLowerCase() ||
        u.email.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (!foundUser) {
      throw new Error(`Pengguna dengan nama/email "${trimmedInput}" tidak ditemukan atau kata sandi salah.`);
    }

    setLocalCurrentUser(foundUser);
    return foundUser;
  },

  // Reset Password via Firebase Email
  async resetPasswordEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          throw new Error(`Email "${cleanEmail}" belum terdaftar di Firebase Authentication.`);
        }
        throw new Error(err.message || 'Gagal mengirim email reset password.');
      }
    }

    // Local Storage Fallback Check
    const users = getLocalUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!foundUser) {
      throw new Error(`Email "${cleanEmail}" tidak ditemukan.`);
    }
  },

  // Direct Reset Password (backup option)
  async resetPasswordDirectly({ email, newPassword }: DirectResetPayload): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured && auth && db) {
      const q = query(
        collection(db, USER_REPORTS_COLLECTION),
        where('email', '==', cleanEmail)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`Email "${cleanEmail}" tidak ditemukan.`);
      }
      return;
    }

    // Local Storage Fallback
    const users = getLocalUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      throw new Error(`Email "${cleanEmail}" tidak ditemukan.`);
    }
  },

  // Fetch User Profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, USER_REPORTS_COLLECTION, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
      } catch (err) {
        console.error('Error fetching user profile from Firestore "user-reports":', err);
      }
    }

    const localCurrent = getLocalCurrentUser();
    if (localCurrent && localCurrent.uid === uid) {
      return localCurrent;
    }
    const users = getLocalUsers();
    return users.find((u) => u.uid === uid) || null;
  },

  getCurrentSession(): UserProfile | null {
    return getLocalCurrentUser();
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('Error signing out from Firebase:', err);
      }
    }
    setLocalCurrentUser(null);
  }
};
