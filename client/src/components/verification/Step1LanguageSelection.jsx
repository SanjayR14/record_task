'use client';

import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { LANGUAGES, getLanguageConfig, getTranslations } from '@/i18n/translations';

export const Step1LanguageSelection = ({ onContinue }) => {
  const ctx = useContext(VerificationContext);
  const selectedId = ctx?.langConfig?.id || 'en';
  const t = ctx?.t || getTranslations();

  const handleSelect = (lang) => {
    if (ctx?.setSelectedLanguage) {
      ctx.setSelectedLanguage(lang.id);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* Bubble 1 – greeting */}
        <div className="bg-white rounded-xl px-4 py-3.5 max-w-[80%] sm:max-w-[70%] space-y-1.5">
          <p className="text-medium sm:text-base font-medium text-slate-900 leading-snug">
            {t.step1.greeting}
          </p>
          <ReadAgainButton text={t.step1.greeting} />
        </div>

        {/* Bubble 2 – question */}
        <div className="bg-white rounded-xl px-4 py-3.5 space-y-1">
          <h2 className="text-medium sm:text-base font-medium text-black leading-snug">
            {selectedId === 'en' ? (
              <>
                Which <strong className="font-bold text-[#09090B]">language</strong> would you like to
                <br />
                continue in?
              </>
            ) : (
              t.step1.questionFull
            )}
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-[13px] text-slate-500">{t.step1.selectLanguage}</p>
            {ctx?.isTranslating && (
              <span className="text-[11px] text-[#FF5723] font-medium animate-pulse">
                Translating...
              </span>
            )}
          </div>
        </div>

        {/* Language cards (all 6 languages active) */}
        <div className="grid grid-cols-2 gap-4 pt-1" role="radiogroup" aria-label="Language">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedId === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(lang)}
                className={`relative min-w-0 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white text-left cursor-pointer transition-colors border ${isSelected
                  ? 'border-[#00A63E]'
                  : 'border-transparent hover:bg-stone-50'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A63E]`}
              >
                <span className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#EEF0F8] text-[#3B5BDB] flex items-center justify-center text-sm sm:text-base font-extrabold">
                  {lang.code}
                </span>
                <span className="min-w-0 flex flex-col">
                  <span className="text-sm sm:text-[15px] font-bold text-slate-900 leading-tight truncate">
                    {lang.name}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 leading-tight truncate">
                    {lang.sub}
                  </span>
                </span>

                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00A63E] text-white flex items-center justify-center ring-2 ring-[#F1EADF]">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            const cfg = getLanguageConfig(selectedId);
            onContinue({ language: cfg.id });
          }}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-base rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5723]/60 focus-visible:ring-offset-2"
        >
          {t.common.continue}
        </button>
      </div>
    </div>
  );
};

export default Step1LanguageSelection;
