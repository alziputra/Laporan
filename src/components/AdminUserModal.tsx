'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile, KANWIL_LIST, USER_ROLES, AdminUserSavePayload } from '@/types/user';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AdminUserSavePayload) => Promise<void>;
  initialUser?: UserProfile | null;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialUser
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [nik, setNik] = useState('');
  const [kanwil, setKanwil] = useState(KANWIL_LIST[0]);
  const [unitKerja, setUnitKerja] = useState('');
  const [role, setRole] = useState<string>('Desktop Support');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEditing = Boolean(initialUser && initialUser.uid);

  useEffect(() => {
    if (initialUser) {
      setDisplayName(initialUser.displayName || '');
      setEmail(initialUser.email || '');
      setNik(initialUser.nik || '');
      setKanwil((initialUser.kanwil as any) || KANWIL_LIST[0]);
      setUnitKerja(initialUser.unitKerja || '');
      setRole(initialUser.role || 'Desktop Support');
      setPassword('');
    } else {
      setDisplayName('');
      setEmail('');
      setNik('');
      setKanwil(KANWIL_LIST[0]);
      setUnitKerja('');
      setRole('Desktop Support');
      setPassword('');
    }
    setErrorMessage('');
  }, [initialUser, isOpen]);

  // Auto-generate unit kerja if not manually modified
  const handleKanwilChange = (selectedKanwil: string) => {
    setKanwil(selectedKanwil as any);
    if (!unitKerja || unitKerja.includes('Kanwil')) {
      setUnitKerja(`${selectedKanwil} - ${displayName || 'User'}`);
    }
  };

  const handleNameChange = (val: string) => {
    setDisplayName(val);
    if (!unitKerja || unitKerja.includes('Kanwil')) {
      setUnitKerja(`${kanwil} - ${val}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Email aktif dan valid wajib diisi.');
      return;
    }
    if (!isEditing && (!password || password.length < 6)) {
      setErrorMessage('Kata sandi minimal 6 karakter untuk akun baru.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        uid: initialUser?.uid,
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        nik: nik.trim(),
        kanwil,
        unitKerja: unitKerja.trim() || `${kanwil} - ${displayName.trim()}`,
        role,
        password: password || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[86vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {isEditing ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isEditing ? 'Perbarui data profil & hak akses user' : 'Daftarkan personel Desktop Support / Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap Personel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Email & NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Perusahaan / Login <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@pegadaian.co.id"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIK / No. Induk Karyawan
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Contoh: P12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Kantor Wilayah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kantor Wilayah (Kanwil) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={kanwil}
                onChange={(e) => handleKanwilChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                {KANWIL_LIST.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Kerja Detail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Unit Kerja / Jabatan Lengkap
            </label>
            <input
              type="text"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              placeholder="Contoh: Kanwil VIII - Support Helpdesk"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Hak Akses / Role Pengguna <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {USER_ROLES.map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 text-center ${
                      isSelected
                        ? 'bg-pegadaian-50 border-pegadaian-600 text-pegadaian-800 shadow-sm ring-1 ring-pegadaian-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{r}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {r === 'Admin' ? 'Akses Penuh' : r === 'Supervisor' ? 'Review & Pantau' : 'Pelapor Harian'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password field (Mandatory for new user, optional for edit) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isEditing ? 'Ganti Kata Sandi (Kosongkan jika tidak ingin diubah)' : 'Kata Sandi Awal *'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Masukkan sandi baru jika ingin reset' : 'Minimal 6 karakter'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pegadaian-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pegadaian-600 hover:bg-pegadaian-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Pengguna'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
