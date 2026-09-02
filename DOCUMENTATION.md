# 📑 DOKUMENTASI TEKNIS & PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Sistem Pelaporan Pekerjaan Harian & Monitoring Eksekutif Desktop Support PT. Pegadaian

---

## 📌 DAFTAR ISI
1. [Ringkasan Produk (Product Overview)](#1-ringkasan-produk-product-overview)
2. [Persona Pengguna & Hak Akses (User Personas & RBAC)](#2-persona-pengguna--hak-akses-user-personas--rbac)
3. [Arsitektur Sistem & Tech Stack](#3-arsitektur-sistem--tech-stack)
4. [Struktur Direktori Proyek](#4-struktur-direktori-proyek)
5. [Spesifikasi Fitur & Fungsionalitas (PRD)](#5-spesifikasi-fitur--fungsionalitas-prd)
   - [5.1 Autentikasi & Keamanan Sesi (Session Security)](#51-autentikasi--keamanan-sesi-session-security)
   - [5.2 Running Text Banner Dinamis](#52-running-text-banner-dinamis)
   - [5.3 Pelaporan Pekerjaan Harian (`/`)](#53-pelaporan-pekerjaan-harian-)
   - [5.4 Panel Administrator & Control Center (`/admin`)](#54-panel-administrator--control-center-admin)
   - [5.5 Engine Export Multi-Sheet Excel](#55-engine-export-multi-sheet-excel)
6. [Skema Data & Type Definitions](#6-skema-data--type-definitions)
7. [Dokumentasi Service Layer](#7-dokumentasi-service-layer)
8. [Changelog & Pemeliharaan](#8-changelog--pemeliharaan)

---

## 1. RINGKASAN PRODUK (PRODUCT OVERVIEW)

### 1.1 Latar Belakang
Divisi Operasional TI (OITI) PT. Pegadaian membutuhkan sistem pelaporan pekerjaan harian terpusat yang mampu mencatat seluruh aktivitas troubleshooting perangkat keras (*hardware*), perangkat lunak (*software*), jaringan (*network*), konferensi video, serta penanganan insiden keamanan di seluruh Kantor Wilayah (Kanwil I s.d. XII dan Kantor Pusat).

### 1.2 Tujuan Produk
1. **Standarisasi Pencatatan**: Menyeragamkan format laporan tiket pekerjaan harian personil Desktop Support di seluruh Indonesia.
2. **Perhitungan SLA Otomatis**: Menghitung durasi penyelesaian masalah secara otomatis dalam format jam, menit, dan detik (`HH:mm:ss`).
3. **Monitoring Eksekutif**: Menyediakan dashboard analitik performa SLA, sebaran kategori masalah, dan leaderboard kinerja personil bagi pimpinan/supervisor.
4. **Export Standar Korporat**: Menghasilkan berkas laporan Excel *multi-sheet* sesuai format resmi siklus *cut-off* PT. Pegadaian (tanggal 21-20, 13-12, atau bulanan).
5. **Keamanan Data & Sesi**: Mencegah kebocoran data pada perangkat bersama melalui *Inactivity Auto-Logout* 30 menit dan otentikasi berbasis peran.

---

## 2. PERSONA PENGGUNA & HAK AKSES (USER PERSONAS & RBAC)

| Role / Peran | Deskripsi Akses | Route Utama | Tindakan Utama |
| :--- | :--- | :---: | :--- |
| **Desktop Support** | Personil teknisi lapangan di Kanwil/Cabang | `/` | Membuat, mengedit, menghapus laporan miliknya, mencari tiket, serta ekspor Excel laporan pribadi. |
| **Supervisor** | Pengawas operasional wilayah | `/` & `/admin` | Memantau seluruh tiket di wilayahnya, melihat statistik SLA, dan mengunduh laporan tim. |
| **Admin / Super Admin** | Pengelola sistem & manajemen nasional | `/admin` | Memantau laporan nasional, filter 2-arah petugas & kanwil, manajemen akun pengguna, reset password, dan ekspor master data. |

---

## 3. ARSITEKTUR SISTEM & TECH STACK

```
┌──────────────────────────────────────────────────────────────┐
│                       NEXT.JS 14 (APP ROUTER)                │
│                                                              │
│  ┌──────────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │ User UI (/)  │   │ Admin (/admin)  │   │ Modals & Toast│  │
│  └──────┬───────┘   └────────┬────────┘   └───────┬───────┘  │
│         │                    │                    │          │
│  ┌──────┴────────────────────┴────────────────────┴───────┐  │
│  │                    AuthContext                         │  │
│  │  - User Profile State                                  │  │
│  │  - 30-Min Inactivity Auto-Logout Listener             │  │
│  │  - Multi-Tab Session Sync                              │  │
│  └───────────────────────────┬────────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┴────────────────────────────┐  │
│  │                      SERVICE LAYER                     │  │
│  │  ┌─────────────────┐ ┌────────────────┐ ┌───────────┐  │  │
│  │  │  authService    │ │ reportsService │ │excelServ. │  │  │
│  │  └────────┬────────┘ └───────┬────────┘ └─────┬─────┘  │  │
│  └───────────┼──────────────────┼────────────────┼────────┘  │
└──────────────┼──────────────────┼────────────────┼───────────┘
               ▼                  ▼                ▼
     ┌───────────────────┐ ┌─────────────┐ ┌───────────────┐
     │ Firebase Auth     │ │ Firestore   │ │ XLSX Generator│
     │ / Local Fallback  │ │ Database    │ │ (.xlsx File)  │
     └───────────────────┘ └─────────────┘ └───────────────┘
```

### 3.1 Stack Teknologi
* **Framework**: Next.js 14.2 (React 18, TypeScript)
* **Styling**: Tailwind CSS dengan custom design system Pegadaian (warna hijau korporat `#107C41`, `#2E7D32`, aksen emas `#F59E0B`, dan dark slate `#0F172A`)
* **Database & Auth**: Firebase Firestore & Firebase Authentication (dengan otomatisasi *Local Storage Fallback Mode* saat offline)
* **Spreadsheet Engine**: `xlsx` (SheetJS)
* **Icons & Typografi**: Lucide React & Plus Jakarta Sans (Google Fonts)
* **Date Utilities**: Date-fns

---

## 4. STRUKTUR DIREKTORI PROYEK

```
├── public/                     # Aset statis (logo Pegadaian, preview gambar)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx        # Halaman Admin Control Center & Analytics
│   │   ├── globals.css         # Styling global, scrollbar kustom, animasi marquee
│   │   ├── layout.tsx          # Root layout membungkus AuthProvider
│   │   └── page.tsx            # Halaman Dashboard Petugas Desktop Support
│   ├── components/
│   │   ├── AdminUserManagement.tsx # Komponen Tab 3 Admin (Kelola Pengguna)
│   │   ├── AdminUserModal.tsx      # Modal Buat/Edit Pengguna oleh Admin
│   │   ├── AuthModal.tsx           # Modal Login, Register, & Lupa Password
│   │   ├── ConfirmModal.tsx        # Modal Konfirmasi Hapus Data
│   │   ├── ExportModal.tsx         # Modal Konfigurasi Siklus Export Excel
│   │   ├── Header.tsx              # Navigasi atas + status database + tombol akun
│   │   ├── ReportDetailModal.tsx   # Modal detail laporan read-only
│   │   ├── ReportFormModal.tsx     # Modal input/edit laporan tiket + SLA auto
│   │   ├── ReportTable.tsx         # Tabel laporan harian, filter kategori, search
│   │   ├── RunningTextBanner.tsx   # Banner teks berjalan keamanan & info sesi
│   │   └── Toast.tsx               # Notifikasi toast mengambang
│   ├── context/
│   │   └── AuthContext.tsx         # Global Context Auth, Inactivity Timer & Sync
│   ├── lib/
│   │   └── firebase.ts             # Inisialisasi Firebase App, Auth, & Firestore
│   ├── services/
│   │   ├── authService.ts          # Layanan autentikasi, registrasi & CRUD user
│   │   ├── excelService.ts         # Engine pembuatan multi-sheet XLSX
│   │   └── reportsService.ts       # CRUD operasi laporan harian
│   ├── types/
│   │   ├── report.ts               # Tipe data DailyReport, Category, Status, SLA
│   │   └── user.ts                 # Tipe data UserProfile, Payload Auth & Kanwil
│   └── utils/                      # Helper pemformatan tanggal, waktu & durasi
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── README.md
└── DOCUMENTATION.md
```

---

## 5. SPESIFIKASI FITUR & FUNGSIONALITAS (PRD)

### 5.1 Autentikasi & Keamanan Sesi (Session Security)
* **Sistem Silent Inactivity Timer**:
  * Durasi toleransi: **30 Menit (1.800.000 ms)**.
  * Event listener memantau: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, dan `click`.
  * Update timestamp throttled setiap 5 detik ke `localStorage` (`pegadaian_last_activity_v1`).
  * Jika durasi 30 menit terlampaui tanpa aktivitas, sistem otomatis memanggil fungsi `logout()`, membersihkan sesi, dan mengarahkan pengguna ke form login secara hening tanpa dialog pop-up yang mengganggu alur kerja.
* **Sinkronisasi Multi-Tab**:
  * Menggunakan pembacaan `localStorage` real-time, memastikan bahwa jika personil aktif di satu tab, sesi di tab lain tidak akan kedaluwarsa secara mendadak.
* **Dual-Mode Persistence**:
  * **Online**: Menggunakan Firebase Authentication token dan Firestore collection `user-reports`.
  * **Offline/Local Mode**: Menggunakan `localStorage` (`pegadaian_current_user_v1`) sehingga aplikasi tetap 100% fungsional saat demo atau tanpa internet.

### 5.2 Running Text Banner Dinamis
* **Lokasi**: Terpasang tetap di bawah bar navigasi utama ([Header.tsx](./src/components/Header.tsx)).
* **Konten Berjalan**:
  1. *Keamanan Sesi*: Pengingat proteksi Auto-Logout 30 menit.
  2. *Personil Aktif*: Sapaan dinamis mencantumkan `Nama Lengkap`, `Role`, dan `Kantor Wilayah / Unit Kerja`.
  3. *Prosedur Keamanan*: Imbauan untuk selalu mengklik tombol "Keluar" setelah selesai menggunakan perangkat bersama.
  4. *Tips Operasional*: Pengingat ekspor berkala dan pengisian tiket harian.
* **Interaktivitas**: Fitur **Pause on Hover** (animasi CSS marquee berhenti saat kursor mouse berada di atas teks).

### 5.3 Pelaporan Pekerjaan Harian (`/`)
* **Form Input & SLA Otomatis**:
  * Input: *Nama Pemohon, Unit Kerja, Deskripsi Masalah, Kategori, Metode Penanganan (Visit/Remote/Guide), Tanggal, Jam Mulai, Jam Selesai, Status (Solved/Pending/Progress)*.
  * Sistem menghitung selisih waktu mulai dan waktu selesai untuk menghasilkan kolom `Durasi Pengerjaan (SLA)`.
* **Kategori Masalah**:
  * `Hardware Kanwil`, `Software Kanwil`, `Network / Jaringan`, `Video Conference & Meeting`, `Malware & Security`, `Relokasi / Renovasi`, dan `Lainnya`.
* **Mobile-Responsive**:
  * Dukungan Bottom Sheet modal di perangkat seluler dengan tombol sticky submit dan Floating Action Button (FAB).

### 5.4 Panel Administrator & Control Center (`/admin`)
* **Tab 1: Statistik & Kinerja SLA**:
  * Distribusi SLA: Cepat (< 5 Menit), Normal (5-15 Menit), Kompleks (> 15 Menit).
  * Pie chart / visualisasi sebaran kategori masalah.
  * Leaderboard produktivitas personil IT Support se-Indonesia.
* **Tab 2: Monitoring Seluruh Laporan (Nasional)**:
  * Filter 2-Arah: Memilih Petugas otomatis mengunci Kanwil miliknya, dan memilih Kanwil menyaring daftar petugas di kanwil tersebut.
  * Dynamic category badge counters (angka pada tab kategori diperbarui secara live mengikuti filter yang diterapkan).
* **Tab 3: Manajemen Pengguna**:
  * Tambah/edit data personil, ganti role langsung, reset password pengguna, dan filter pencarian terintegrasi.

### 5.5 Engine Export Multi-Sheet Excel
* **Siklus Cut-Off Laporan**:
  * `[ 21 Lalu - 20 Ini ]` *(Format Cut-off Resmi Pegadaian)*
  * `[ 13 Lalu - 12 Ini ]`
  * `[ 1 - Akhir Bulan ]` *(Bulan Berjalan)*
  * `[ Hari Ini ]`, `[ 7 Hari Terakhir ]`, dan `[ Semua Data ]`.
* **Multi-Sheet Workbook**:
  * Laporan otomatis dikelompokkan ke dalam sheet terpisah: `Semua Laporan`, `Hardware Kanwil`, `Software Kanwil`, `Network-Jaringan`, `Video Conference`, `Malware`, `Relokasi-Renovasi`, dan `Lainnya`.

---

## 6. SKEMA DATA & TYPE DEFINITIONS

### 6.1 `DailyReport` ([src/types/report.ts](./src/types/report.ts))
```typescript
export interface DailyReport {
  id?: string;
  userId?: string;
  userName?: string;
  userKanwil?: string;
  date: string;               // YYYY-MM-DD
  requesterName: string;      // Nama pemohon tiket
  unitKerja: string;          // Bagian/Unit pemohon
  category: ReportCategory;   // Kategori pekerjaan
  handleMethod: HandleMethod; // Visit | Remote | Guide
  description: string;        // Deskripsi kendala
  solution: string;           // Langkah perbaikan
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  duration: string;           // HH:mm:ss (Dihitung otomatis)
  status: 'Solved' | 'Pending' | 'Progress';
  createdAt?: number;
  updatedAt?: number;
}
```

### 6.2 `UserProfile` ([src/types/user.ts](./src/types/user.ts))
```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  kanwil: string;             // Kanwil I s.d. XII atau Kantor Pusat
  unitKerja: string;
  nik?: string;
  role: 'Super Admin' | 'Admin' | 'Supervisor' | 'Desktop Support';
  createdAt: number;
  updatedAt: number;
}
```

---

## 7. DOKUMENTASI SERVICE LAYER

### 7.1 `authService` ([src/services/authService.ts](./src/services/authService.ts))
* `register(payload)`: Membuat akun baru di Firebase Auth dan dokumen Firestore `user-reports` (atau `localStorage`).
* `login(payload)`: Masuk menggunakan email atau nama lengkap.
* `getUserProfile(uid)`: Mengambil profil lengkap pengguna.
* `getAllUsers()`: Mengambil daftar seluruh personil terdaftar untuk Admin Panel.
* `adminSaveUser(payload)`: Menambah atau memperbarui profil personil dari sisi admin.
* `adminUpdateRole(uid, newRole)`: Mengubah peran akun secara instan.
* `logout()`: Membersihkan sesi Firebase dan menghapus timestamp aktivitas lokal.

### 7.2 `reportsService` ([src/services/reportsService.ts](./src/services/reportsService.ts))
* `getAllReports(uid?, name?)`: Mengambil daftar laporan (jika user non-admin, hanya mengambil laporan miliknya).
* `createReport(reportData, uid?)`: Menyimpan laporan baru ke Firestore/LocalStorage.
* `updateReport(id, reportData, uid?)`: Memperbarui isi laporan yang sudah ada.
* `deleteReport(id, uid?)`: Menghapus laporan.

### 7.3 `excelService` ([src/services/excelService.ts](./src/services/excelService.ts))
* `exportReportsToExcel(reports, cycleName, officerName?)`: Mengonversi daftar data array laporan menjadi workbook Excel `.xlsx` multi-sheet berformat resmi PT. Pegadaian.

---

## 8. CHANGELOG & PEMELIHARAAN

### Versi 1.2.0 (September 2026)
* ✨ **Penambahan Keamanan Sesi**: Implementasi background *Inactivity Auto-Logout* 30 menit tanpa dialog pop-up yang mengganggu.
* 📢 **Running Text Header Banner**: Penambahan komponen teks berjalan interaktif dengan fitur *Pause on Hover* yang menampilkan info sesi aktif dan identitas personil.
* 🔄 **Multi-Tab Sync**: Sinkronisasi aktivitas sesi antar-tab browser secara real-time.

---

*Dokumentasi ini dikembangkan dan dikelola untuk mendukung operasional IT PT. Pegadaian.*  
*Copyright © 2026 Alzi Rahmana Putra. All Rights Reserved.*
