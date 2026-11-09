import React from 'react';
import ReadAgainButton from '@/components/common/ReadAgainButton';

// 👇 Rename these to match your actual files in client/src/assets
import cameraMicIcon from '@/assets/camera-mic.svg';   // green camera + mic tiles
import boltIcon from '@/assets/Zap.svg';              // quick tip lightning icon
import lightingIcon from '@/assets/LampCeiling.svg';      // lamp / bell-style icon
import phoneIcon from '@/assets/Smartphone.svg';            // phone outline
import speakIcon from '@/assets/Speech.svg';            // speaking / sound-wave icon

const tips = [
  { icon: lightingIcon, text: 'Find some good lighting' },
  { icon: phoneIcon, text: 'Hold your phone steady' },
  { icon: speakIcon, text: 'Speak naturally, just the way you do' },
];

export const Step4ReadyToStart = ({ onStart }) => {
  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* Bubble 1: Permissions confirmation */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/60 max-w-[92%]">
          <img
            src={cameraMicIcon}
            alt=""
            className="!w-12 !h-12 select-none"
            draggable={false}
          />
          <p className="text-medium font-medium text-slate-900 leading-snug">Camera and mic are on.</p>
          <p className="text-medium font-medium text-slate-900 leading-snug">You're all set.</p>
        </div>

        {/* Quick tips card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-3.5 space-y-3">
          {/* Yellow banner */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FFF7C2]">
            <img src={boltIcon} alt="" className="w-5 h-5 shrink-0" />
            <span className="text-medium font-medium text-[#C9A400]">
              Quick tip before we start:
            </span>
          </div>

          {/* Tips list */}
          <ul className="space-y-3.5 px-3 pt-1">
            {tips.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <img src={icon} alt="" className="w-5 h-5 shrink-0 opacity-80" />
                <span className="text-medium font-medium text-slate-900">{text}</span>
              </li>
            ))}
          </ul>

          {/* Read again (no divider line, small + muted) */}
          <div className="pt-1 pb-1">
            <ReadAgainButton text="Camera and mic are on. You're all set. Quick tips: Find some good lighting, hold your phone steady, and speak naturally, just the way you do." />
          </div>
        </div>
      </div>

      {/* Bottom action button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStart}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-base rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
        >
          I'm Ready to Start
        </button>
      </div>
    </div>
  );
};

export default Step4ReadyToStart;