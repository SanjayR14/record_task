'use client';

import React, { useState, useContext } from 'react';
import { Play } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import redoIcon from '@/assets/Redo.svg';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

export const Step8AllResponsesReview = ({
  responses = [
    { questionNumber: 1, duration: '0:11' },
    { questionNumber: 2, duration: '0:11' },
    { questionNumber: 3, duration: '0:11' }
  ],
  isUploading = false,
  onRetakeQuestion,
  onFinish
}) => {
  const [playingId, setPlayingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations();

  const handleFinishClick = async () => {
    if (isUploading || isSubmitting || !onFinish) return;
    setIsSubmitting(true);
    try {
      await onFinish();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* Assistant Bubble 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1">
          <p className="text-medium sm:text-sm font-semibold text-slate-800 leading-snug">
            {t.step8.allSavedBubble}
          </p>
          <ReadAgainButton text={t.step8.allSavedBubble} />
        </div>

        {/* 3 Response Cards */}
        <div className="space-y-2.5">
          {responses.map((resp) => {
            const isPlaying = playingId === resp.questionNumber;
            return (
              <div
                key={resp.questionNumber}
                className="bg-white rounded-xl p-3 shadow-sm border border-stone-200/60 space-y-2"
              >
                <div className="flex items-center justify-between bg-[#F3F4F6] rounded-lg p-1 ">
                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setPlayingId(isPlaying ? null : resp.questionNumber)}
                      className="w-7 h-7 rounded-lg bg-[#16A34A] hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                    <span className="text-medium font-medium text-[#71717A] ">
                      {t.common.scenarioLabel} Q{resp.questionNumber} · {t.common.yourAnswer}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    {resp.duration || '0:11'}
                  </span>
                </div>

                {isPlaying && (
                  <div className="w-full rounded-lg bg-slate-900 flex items-center justify-center text-white text-[11px] overflow-hidden animate-fadeIn">
                    {resp.videoUrl || resp.previewUrl ? (
                      <video
                        src={resp.videoUrl || resp.previewUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full max-h-40 rounded-lg object-cover"
                        onEnded={() => setPlayingId(null)}
                      />
                    ) : (
                      <div className="h-20 flex items-center justify-center">
                        Playing Scenario Q{resp.questionNumber} ({resp.duration || '0:11'})
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1 bg-[#F3F4F6] rounded-lg flex justify-center">
                  <button
                    type="button"
                    onClick={() => onRetakeQuestion && onRetakeQuestion(resp.questionNumber)}
                    className="inline-flex items-center gap-1.5 py-2 px-3 rounded-md text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <img src={redoIcon?.src || redoIcon} alt="" className="w-3.5 h-3.5 shrink-0" draggable={false} />
                    <span className='font-semibold text-black'>{t.common.retakeVideo}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assistant Bubble 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1">
          <p className="text-medium font-semibold sm:text-sm text-slate-800 leading-relaxed">
            {t.step8.retryBubble}
          </p>
          <ReadAgainButton text={t.step8.retryBubble} />
        </div>

        {/* Assistant Bubble 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1">
          <p className="text-medium font-semibold sm:text-sm text-slate-800 leading-relaxed">
            {t.step8.finishBubble}
          </p>
          <ReadAgainButton text={t.step8.finishBubble} />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isUploading || isSubmitting}
          onClick={handleFinishClick}
          className={`w-full py-3.5 px-4 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center ${
            isUploading || isSubmitting
              ? 'bg-[#FF5723]/70 cursor-not-allowed'
              : 'bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] active:scale-[0.99] cursor-pointer'
          }`}
        >
          {isUploading ? 'Uploading video...' : isSubmitting ? 'Submitting...' : t.common.finish}
        </button>
      </div>
    </div>
  );
};

export default Step8AllResponsesReview;

