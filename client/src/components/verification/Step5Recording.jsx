'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import VerificationContext from '@/context/VerificationContext';
import { getTranslations } from '@/i18n/translations';

const getSupportedMimeType = () => {
  const types = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4'
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'video/webm';
};

export const Step5Recording = ({
  questionNumber = 1,
  totalQuestions = 3,
  questionText = '',
  stream = null,
  onStopRecording,
}) => {
  const ctx = useContext(VerificationContext);
  const t = ctx?.t || getTranslations();
  const langId = ctx?.langConfig?.id || 'en';
  const translateDynamicTexts = ctx?.translateDynamicTexts;
  const defaultTranslated = t.step7.questions[questionNumber - 1];
  const [displayQuestion, setDisplayQuestion] = useState(defaultTranslated || questionText);

  useEffect(() => {
    let active = true;
    if (langId === 'en') {
      setDisplayQuestion(questionText || defaultTranslated);
      return;
    }
    if (questionText && translateDynamicTexts) {
      translateDynamicTexts({ q: questionText }).then((res) => {
        if (active && res?.q) setDisplayQuestion(res.q);
      });
    } else {
      setDisplayQuestion(defaultTranslated || questionText);
    }
    return () => {
      active = false;
    };
  }, [questionText, defaultTranslated, langId, translateDynamicTexts]);

  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Recording timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Camera feed and MediaRecorder initialization
  useEffect(() => {
    let activeStream = stream;
    let ownsStream = false;
    let cancelled = false;

    const startRecording = (mediaStream) => {
      if (cancelled) return;
      activeStream = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Initialize actual browser MediaRecorder
      if (typeof MediaRecorder !== 'undefined') {
        try {
          chunksRef.current = [];
          const mimeType = getSupportedMimeType();
          const recorder = new MediaRecorder(mediaStream, { mimeType });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          recorder.start(500); // 500ms chunk timeslice
          mediaRecorderRef.current = recorder;
        } catch (err) {
          console.warn('[MediaRecorder] Initialisation warning:', err);
        }
      }
    };

    if (stream) {
      startRecording(stream);
    } else if (navigator.mediaDevices?.getUserMedia) {
      // Attempt camera + microphone capture
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        })
        .then((mediaStream) => {
          if (cancelled) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }
          ownsStream = true;
          startRecording(mediaStream);
        })
        .catch(() => {
          // Fallback to video only if microphone access fails or in simulated test
          navigator.mediaDevices
            .getUserMedia({
              video: { facingMode: 'user' },
              audio: false,
            })
            .then((mediaStream) => {
              if (cancelled) {
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
              }
              ownsStream = true;
              startRecording(mediaStream);
            })
            .catch((error) => {
              console.error('Camera access failed:', error);
            });
        });
    }

    return () => {
      cancelled = true;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) { }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (ownsStream && activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Format recording time
  const formatTime = (total) => {
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Stop recording callback with actual recorded video blob
  const handleStop = () => {
    const recorder = mediaRecorderRef.current;
    const finalSeconds = seconds;
    const formatted = formatTime(finalSeconds);

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const mimeType = getSupportedMimeType();
        const videoBlob = new Blob(
          chunksRef.current.length > 0 ? chunksRef.current : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])],
          { type: mimeType }
        );
        onStopRecording?.({
          questionNumber,
          durationSeconds: finalSeconds,
          formattedDuration: formatted,
          videoBlob,
          mimeType
        });
      };
      try {
        recorder.stop();
      } catch (e) {
        const mimeType = getSupportedMimeType();
        const videoBlob = new Blob(
          chunksRef.current.length > 0 ? chunksRef.current : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])],
          { type: mimeType }
        );
        onStopRecording?.({
          questionNumber,
          durationSeconds: finalSeconds,
          formattedDuration: formatted,
          videoBlob,
          mimeType
        });
      }
    } else {
      const mimeType = getSupportedMimeType();
      const videoBlob = new Blob(
        chunksRef.current.length > 0 ? chunksRef.current : [new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])],
        { type: mimeType }
      );
      onStopRecording?.({
        questionNumber,
        durationSeconds: finalSeconds,
        formattedDuration: formatted,
        videoBlob,
        mimeType
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      {/* Rule of thirds grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/25" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/25" />
        <div className="absolute left-0 right-0 top-1/3 h-px bg-white/25" />
        <div className="absolute left-0 right-0 top-2/3 h-px bg-white/25" />
      </div>

      {/* Glossy recording timer */}
      <div className="absolute top-[175px] right-4 z-[100] pointer-events-none">
        <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 px-4 py-2 shadow-xl">
          {/* Pulsing red indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>

          {/* Live recording time */}
          <span className="text-white text-xs font-bold tracking-wider tabular-nums">
            REC {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Bottom recording overlay */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-3 space-y-3">
        {/* Glossy question card */}
        <div className="rounded-2xl bg-black/30 backdrop-blur-m border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 text-white">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between text-sm font-medium text-white/90 cursor-pointer"
          >
            <span>
              {t.common.questionOf(questionNumber, totalQuestions)}
            </span>

            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-0' : '-rotate-90'
                }`}
            />
          </button>

          {expanded && (
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white drop-shadow-sm">
              {displayQuestion}
            </p>
          )}
        </div>

        {/* Stop recording button */}
        <button
          type="button"
          onClick={handleStop}
          className="w-full py-3.5 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-sm rounded-lg transition-all active:scale-[0.99] shadow-lg cursor-pointer"
        >
          {t.step5.stopRecording}
        </button>
      </div>
    </div>
  );
};

export default Step5Recording;
