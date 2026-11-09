import React from 'react';
import invalidSvg from '@/assets/invalid.svg';
import ReadAgainButton from '@/components/common/ReadAgainButton';

export const Step12InvalidLink = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center py-10 sm:py-14 px-6 select-none font-sans">
      <div />

      {/* Centered card exactly matching Figma Error Screen */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-[280px] mx-auto my-auto">
        <img
          src={invalidSvg}
          alt="Invalid link"
          className="w-[72px] h-[72px] select-none mb-1"
          draggable={false}
        />

        <h2 className="text-xl sm:text-lg font-semibold text-slate-900 tracking-tight">
          Invalid link
        </h2>

        <p className="text-medium sm:text-[13px] text-slate-500 font-normal leading-relaxed">
          This link doesn't look right. Please use the link sent to your WhatsApp number.
        </p>

        <div className="pt-1 flex justify-center">
          <ReadAgainButton text="Invalid link. This link doesn't look right. Please use the link sent to your WhatsApp number." />
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="text-[11px] text-neutral-400 font-normal text-center pb-2">
        You may now safely close this window.
      </div>
    </div>
  );
};

export default Step12InvalidLink;
