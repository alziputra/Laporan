'use client';

import React from 'react';
import { 
  Monitor, 
  Code, 
  Wifi, 
  Video, 
  ShieldAlert, 
  Building2, 
  ClipboardList,
  Layers
} from 'lucide-react';
import { ReportCategory, DailyReport } from '@/types/report';

interface CategoryGridProps {
  reports: DailyReport[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAddModalWithCategory: (category: ReportCategory) => void;
}

interface CategoryDef {
  name: ReportCategory;
  icon: React.ReactNode;
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Hardware Kanwil', icon: <Monitor className="w-4 h-4" /> },
  { name: 'Software Kanwil', icon: <Code className="w-4 h-4" /> },
  { name: 'Network/Jaringan', icon: <Wifi className="w-4 h-4" /> },
  { name: 'Video Confference & Meeting', icon: <Video className="w-4 h-4" /> },
  { name: 'Malware', icon: <ShieldAlert className="w-4 h-4" /> },
  { name: 'Relokasi/Renovasi', icon: <Building2 className="w-4 h-4" /> },
  { name: 'Lainnya', icon: <ClipboardList className="w-4 h-4" /> },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  reports,
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryCount = (catName: string) => {
    return reports.filter(r => r.category === catName).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-pegadaian-600" />
          <span>Kategori Troubleshoot</span>
        </h2>
        <span className="text-xs text-slate-400">
          Pilih kategori untuk memfilter tabel
        </span>
      </div>

      {/* Horizontal Button Pills Bar with Mobile Touch Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
        {/* 'Semua' Button */}
        <button
          type="button"
          onClick={() => onSelectCategory('Semua')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            selectedCategory === 'Semua'
              ? 'bg-pegadaian-600 text-white shadow-sm ring-2 ring-pegadaian-500/30'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Semua Kategori</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
            selectedCategory === 'Semua' 
              ? 'bg-white/20 text-white' 
              : 'bg-slate-200 text-slate-700'
          }`}>
            {reports.length}
          </span>
        </button>

        {/* Individual Category Buttons */}
        {CATEGORIES.map((cat) => {
          const count = getCategoryCount(cat.name);
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-pegadaian-600 text-white shadow-sm ring-2 ring-pegadaian-500/30'
                  : 'bg-white border border-slate-200 hover:border-pegadaian-400 hover:bg-pegadaian-50/50 text-slate-700'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-pegadaian-600'}>
                {cat.icon}
              </span>
              <span>{cat.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isSelected 
                  ? 'bg-white/20 text-white' 
                  : count > 0
                  ? 'bg-pegadaian-100 text-pegadaian-800'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
