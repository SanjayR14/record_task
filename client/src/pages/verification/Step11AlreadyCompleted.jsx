import React from 'react';
import { ShieldAlert, Timer } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';

export const Step11AlreadyCompleted = () => {
  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Assistant Bubble 1: Assessment already taken banner + message */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FEF9C3] text-[#EAB308] text-xs font-medium w-full">
            <ShieldAlert className="w-4 h-4 text-[#EAB308] shrink-0" />
            <span className="text-sm sm:text-medium">Assessment already taken</span>
          </div>
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            You have already completed this verification assessment. Your responses are currently under review.
          </p>
          <ReadAgainButton text="Assessment already taken. You have already completed this verification assessment. Your responses are currently under review." />
        </div>

        {/* Assistant Bubble 2: What to do next */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-2">
          <div className="flex items-center gap-1.5 text-medium sm:text-[13px] font-medium text-[#F97316]">
            <Timer className="w-4 h-4 text-[#F97316] shrink-0" />
            <span>What to do next?</span>
          </div>
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            Wait for the recruiter to reach out with the results. If you believe this is a mistake, please contact your recruiter directly.
          </p>
          <ReadAgainButton text="What to do next? Wait for the recruiter to reach out with the results. If you believe this is a mistake, please contact your recruiter directly." />
        </div>

        {/* Assistant Bubble 3: Close instructions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-1.5">
          <p className="text-medium sm:text-[13px] text-slate-800 font-medium leading-relaxed">
            You may now safely close this window.
          </p>
          <ReadAgainButton text="You may now safely close this window." />
        </div>
      </div>
    </div>
  );
};

export default Step11AlreadyCompleted;
