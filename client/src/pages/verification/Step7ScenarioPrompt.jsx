import React from 'react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
export const Step7ScenarioPrompt = ({
  questionNumber = 1,
  questionText = '',
  onStartRecording
}) => {
  const isFirst = questionNumber === 1;
  const isFinal = questionNumber === 3;

  const bubbleText = isFirst
    ? "Here's your first situation."
    : isFinal
      ? "Here's your final situation."
      : "Here's your next situation.";

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Assistant Bubble */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1">
          <p className="text-medium sm:text-sm font-semibold text-slate-800 leading-snug">
            {bubbleText}
          </p>
          {/* <ReadAgainButton text={bubbleText} /> */}
        </div>

        {/* Scenario Card */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/60 space-y-2.5">

          {/* Question number */}
          <div className="!w-7 !h-7 font-sans rounded-md bg-[#FF5723] text-white flex items-center justify-center font-semibold text-xl shadow-sm">
            {questionNumber}
          </div>

          {/* Scenario label and Listen button */}
          <div className="flex items-center justify-between">
            <span className="text-normal font-semibold text-[#FF5723] uppercase tracking-wide">
              SCENARIO · Q{questionNumber}
            </span>

            <ReadAgainButton text={questionText} label="Listen" />
          </div>

          {/* Question text */}
          <p className="text-medium sm:text-sm text-slate-900 leading-relaxed font-semibold">
            {questionText}
          </p>

        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStartRecording}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
        >
          I understand — Start recording
        </button>
      </div>
    </div>
  );
};

export default Step7ScenarioPrompt;
