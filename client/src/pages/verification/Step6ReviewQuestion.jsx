import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import redoIcon from '@/assets/Redo.svg';

export const Step6ReviewQuestion = ({
  questionNumber = 1,
  duration = '0:11',
  videoUrl = '',
  onRetake,
  onContinue
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Saved Response Video Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 space-y-3">
          <div className="bg-gray-100 p-2.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-[#16A34A] hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                  title={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-semibold text-gray-600 block">
                    Scenario Q{questionNumber} · your answer
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                {duration}
              </span>
            </div>

            {/* Video Player / Simulation Box when Playing */}
            {isPlaying && (
              <div className="w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-white text-xs overflow-hidden animate-fadeIn shadow-inner">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-48 rounded-xl object-cover"
                    onEnded={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="w-full h-32 flex flex-col items-center justify-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Playing recorded response ({duration})</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-1 pb-1">
              <p className="text-medium font-semibold text-slate-700">Got it, saved.</p>
            </div>
          </div>

          {/* Retake Button & Info */}
          <div className="pt-1 flex flex-col items-center text-center space-y-1">
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex w-full items-center justify-center gap-2 py-4 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <img src={redoIcon} alt="" className="w-3.5 h-3.5 shrink-0" draggable={false} />
              <span>Retake video</span>
            </button>

            <span className="text-sm text-[#71717A]">
              You can retake anytime before you submit
            </span>
          </div>
        </div>

        {/* Assistant Bubble */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1.5">
          <p className="text-medium sm:text-sm font-semibold text-slate-800 leading-relaxed">
            Your response for Scenario Q{questionNumber} has been saved. If you'd like to retry, simply click the Retake button below the video.
          </p>
          <ReadAgainButton text={`Your response for Scenario Q${questionNumber} has been saved. If you'd like to retry, simply click the Retake button below the video.`} />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
        >
          {questionNumber < 3 ? 'Continue to Next Scenario' : 'Review All Responses'}
        </button>
      </div>
    </div>
  );
};

export default Step6ReviewQuestion;
