import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export const LoadingScreen = ({ message = 'Validating verification link...' }) => {
  return (
    <div className="w-full min-h-[380px] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <Loader2 className="w-20 h-20 text-blue-600 absolute animate-spin opacity-40" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{message}</h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Checking your unique candidate token and loading saved session progress...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;

