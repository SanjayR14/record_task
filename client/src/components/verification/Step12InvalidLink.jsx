'use client';

import React, { useContext } from 'react';
import invalidSvg from '@/assets/invalid.svg';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

export const Step12InvalidLink = () => {
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations();

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center py-10 sm:py-14 px-6 select-none font-sans">
      <div />

      <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-[280px] mx-auto my-auto">
        <img
          src={invalidSvg?.src || invalidSvg}
          alt="Invalid link"
          className="w-[72px] h-[72px] select-none mb-1"
          draggable={false}
        />

        <h2 className="text-xl sm:text-lg font-semibold text-slate-900 tracking-tight">
          {t.step12.title}
        </h2>

        <p className="text-medium sm:text-[13px] text-slate-500 font-normal leading-relaxed">
          {t.step12.body}
        </p>

        <div className="pt-1 flex justify-center">
          <ReadAgainButton text={`${t.step12.title}. ${t.step12.body}`} />
        </div>
      </div>

      <div className="text-[11px] text-neutral-400 font-normal text-center pb-2">
        {t.step12.closeWindow}
      </div>
    </div>
  );
};

export default Step12InvalidLink;
