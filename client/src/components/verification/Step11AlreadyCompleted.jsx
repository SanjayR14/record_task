'use client';

import React, { useContext } from 'react';
import { ShieldAlert, Timer } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

export const Step11AlreadyCompleted = () => {
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations();

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Assistant Bubble 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FEF9C3] text-[#EAB308] text-xs font-medium w-full">
            <ShieldAlert className="w-4 h-4 text-[#EAB308] shrink-0" />
            <span className="text-sm sm:text-medium">{t.step11.banner}</span>
          </div>
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            {t.step11.body}
          </p>
          <ReadAgainButton text={`${t.step11.banner}. ${t.step11.body}`} />
        </div>

        {/* Assistant Bubble 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-2">
          <div className="flex items-center gap-1.5 text-medium sm:text-[13px] font-medium text-[#F97316]">
            <Timer className="w-4 h-4 text-[#F97316] shrink-0" />
            <span>{t.step11.nextTitle}</span>
          </div>
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            {t.step11.nextBody}
          </p>
          <ReadAgainButton text={`${t.step11.nextTitle} ${t.step11.nextBody}`} />
        </div>

        {/* Assistant Bubble 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-1.5">
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            {t.step11.closeWindow}
          </p>
          <ReadAgainButton text={t.step11.closeWindow} />
        </div>
      </div>
    </div>
  );
};

export default Step11AlreadyCompleted;
