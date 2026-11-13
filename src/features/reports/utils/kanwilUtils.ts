import { DailyReport } from '@/features/reports/types/report';
import { UserProfile, KANWIL_LIST } from '@/features/auth/types/user';

/**
 * Robust matching helper to check if a report belongs to a user
 */
export const isReportMatchingUser = (
  report: DailyReport,
  user: UserProfile | { displayName: string; email?: string; uid?: string }
): boolean => {
  if (!user) return false;
  if (user.uid && report.userId && report.userId === user.uid) return true;

  const pic = (report.picSupport || '').toLowerCase().trim();
  const name = (user.displayName || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();

  if (name && pic.includes(name)) return true;
  if (email && pic.includes(email)) return true;

  // First name match fallback (e.g. 'alzi', 'rizky', 'triwan')
  const firstName = name.split(' ')[0];
  if (firstName && firstName.length > 2 && pic.includes(firstName)) return true;

  return false;
};

/**
 * Helper to determine the single Kanwil / Office of a report without ambiguity
 */
export const getReportKanwil = (
  report: DailyReport,
  users?: UserProfile[] | Map<string, UserProfile>
): string | null => {
  // 1. Direct userId match against registered users
  if (report.userId && users) {
    let owner: UserProfile | undefined;
    if (users instanceof Map) {
      owner = users.get(report.userId);
    } else if (Array.isArray(users)) {
      owner = users.find((u) => u.uid === report.userId);
    }

    if (owner?.kanwil && KANWIL_LIST.includes(owner.kanwil as any)) {
      return owner.kanwil;
    }
    if (owner?.kanwil === 'Kantor Pusat') {
      return 'Kantor Pusat';
    }
  }

  // 2. Exact user match by name or email
  if (users) {
    const userList = users instanceof Map ? Array.from(users.values()) : users;
    const matchedUser = userList.find((u) => isReportMatchingUser(report, u));
    if (
      matchedUser?.kanwil &&
      (KANWIL_LIST.includes(matchedUser.kanwil as any) || matchedUser.kanwil === 'Kantor Pusat')
    ) {
      return matchedUser.kanwil;
    }
  }

  // 3. Text pattern match in unitKerja and picSupport
  const text = `${report.unitKerja || ''} ${report.picSupport || ''}`.toLowerCase();

  // Check exact full Kanwil name first (e.g. 'Kanwil VIII - Jakarta 1')
  for (const k of KANWIL_LIST) {
    if (text.includes(k.toLowerCase())) return k;
  }

  // Check Kantor Pusat
  if (
    text.includes('kantor pusat') ||
    text.includes('divisi ti') ||
    text.includes('ti pusat') ||
    text.includes('head office')
  ) {
    return 'Kantor Pusat';
  }

  // Check specific Jakarta 1 vs Jakarta 2
  if (
    text.includes('jakarta 2') ||
    text.includes('jakarta ii') ||
    text.includes('kanwil ix') ||
    text.includes('kanwil 9')
  ) {
    return 'Kanwil IX - Jakarta 2';
  }
  if (
    text.includes('jakarta 1') ||
    text.includes('jakarta i') ||
    text.includes('kanwil viii') ||
    text.includes('kanwil 8')
  ) {
    return 'Kanwil VIII - Jakarta 1';
  }

  // Check specific unique cities
  const cityToKanwil: Record<string, string> = {
    surabaya: 'Kanwil XII - Surabaya',
    semarang: 'Kanwil XI - Semarang',
    bandung: 'Kanwil X - Bandung',
    denpasar: 'Kanwil VII - Denpasar',
    makassar: 'Kanwil VI - Makassar',
    manado: 'Kanwil V - Manado',
    balikpapan: 'Kanwil IV - Balikpapan',
    palembang: 'Kanwil III - Palembang',
    pekanbaru: 'Kanwil II - Pekanbaru',
    medan: 'Kanwil I - Medan',
  };

  for (const [city, kVal] of Object.entries(cityToKanwil)) {
    if (text.includes(city)) return kVal;
  }

  // Exact Roman numerals in descending order with regex word boundary
  const romanPatterns: Array<[RegExp, string]> = [
    [/\bkanwil\s+(xii|12)\b/i, 'Kanwil XII - Surabaya'],
    [/\bkanwil\s+(xi|11)\b/i, 'Kanwil XI - Semarang'],
    [/\bkanwil\s+(x|10)\b/i, 'Kanwil X - Bandung'],
    [/\bkanwil\s+(ix|9)\b/i, 'Kanwil IX - Jakarta 2'],
    [/\bkanwil\s+(viii|8)\b/i, 'Kanwil VIII - Jakarta 1'],
    [/\bkanwil\s+(vii|7)\b/i, 'Kanwil VII - Denpasar'],
    [/\bkanwil\s+(vi|6)\b/i, 'Kanwil VI - Makassar'],
    [/\bkanwil\s+(v|5)\b/i, 'Kanwil V - Manado'],
    [/\bkanwil\s+(iv|4)\b/i, 'Kanwil IV - Balikpapan'],
    [/\bkanwil\s+(iii|3)\b/i, 'Kanwil III - Palembang'],
    [/\bkanwil\s+(ii|2)\b/i, 'Kanwil II - Pekanbaru'],
    [/\bkanwil\s+(i|1)\b/i, 'Kanwil I - Medan'],
  ];

  for (const [pattern, kVal] of romanPatterns) {
    if (pattern.test(text)) return kVal;
  }

  return null;
};

/**
 * Robust matching helper to check if a report belongs to a Kanwil
 */
export const isReportMatchingKanwil = (
  report: DailyReport,
  kanwil: string,
  users?: UserProfile[] | Map<string, UserProfile>
): boolean => {
  if (!kanwil || kanwil === 'Semua') return true;
  const reportKanwil = getReportKanwil(report, users);
  if (kanwil === 'Kantor Pusat / Lainnya' || kanwil === 'Tanpa Kanwil') {
    return (
      !reportKanwil ||
      reportKanwil === 'Kantor Pusat' ||
      !KANWIL_LIST.includes(reportKanwil as any)
    );
  }
  return reportKanwil === kanwil;
};
