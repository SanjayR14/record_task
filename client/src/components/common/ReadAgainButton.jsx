import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const ReadAgainButton = ({ text, label = 'Read again', className = '', onEnd }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
      <span className="text-[#71717A]">{isSpeaking ? 'Stop reading' : label}</span>
    </button>
  );
};

export default ReadAgainButton;

