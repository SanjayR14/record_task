import React, { useState } from 'react';
import { Check } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';

const GREETING = "Hi! I'm your verification guide from Record.";

export const Step1LanguageSelection = ({ onContinue }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showTooltip, setShowTooltip] = useState(false);

  const languages = [
    { id: 'en', code: 'A', name: 'English', sub: 'English', enabled: true },
    { id: 'hi', code: 'अ', name: 'हिन्दी', sub: 'Hindi', enabled: false },
    { id: 'ta', code: 'அ', name: 'தமிழ்', sub: 'Tamil', enabled: false },
    { id: 'te', code: 'అ', name: 'తెలుగు', sub: 'Telugu', enabled: false },
    { id: 'kn', code: 'ಅ', name: 'ಕನ್ನಡ', sub: 'Kannada', enabled: false },
    { id: 'ml', code: 'അ', name: 'മലയാളം', sub: 'Malayalam', enabled: false },
  ];

  const handleSelect = (lang) => {
    if (!lang.enabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
      return;
    }
    setSelectedLanguage(lang.name);
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* Bubble 1 – greeting */}
        <div className="bg-white rounded-xl px-4 py-3.5 max-w-[80%] sm:max-w-[70%] space-y-1.5">
          <p className="text-medium sm:text-base font-medium text-slate-900 leading-snug">
            {GREETING}
          </p>
          <ReadAgainButton text={GREETING} />
        </div>

        {/* Bubble 2 – question */}
        <div className="bg-white rounded-xl px-4 py-3.5 space-y-1">
          <h2 className="text-medium sm:text-base font-medium text-slate-900 leading-snug">
            Which <strong className="font-bold">language</strong> would you like to
            <br></br>continue in?
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500">Select language</p>
        </div>

        {/* Language cards */}
        <div className="grid grid-cols-2 gap-4 pt-1" role="radiogroup" aria-label="Language">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.name;
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

        {showTooltip && (
          <div
            role="status"
            className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium"
          >
            Only English is available for this verification onboarding task.
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onContinue({ language: selectedLanguage })}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-base rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5723]/60 focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step1LanguageSelection;