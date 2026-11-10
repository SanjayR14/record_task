'use client';

import React, { useState, useContext } from 'react';
import { Globe, HelpCircle, Languages, X, Check } from 'lucide-react';
import recordLockup from '@/assets/record-lockup.svg';
import VerificationContext from '@/context/VerificationContext';
import { LANGUAGES, getLanguageConfig, getTranslations } from '@/i18n/translations';

/**
 * Record verification header
 */
export const VerificationHeader = ({
  onChangeLanguage,
  onSelectLanguage,
  onNeedHelp,
  totalSteps = 5,
  currentStep = 0,
  isLanguageScreen = false,
  isAlreadyCompletedScreen = false
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const ctx = useContext(VerificationContext);
  const activeLang = ctx?.langConfig || getLanguageConfig('en');
  const t = ctx?.t || getTranslations('en');

  const pillBase =
    'min-w-0 w-full flex items-center justify-center gap-2 rounded-xl border ' +
    'h-11 sm:h-12 px-3 text-sm sm:text-[15px] font-medium transition-colors cursor-pointer ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

  const handleOpenLanguagePicker = () => {
    if (onSelectLanguage) {
      setShowLanguageModal(true);
    } else if (onChangeLanguage) {
      onChangeLanguage();
    } else {
      setShowLanguageModal(true);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-black text-white z-40 select-none shadow-md">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-4">
          {/* Brand row */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              aria-hidden="true"
              className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white flex items-center justify-center text-xl sm:text-2xl leading-none"
            >
              R
            </div>
            <img
              src={recordLockup?.src || recordLockup}
              alt="Record – Skill verification process. Powered by Record"
              className="flex-1 min-w-0 h-auto w-full max-w-[340px] sm:max-w-[380px]"
              draggable={false}
            />
          </div>

          {/* Action pills */}
          {isAlreadyCompletedScreen ? (
            <div>
              <button
                type="button"
                onClick={handleOpenLanguagePicker}
                className={`${pillBase} bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]`}
              >
                <Languages className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{t.header.changeLanguage}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLanguageScreen}
                onClick={() => {
                  if (isLanguageScreen) return;
                  handleOpenLanguagePicker();
                }}
                className={`${pillBase} ${
                  isLanguageScreen
                    ? 'bg-[#1a1a1a] border-[#262626] text-neutral-500 cursor-default opacity-60'
                    : 'bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]'
                }`}
              >
                <Languages className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{t.header.changeLanguage}</span>
              </button>

              <button
                type="button"
                onClick={() => (onNeedHelp ? onNeedHelp() : setShowHelpModal(true))}
                className={`${pillBase} bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]`}
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{t.header.needHelp}</span>
              </button>
            </div>
          )}

          {/* Progress segments: hidden on already completed screen */}
          {!isAlreadyCompletedScreen && (
            <div
              className="flex gap-2 select-none"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-valuenow={currentStep}
              aria-label="Verification progress"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  draggable={false}
                  className={`flex-1 h-[3px] rounded-full transition-colors duration-300 pointer-events-none select-none ${
                    i < currentStep ? 'bg-[#FF5723]' : 'bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Candidate Support Modal */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-[#FF5723]" />
                <h3 className="font-bold text-slate-900 text-base">{t.header.supportTitle}</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>{t.header.supportHeading}</strong>
              </p>
              <p>{t.header.supportBody1}</p>
              <p>{t.header.supportBody2}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#FF5723] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#F4511E]"
            >
              {t.header.backToVerification}
            </button>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-[#FF5723]" />
                <h3 className="font-bold text-slate-900 text-base">{t.header.languageModalTitle}</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">{t.header.languageModalSubtitle}</p>

            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = activeLang.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      if (onSelectLanguage) onSelectLanguage(lang.id);
                      else if (ctx?.setSelectedLanguage) ctx.setSelectedLanguage(lang.id);
                      setShowLanguageModal(false);
                    }}
                    className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#00A63E] bg-emerald-50/40'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#EEF0F8] text-[#3B5BDB] flex items-center justify-center text-sm font-extrabold">
                      {lang.code}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="text-xs font-bold text-slate-900 truncate">{lang.name}</span>
                      <span className="text-[10px] text-slate-400 truncate">{lang.sub}</span>
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00A63E] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t.header.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationHeader;
