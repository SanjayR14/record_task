'use client';

import React, { useContext, useState, useEffect } from 'react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

export const Step7ScenarioPrompt = ({
  questionNumber = 1,
  questionText = '',
  onStartRecording
}) => {
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations();
  const langId = ctx?.langConfig?.id || 'en';
  const translateDynamicTexts = ctx?.translateDynamicTexts;

  const isFirst = questionNumber === 1;
  const isFinal = questionNumber === 3;

  const bubbleText = isFirst
    ? t.step7.firstSituation
    : isFinal
      ? t.step7.finalSituation
      : t.step7.nextSituation;

  // Use translated dictionary question if available, or dynamically translate any custom questionText prop via Groq
  const defaultTranslated = t.step7.questions[questionNumber - 1];
  const [dynamicQuestion, setDynamicQuestion] = useState(defaultTranslated || questionText);

  useEffect(() => {
    let active = true;
    const baseText = questionText || defaultTranslated;

    if (langId === 'en') {
      setDynamicQuestion(baseText);
      return;
    }

    // If custom questionText differs from English default or wasn't in preset dictionary, translate dynamically via Groq
    if (questionText && translateDynamicTexts) {
      translateDynamicTexts({ q: questionText }).then((res) => {
        if (active && res?.q) {
          setDynamicQuestion(res.q);
        }
      });
    } else {
      setDynamicQuestion(defaultTranslated || questionText);
    }

    return () => {
      active = false;
    };
  }, [questionText, defaultTranslated, langId, translateDynamicTexts]);

  const displayQuestion = dynamicQuestion || defaultTranslated || questionText;

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Assistant Bubble */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1">
          <p className="text-medium sm:text-sm font-semibold text-slate-800 leading-snug">
            {bubbleText}
          </p>
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
              {t.common.scenarioLabel} · Q{questionNumber}
            </span>

            <ReadAgainButton text={displayQuestion} label="Listen" />
          </div>

          {/* Question text */}
          <p className="text-medium sm:text-sm text-slate-900 leading-relaxed font-semibold">
            {displayQuestion}
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
          {t.step7.startRecordingBtn}
        </button>
      </div>
    </div>
  );
};

export default Step7ScenarioPrompt;
