'use client';

import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { getLanguageConfig, getTranslations } from '@/i18n/translations';
import { renderBoldPhrases } from '@/utils/formatBoldText';

const Bubble = ({ children, speech }) => (
  <div className="bg-white rounded-xl px-4 py-3.5 max-w-[88%] sm:max-w-[80%] space-y-2">
    <p className="text-medium sm:text-base text-black leading-relaxed font-medium">{children}</p>
    <ReadAgainButton text={speech} />
  </div>
);

export const Step2Instructions = ({ onContinue }) => {
  const ctx = useContext(VerificationContext);
  const selectedLanguage = ctx?.langConfig || getLanguageConfig('en');
  const t = ctx?.t || getTranslations('en');

  const continuingText = t.step2.continuingIn(selectedLanguage.name);

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* User reply – selected language (right aligned) */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-slate-500">{t.step2.selectedLanguageLabel}</span>
          <div className="relative flex items-center gap-3 w-[62%] max-w-[260px] p-2.5 sm:p-3 rounded-xl bg-white border border-[#00A63E]">
            <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#EEF0F8] text-[#3B5BDB] flex items-center justify-center text-sm font-bold">
              {selectedLanguage.code}
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight truncate">
                {selectedLanguage.name}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight truncate">
                {selectedLanguage.sub}
              </span>
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00A63E] text-white flex items-center justify-center ring-2 ring-[#F1EADF]">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* Assistant 1 */}
        <Bubble speech={continuingText}>
          {renderBoldPhrases(continuingText, [selectedLanguage.name, selectedLanguage.sub])}
        </Bubble>

        {/* Terms notice (renders translated sentence with clickable Terms & Privacy links) */}
        <div className="mx-1 px-3 py-2.5 rounded-lg bg-[#FFF6CC] text-[10px] sm:text-[11px] text-[#6B5A1E] text-center leading-snug">
          {(t.step2.termsSentence || '')
            .split(/(\{\{terms\}\}|\{\{privacy\}\})/g)
            .map((part, idx) => {
              if (part === '{{terms}}') {
                return (
                  <a key={idx} href="#terms" className="underline font-medium text-[#2563EB]">
                    {t.step2.termsWord}
                  </a>
                );
              }
              if (part === '{{privacy}}') {
                return (
                  <a key={idx} href="#privacy" className="underline font-medium text-[#2563EB]">
                    {t.step2.privacyWord}
                  </a>
                );
              }
              return <React.Fragment key={idx}>{part}</React.Fragment>;
            })}
        </div>

        {/* Assistant 2 – role */}
        <Bubble speech={t.step2.roleSpeech}>
          {renderBoldPhrases(t.step2.roleSpeech, ['Warehouse Picker role'])}
        </Bubble>

        {/* Assistant 3 – format */}
        <Bubble speech={t.step2.formatSpeech}>
          {renderBoldPhrases(t.step2.formatSpeech, ['3 quick questions'])}
        </Bubble>

        {/* Assistant 4 – duration & recruiter */}
        <Bubble speech={t.step2.durationSpeech}>
          {renderBoldPhrases(t.step2.durationSpeech, ['5 to 10 minutes'])}
        </Bubble>

        {/* Assistant 5 – privacy */}
        <Bubble speech={t.step2.privacySpeech}>
          {renderBoldPhrases(t.step2.privacySpeech, ['camera and mic'])}
        </Bubble>
      </div>

      {/* Continue */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-base rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5723]/60 focus-visible:ring-offset-2"
        >
          {t.common.continue}
        </button>
      </div>
    </div>
  );
};

export default Step2Instructions;
