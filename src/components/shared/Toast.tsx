'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 2500,
  onClose 
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-200 w-auto max-w-md px-4 pointer-events-auto">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md transition-all ${
        type === 'success'
          ? 'bg-pegadaian-700/95 text-white border-pegadaian-500 ring-4 ring-pegadaian-600/20'
          : 'bg-red-800/95 text-white border-red-600 ring-4 ring-red-600/20'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
        )}
        <span className="whitespace-nowrap">{message}</span>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
