'use client';

import React, { useState, useContext } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import VerificationContext from '@/context/VerificationContext';
import { getLanguageConfig, getTranslations } from '@/i18n/translations';
import { speakText, stopSpeech } from '@/utils/speech';

export const ReadAgainButton = ({ text, label, className = '', onEnd }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ctx = useContext(VerificationContext);
  const langConfig = ctx?.langConfig || getLanguageConfig('en');
  const t = ctx?.t || getTranslations('en');

  const resolvedLabel =
    label === 'Listen'
      ? t.common.listen
      : label || t.common.readAgain;

  const handleSpeak = (e) => {
    e.stopPropagation();

    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    speakText({
      text,
      langId: langConfig.id,
      ttsLang: langConfig.ttsLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      },
      onCancel: () => {
        setIsSpeaking(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-[#71717A] hover:text-[#52525B] active:text-[#27272A] transition-colors pt-1 cursor-pointer ${className}`}
      title="Listen to this message"
    >
      {isSpeaking ? (
        <VolumeX className="w-3.5 h-3.5 text-[#FF5723] animate-pulse" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-[#71717A]" />
      )}
      <span className="text-[#71717A]">{isSpeaking ? t.common.stopReading : resolvedLabel}</span>
    </button>
  );
};

export default ReadAgainButton;
