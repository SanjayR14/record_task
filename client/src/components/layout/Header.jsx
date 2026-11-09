import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Header = () => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base block">
              RECORD TECHNOLOGY LABS
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
              Mobile Video Verification Flow
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Phase 1 Active
          </span>
        </div>
      </div>
    </header>
  );
};

