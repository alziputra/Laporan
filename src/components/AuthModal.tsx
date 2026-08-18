'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KANWIL_LIST } from '@/types/user';
import {
  X,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Send
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'forgot';
  onSuccess?: (message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess
}) => {
  const { login, register, resetPasswordEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Common State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [kanwil, setKanwil] = useState<string>(KANWIL_LIST[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setNameOrEmail('');
    setDisplayName('');
    setEmail('');
    setKanwil(KANWIL_LIST[0]);
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!nameOrEmail || !password) {
          throw new Error('Harap isi Nama / Email dan Kata Sandi.');
        }
        await login({ nameOrEmail: nameOrEmail.trim(), password });
        if (onSuccess) onSuccess('Berhasil masuk ke akun Anda!');
        onClose();
        resetForm();
      } else if (activeTab === 'register') {
        // Register: Nama Lengkap, Email Aktif, Kantor Wilayah, Password, Konfirmasi Password
        if (!displayName.trim()) {
          throw new Error('Harap isi Nama Lengkap Anda.');
        }
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Harap masukkan Alamat Email Aktif yang valid.');
        }
        if (!kanwil) {
          throw new Error('Harap pilih Kantor Wilayah.');
        }
        if (!password) {
          throw new Error('Harap isi Kata Sandi.');
        }
        if (password.length < 6) {
          throw new Error('Kata sandi minimal 6 karakter.');
        }
        if (password !== confirmPassword) {
          throw new Error('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
        }

        await register({
          displayName: displayName.trim(),
          email: email.trim(),
          kanwil,
          password
        });

        if (onSuccess) onSuccess('Pendaftaran akun berhasil!');
        onClose();
        resetForm();
      } else {
        // Forgot Password via Email
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Harap masukkan Alamat Email Aktif terdaftar Anda.');
        }
        await resetPasswordEmail(email.trim());
        setSuccessMsg(`Instruksi reset kata sandi telah dikirim ke email: ${email.trim()}`);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Nama Lengkap/Email atau Kata Sandi salah.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Alamat email ini sudah terdaftar. Silakan login.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">

        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-pegadaian-800 via-pegadaian-700 to-pegadaian-800 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-2xl shadow-md border border-emerald-100">
              <img src="/logo-pegadaian2.png" alt="Pegadaian" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Portal Akses Support</h2>
              <p className="text-xs text-emerald-100/90 font-medium">Sistem Laporan Desktop Support Pegadaian</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {activeTab !== 'forgot' ? (
            <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'login'
                  ? 'bg-white text-pegadaian-800 shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
                  }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk (Login)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab('register')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'register'
                  ? 'bg-white text-pegadaian-800 shadow-md'
                  : 'text-emerald-100 hover:text-white hover:bg-white/5'
                  }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Akun</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className="text-xs font-bold text-emerald-100 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <>
              {/* Login Field: Nama Lengkap / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap / Email Aktif <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: nama anda atau email anda"
                    value={nameOrEmail}
                    onChange={(e) => setNameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                </div>
              </div>

              {/* Login Field: Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('forgot')}
                    className="text-[11px] text-pegadaian-700 hover:text-pegadaian-800 font-bold hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'register' && (
            <>
              {/* 1. Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Alzi Rahmana Putra"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                </div>
              </div>

              {/* 2. Email Aktif */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Aktif <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: alziputra@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                </div>
              </div>

              {/* 3. Kantor Wilayah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kantor Wilayah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                  <select
                    value={kanwil}
                    onChange={(e) => setKanwil(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all appearance-none cursor-pointer"
                  >
                    {KANWIL_LIST.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 5. Konfirmasi Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi"
                    value={password ? confirmPassword : ''}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'forgot' && (
            <>
              <div className="text-left space-y-1">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-pegadaian-600" />
                  <span>Reset Kata Sandi Akun</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Masukkan Email Aktif terdaftar Anda. Kami akan mengirimkan link untuk menyetel ulang kata sandi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Aktif Terdaftar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pegadaian-500/20 focus:border-pegadaian-600 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Firestore Notice Badge */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/70">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data tersimpan di <strong className="text-emerald-700 font-semibold">Firestore (user-reports)</strong></span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-pegadaian-600 to-pegadaian-700 hover:from-pegadaian-700 hover:to-pegadaian-800 text-white font-extrabold rounded-xl shadow-lg shadow-pegadaian-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : activeTab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            ) : activeTab === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftarkan Akun Baru</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Link Reset Password</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Switch Link */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          {activeTab === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => handleSwitchTab('register')}
                className="text-pegadaian-700 font-bold hover:underline"
              >
                Daftar di sini
              </button>
            </p>
          ) : activeTab === 'register' ? (
            <p>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className="text-pegadaian-700 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p>
              Sudah ingat kata sandi?{' '}
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className="text-pegadaian-700 font-bold hover:underline"
              >
                Kembali ke Login
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
