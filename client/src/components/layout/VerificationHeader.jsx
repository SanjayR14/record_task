import React, { useState } from 'react';
import { Globe, HelpCircle, Languages, X } from 'lucide-react';
// The SVG already contains: "Record ✓", "Skill verification process" and "Powered by record".
import recordLockup from '../../assets/record-lockup.svg';

/**
 * Record verification header
 * - Full-width black bar, content centred and capped at max-w-2xl
 * - Row 1: "R" avatar + brand lockup SVG (scales with screen width)
 * - Row 2: Change Language (muted on language screen, active on others) + Need Help (active)
 * - Row 3: Step progress segments (0 initially, fills with #FF5723 upon progression)
 * - Fixed static position at top of viewport so scrolling content hides underneath
 */
export const VerificationHeader = ({
  onChangeLanguage,
  onNeedHelp,
  totalSteps = 5,
  currentStep = 0, // number of active/completed segments to highlight (0 to totalSteps)
  isLanguageScreen = false,
  isAlreadyCompletedScreen = false
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const pillBase =
    'min-w-0 w-full flex items-center justify-center gap-2 rounded-xl border ' +
    'h-11 sm:h-12 px-3 text-sm sm:text-[15px] font-medium transition-colors cursor-pointer ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

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
              src={recordLockup}
              alt="Record – Skill verification process. Powered by Record"
              className="flex-1 min-w-0 h-auto w-full max-w-[340px] sm:max-w-[380px]"
              draggable={false}
            />
          </div>

          {/* Action pills: on already completed screen, only Change Language is shown full-width */}
          {isAlreadyCompletedScreen ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  if (onChangeLanguage) {
                    onChangeLanguage();
                  } else {
                    setShowLanguageModal(true);
                  }
                }}
                className={`${pillBase} bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]`}
              >
                <Languages className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Change Language</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLanguageScreen}
                onClick={() => {
                  if (isLanguageScreen) return;
                  if (onChangeLanguage) {
                    onChangeLanguage();
                  } else {
                    setShowLanguageModal(true);
                  }
                }}
                className={`${pillBase} ${
                  isLanguageScreen
                    ? 'bg-[#1a1a1a] border-[#262626] text-neutral-500 cursor-default opacity-60'
                    : 'bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]'
                }`}
              >
                <Languages className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Change Language</span>
              </button>

              <button
                type="button"
                onClick={() => (onNeedHelp ? onNeedHelp() : setShowHelpModal(true))}
                className={`${pillBase} bg-[#262626] border-[#3a3a3a] text-neutral-100 hover:bg-[#2e2e2e] active:bg-[#363636]`}
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Need Help</span>
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
                <h3 className="font-bold text-slate-900 text-base">Candidate Support</h3>
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
                <strong>Need help with your verification?</strong>
              </p>
              <p>
                Make sure you have allowed camera and microphone permissions in your mobile or desktop browser.
              </p>
              <p>
                For technical issues or link expiration, contact your Quess Corp recruiter directly on WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#FF5723] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#F4511E]"
            >
              Back to Verification
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
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Language Options</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              For this onboarding task, only <strong>English</strong> is currently active and selectable.
            </p>
            <button
              type="button"
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2.5 bg-[#FF5723] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#F4511E]"
            >
              Continue in English
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationHeader;