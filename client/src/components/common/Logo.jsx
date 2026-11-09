import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Logo = ({ size = 'default', showSubtitle = true }) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className="flex items-center space-x-2.5">
      <div
        className={`rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
          isSmall ? 'w-7 h-7' : isLarge ? 'w-11 h-11' : 'w-9 h-9'
        }`}
      >
        <ShieldCheck className={isSmall ? 'w-4 h-4' : isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
      </div>
      <div>
        <span
          className={`font-black tracking-tight text-slate-900 leading-tight block uppercase ${
            isSmall ? 'text-xs' : isLarge ? 'text-lg' : 'text-sm'
          }`}
        >
          Record Technology Labs
        </span>
        {showSubtitle && (
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-normal block">
            Mobile Video Verification
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;

