export const KANWIL_LIST = [
  'Kanwil I - Medan',
  'Kanwil II - Pekanbaru',
  'Kanwil III - Palembang',
  'Kanwil IV - Balikpapan',
  'Kanwil V - Manado',
  'Kanwil VI - Makassar',
  'Kanwil VII - Denpasar',
  'Kanwil VIII - Jakarta 1',
  'Kanwil IX - Jakarta 2',
  'Kanwil X - Bandung',
  'Kanwil XI - Semarang',
  'Kanwil XII - Surabaya'
] as const;

export type KanwilOption = typeof KANWIL_LIST[number];

export const USER_ROLES = ['Desktop Support', 'Admin', 'Supervisor'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  kanwil: string;
  unitKerja: string;
  nik?: string;
  role: string;
  createdAt: number | string;
  updatedAt: number | string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  kanwil: string;
  password: string;
  nik?: string;
  role?: string;
}

export interface LoginPayload {
  nameOrEmail: string;
  password: string;
}

export interface DirectResetPayload {
  email: string;
  newPassword: string;
}

export interface AdminUserSavePayload {
  uid?: string;
  displayName: string;
  email: string;
  kanwil: string;
  unitKerja?: string;
  nik?: string;
  role: string;
  password?: string;
}
