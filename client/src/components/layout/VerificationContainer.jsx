'use client';

import React from 'react';
import VerificationHeader from './VerificationHeader';
import bgTexture from '@/components/ui/056a8700c1cdc4b96e7bb7fa102a466612add191.png';

/**
 * Fully Responsive Verification Container
 * Occupies the browser viewport directly across mobile, tablet, and desktop.
 * Uses textured background image with fixed static header above scrolling content.
 */
export const VerificationContainer = ({
  children,
  onChangeLanguage,
  onSelectLanguage,
  onNeedHelp,
  header = true,
  className = '',
  totalSteps = 5,
  currentStep = 0,
  isLanguageScreen = false,
  isAlreadyCompletedScreen = false
}) => {
  const bgUrl = bgTexture?.src || bgTexture;

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans antialiased text-slate-900 relative bg-[#F8F6F1] bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {header && (
        <>
          <VerificationHeader
            onChangeLanguage={onChangeLanguage}
            onSelectLanguage={onSelectLanguage}
            onNeedHelp={onNeedHelp}
            totalSteps={totalSteps}
            currentStep={currentStep}
            isLanguageScreen={isLanguageScreen}
            isAlreadyCompletedScreen={isAlreadyCompletedScreen}
          />
          {/* Header spacer to prevent content overlap while header is fixed */}
          <div
            className={
              isAlreadyCompletedScreen
                ? 'h-[128px] sm:h-[136px] w-full flex-shrink-0'
                : 'h-[148px] sm:h-[156px] w-full flex-shrink-0'
            }
            aria-hidden="true"
          />
        </>
      )}

      {/* Main Content Viewport (Mobile full width; Tablet & Desktop max-w-2xl centered, scrolls behind header) */}
      <main className={`flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col relative z-10 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default VerificationContainer;
