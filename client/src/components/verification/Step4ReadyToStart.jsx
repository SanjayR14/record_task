'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

import cameraMicIcon from '@/assets/camera-mic.svg';   // green camera + mic tiles
import boltIcon from '@/assets/Zap.svg';               // quick tip lightning icon
import lightingIcon from '@/assets/LampCeiling.svg';   // lamp / bell-style icon
import phoneIcon from '@/assets/Smartphone.svg';       // phone outline
import speakIcon from '@/assets/Speech.svg';           // speaking / sound-wave icon

const tipIcons = [lightingIcon, phoneIcon, speakIcon];

// ---- Tune these to taste ----
const SPEECH_RATE = 1.0;   // 1 = natural speed, 1.1 = a little faster
const START_DELAY = 300;   // pause after screen opens (ms)
const TIP_GAP = 250;       // pause between tips (ms)

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/*
  Speaks the whole tip naturally as ONE sentence.
  A word is revealed right after the voice has said it:
  - when the voice starts word N, words 1..N-1 become visible
  - when the sentence ends, the last word becomes visible
  If the browser doesn't send word events, a timer based on word length is used.
*/
const speakTip = (text, ttsLang, onReveal, isCancelled) =>
  new Promise((resolve) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const words = text.split(' ');
    const total = words.length;

    let done = false;
    let gotBoundary = false;
    let fallbackTimers = [];
    let checkTimer;
    let safetyTimer;

    const clearAll = () => {
      clearTimeout(checkTimer);
      clearTimeout(safetyTimer);
      fallbackTimers.forEach(clearTimeout);
      fallbackTimers = [];
    };

    const finish = () => {
      if (done) return;
      done = true;
      clearAll();
      if (!isCancelled()) onReveal(total); // last word appears after it is spoken
      resolve();
    };

    // Estimated timing per word (used only when no word events are available)
    const startFallback = () => {
      let elapsed = 0;
      words.forEach((w, i) => {
        elapsed += (150 + w.length * 55) / SPEECH_RATE; // ms to say this word
        fallbackTimers.push(
          setTimeout(() => {
            if (!isCancelled() && !done) onReveal(i + 1);
          }, elapsed)
        );
      });
    };

    if (!synth) {
      startFallback();
      safetyTimer = setTimeout(finish, total * 700 + 500);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = ttsLang || 'en-US';
    utter.rate = SPEECH_RATE;

    utter.onboundary = (e) => {
      if (isCancelled() || done) return;
      if (e.name && e.name !== 'word') return;
      if (!gotBoundary) {
        gotBoundary = true;
        clearTimeout(checkTimer);
        fallbackTimers.forEach(clearTimeout);
        fallbackTimers = [];
      }
      // index of the word the voice is starting now
      const idx = (text.slice(0, e.charIndex).match(/ /g) || []).length;
      onReveal(idx); // previous words (already spoken) are shown
    };

    utter.onend = finish;
    utter.onerror = finish;

    // If no word events arrive, switch to the timed reveal
    checkTimer = setTimeout(() => {
      if (!gotBoundary && !done) startFallback();
    }, 500);

    synth.speak(utter);

    // Safety net so the sequence never hangs
    safetyTimer = setTimeout(finish, total * 1500 + 1500);
  });

export const Step4ReadyToStart = ({ onStart }) => {
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations('en');
  const ttsLang = ctx?.langConfig?.ttsLang || 'en-US';

  const tips = useMemo(
    () => [
      { icon: tipIcons[0], text: t.step4.tips[0] || 'Find some good lighting' },
      { icon: tipIcons[1], text: t.step4.tips[1] || 'Hold your phone steady' },
      { icon: tipIcons[2], text: t.step4.tips[2] || 'Speak naturally, just the way you do' }
    ],
    [t.step4.tips]
  );

  const tipWords = useMemo(() => tips.map((item) => item.text.split(' ')), [tips]);

  const [activeTip, setActiveTip] = useState(-1); // which tip has started
  const [shownWords, setShownWords] = useState(() => tips.map(() => 0)); // revealed words per tip
  const runId = useRef(0);

  useEffect(() => {
    const myRun = ++runId.current;
    const cancelled = () => runId.current !== myRun;

    setActiveTip(-1);
    setShownWords(tips.map(() => 0));

    const run = async () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      await wait(START_DELAY);

      for (let i = 0; i < tips.length; i++) {
        if (cancelled()) return;
        setActiveTip(i); // tip row (icon) appears

        await speakTip(
          tips[i].text,
          ttsLang,
          (count) =>
            setShownWords((prev) => {
              if (prev[i] >= count) return prev; // never go backwards
              const next = [...prev];
              next[i] = count;
              return next;
            }),
          cancelled
        );

        if (cancelled()) return;
        await wait(TIP_GAP);
      }
    };

    run();

    return () => {
      runId.current++; // cancel the running sequence
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, [tips, ttsLang]);

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* Bubble 1: Permissions confirmation */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/60 max-w-[92%]">
          <img
            src={cameraMicIcon?.src || cameraMicIcon}
            alt=""
            className="!w-12 !h-12 select-none"
            draggable={false}
          />
          <p className="text-medium font-medium text-slate-900 leading-snug">{t.step4.camMicOn}</p>
          <p className="text-medium font-medium text-slate-900 leading-snug">{t.step4.allSet}</p>
        </div>

        {/* Quick tips card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-3.5 space-y-3">
          {/* Yellow banner */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FFF7C2]">
            <img src={boltIcon?.src || boltIcon} alt="" className="w-5 h-5 shrink-0" />
            <span className="text-medium font-medium text-[#C9A400]">
              {t.step4.quickTipTitle}
            </span>
          </div>

          {/* Tips list: one by one, words appear as they are spoken */}
          <ul className="space-y-3.5 px-3 pt-1">
            {tips.map(({ icon }, tipIndex) => {
              const started = tipIndex <= activeTip;
              return (
                <li
                  key={tipIndex}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    started ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={icon?.src || icon} alt="" className="w-5 h-5 shrink-0 opacity-80" />
                  <span className="text-medium font-medium text-slate-900">
                    {tipWords[tipIndex].map((word, wordIndex) => (
                      <span
                        key={wordIndex}
                        // invisible (not removed) so the layout doesn't jump
                        className={`transition-opacity duration-150 ${
                          wordIndex < (shownWords[tipIndex] || 0) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {word}
                        {wordIndex < tipWords[tipIndex].length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Read again */}
          <div className="pt-1 pb-1">
            <ReadAgainButton text={t.step4.readSpeech} />
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
          {t.step4.readyButton}
        </button>
      </div>
    </div>
  );
};

export default Step4ReadyToStart;
