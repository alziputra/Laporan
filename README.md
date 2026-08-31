# 🏢 Pegadaian IT Support Daily Reporting & Executive Dashboard

<p align="left">
  <img src="https://img.shields.io/badge/NEXT.JS%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TYPESCRIPT%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/REACT%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/FIREBASE%2012-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/TAILWIND%20CSS%204-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/EXCELJS-1E7145?style=for-the-badge&logo=microsoftexcel&logoColor=white" alt="ExcelJS" />
</p>

Aplikasi Web Pelaporan Pekerjaan Harian & Control Center Monitoring Nasional untuk **Desktop Support PT. Pegadaian**.

Developed with ❤️ by **Alzi Rahmana Putra** © 2026  
🔗 **Live Demo**: [https://laporan-pekerjaan-one.vercel.app/](https://laporan-pekerjaan-one.vercel.app/)

---

## 📸 Tampilan Aplikasi

### 🛡️ Panel Administrator (`/admin`)
| 📊 Statistik & Kinerja SLA | 📋 Monitoring Seluruh Laporan |
| :---: | :---: |
| ![Admin Statistik & Kinerja SLA](./public/admin-1.jpeg) | ![Admin Monitoring Seluruh Laporan](./public/admin-2.jpeg) |

### 💻 Halaman Desktop Support (`/`)
| 📝 Tabel Pekerjaan Harian | 📥 Modal Export Multi-Sheet Excel |
| :---: | :---: |
| ![User Pelaporan Harian](./public/user-1.jpeg) | ![User Export Laporan](./public/user-2.jpeg) |

---

## 🌟 Fitur Utama

### 1. 🛡️ Executive Admin Dashboard & Control Center (`/admin`)
Halaman khusus manajemen dan monitoring tingkat eksekutif dengan 3 tab navigasi terpadu:

* **📈 Tab 1: Statistik & Kinerja SLA (Default View)**
  * **Sebaran Kategori Issue**: Visualisasi persentase issue terbanyak (Hardware, Software, Network, Meeting, Malware, Relokasi).
  * **Distribusi Kecepatan SLA**: Pengelompokan respons waktu (*⚡ Super Cepat < 5 Menit*, *Standar 5–15 Menit*, *Kompleks > 15 Menit*).
  * **Leaderboard Personil IT Support**: Peringkat produktivitas petugas IT Support se-Indonesia berdasarkan jumlah tiket yang diselesaikan.
* **📋 Tab 2: Monitoring Seluruh Laporan (Nasional)**
  * **Sinkronisasi Filter 2-Arah**: Memilih Petugas IT Support otomatis menyinkronkan Kanwil, dan memilih Kanwil otomatis menyaring daftar personil di wilayah tersebut.
  * **Dynamic Category Pill Counters**: Angka badge pada tombol kategori (*Hardware, Software, dll.*) otomatis menghitung data secara dinamis mengikuti filter aktif.
  * **Kartu KPI Dinamis**: Total Laporan, Laporan Hari Ini, Rata-Rata Durasi SLA, dan Petugas Terlibat.
  * **Mode Tinjauan Read-Only**: Admin dapat meninjau detail tiket dengan proteksi anti-hapus dan anti-edit.
* **👥 Tab 3: Manajemen Pengguna & Hak Akses**
  * Pengelolaan akun (*Super Admin, Admin, Supervisor, Desktop Support*).
  * Quick Role Changer & Direct Password Reset.
  * Filter pencarian NIK, Nama, Email, Unit Kerja, dan Kantor Wilayah (Kanwil I - XII + Kantor Pusat).
  * Export data master pengguna ke Excel.

---

### 2. 📝 Pelaporan Pekerjaan Harian Desktop Support (`/`)
Halaman kerja harian personil IT Support di lapangan:
* **Input Cepat & Perhitungan Otomatis SLA**:
  * Form input lengkap: `Nama Pemohon`, `Unit Kerja`, `Deskripsi Permohonan`, `Metode Penanganan` (*Visit*, *Remote*, *Guide*), `Solusi Issue`, `Tanggal Pengerjaan`, `Waktu Mulai`, dan `Waktu Selesai`.
  * Durasi pengerjaan / SLA dihitung otomatis dalam format `HH:mm:ss`.
* **Desain Mobile-Friendly & Bottom Sheet**:
  * Form input dengan model Bottom Sheet khusus layar HP dengan tombol sticky `Simpan Laporan`.
  * **Floating Action Button (FAB)** di sudut kanan bawah untuk input cepat.
* **Live Search & Category Filter**:
  * Pencarian instan berdasarkan nama pemohon, solusi, atau unit kerja.
  * Kategori pekerjaan: `Hardware Kanwil`, `Software Kanwil`, `Network / Jaringan`, `Video Conference & Meeting`, `Malware & Security`, `Relokasi / Renovasi`, `Lainnya`.

---

### 3. 📊 Export Multi-Sheet Excel Resmi PT. Pegadaian
* **Pilihan Cepat Siklus Cut-Off Laporan**:
  * `[ 21 Lalu - 20 Ini ]` *(Siklus Standar Pegadaian)*
  * `[ 13 Lalu - 12 Ini ]`
  * `[ 1 - Akhir Bln ]` *(Bulan Berjalan)*
  * `[ Hari Ini ]`
  * `[ 7 Hari Terakhir ]`
  * `[ Semua Data ]`
* **Multi-Sheet Workbook Output**:
  * Seluruh kategori otomatis dipecah ke dalam sheet terpisah: `Semua Laporan`, `Hardware Kanwil`, `Software Kanwil`, `Network-Jaringan`, `Video Conference`, `Malware`, `Relokasi-Renovasi`, dan `Lainnya`.
  * Header laporan resmi berstandar korporat PT. Pegadaian lengkap dengan penomoran urut dan ringkasan SLA.
* **Penyaringan Cerdas Sesuai Peran**:
  * Pada halaman `/admin`: Dilengkapi dropdown pemilihan Petugas IT Support dengan live ticket counter.
  * Pada halaman `/`: Disederhanakan untuk langsung mengunduh laporan milik user yang sedang aktif.

---

### 4. 🔐 Autentikasi & Role-Based Access Control (RBAC)
* **Silent Role Guard**:
  * Akun dengan peran **Admin** yang login di `/` otomatis diarahkan (*silent redirect*) ke `/admin`.
  * Akun non-admin yang mencoba mengakses `/admin` otomatis dialihkan ke `/` tanpa memunculkan layar error.
* Sinkronisasi data real-time berbasis Firebase Firestore dengan *fallback* aman ke LocalStorage saat offline.

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/alziputra/Laporan.git
cd Laporan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buat file `.env` di root direktori project:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=Xxxxxx...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=Xxxxxx...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=Xxxxxx...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=Xxxxxx...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=Xxxxxx...
NEXT_PUBLIC_FIREBASE_APP_ID=Xxxxxx...
```

### 4. Jalankan Development Server
```bash
npm run dev
```

Buka browser di:
* Dashboard Petugas IT: [http://localhost:3000](http://localhost:3000)
* Admin Control Center: [http://localhost:3000/admin](http://localhost:3000/admin)

---


## 📄 Lisensi & Kontribusi

Dikembangkan khusus untuk mendukung operasional divisi OITI **Kantor Wilayah PT. Pegadaian**.  
Copyright © 2026 **Alzi Rahmana Putra**. All Rights Reserved.
