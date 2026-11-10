/**
 * Cross-browser Multilingual Text-to-Speech Utility
 * Uses native Web Speech API when an OS voice is available for English, and reliably
 * plays Google TTS MP3 audio via /api/translate/tts for Hindi, Tamil, Telugu, Kannada, and Malayalam
 * (with automatic fallback between both).
 */

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

let currentAudio = null;
let currentCancelNotify = null;
let playbackGeneration = 0;

const splitTtsChunks = (text, maxLen = 180) => {
  const clean = (text || '').toString().replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks = [];
  let remaining = clean;

  while (remaining.length > maxLen) {
    let splitIdx = -1;
    for (const sep of ['. ', '। ', '? ', '! ', ', ', ' ']) {
      const idx = remaining.lastIndexOf(sep, maxLen);
      if (idx > 40) {
        splitIdx = idx + sep.length;
        break;
      }
    }
    if (splitIdx <= 0) {
      splitIdx = maxLen;
    }
    chunks.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }
  return chunks;
};

export const stopSpeech = () => {
  playbackGeneration += 1;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
    } catch { }
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch { }
  }

  if (currentCancelNotify) {
    const notify = currentCancelNotify;
    currentCancelNotify = null;
    notify();
  }
};

const findNativeVoice = (langId, ttsLang) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const prefix = (langId || 'en').toLowerCase();
  const exactTag = (ttsLang || '').toLowerCase();

  return (
    voices.find((v) => v.lang?.toLowerCase() === exactTag) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
};

const playWithNativeSpeech = ({ text, langId, ttsLang, gen, onEnd, onFail }) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onFail();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang || 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voice = findNativeVoice(langId, ttsLang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (gen === playbackGeneration) {
        currentCancelNotify = null;
        onEnd?.();
      }
    };

    utterance.onerror = () => {
      if (gen === playbackGeneration) {
        onFail();
      }
    };

    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    onFail();
  }
};

const playWithAudioStream = async ({ text, langId, gen, onEnd, onFail }) => {
  const chunks = splitTtsChunks(text, 180);
  if (chunks.length === 0) {
    onEnd?.();
    return;
  }

  try {
    for (const chunk of chunks) {
      if (gen !== playbackGeneration) return;

      const audioUrl = `${baseURL}/translate/tts?lang=${encodeURIComponent(langId)}&text=${encodeURIComponent(chunk)}`;
      await new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          if (currentAudio === audio) currentAudio = null;
          reject(new Error('Audio playback failed'));
        };

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(reject);
        }
      });
    }

    if (gen === playbackGeneration) {
      currentCancelNotify = null;
      onEnd?.();
    }
  } catch {
    if (gen === playbackGeneration) {
      onFail();
    }
  }
};

/**
 * Speaks `text` in the selected language (`en`, `hi`, `ta`, `te`, `kn`, `ml`).
 */
export const speakText = ({
  text,
  langId = 'en',
  ttsLang = 'en-US',
  onStart,
  onEnd,
  onCancel
}) => {
  stopSpeech();

  const normalizedLang = (langId || 'en').toLowerCase();
  const gen = playbackGeneration;
  currentCancelNotify = onCancel || onEnd || null;
  onStart?.();

  // For Indian languages (hi, ta, te, kn, ml), Windows/desktop browsers frequently lack local OS voices;
  // use the MP3 stream first for reliable natural pronunciation, with native speechSynthesis fallback.
  if (normalizedLang !== 'en') {
    playWithAudioStream({
      text,
      langId: normalizedLang,
      gen,
      onEnd,
      onFail: () => {
        playWithNativeSpeech({
          text,
          langId: normalizedLang,
          ttsLang,
          gen,
          onEnd,
          onFail: () => {
            if (gen === playbackGeneration) {
              currentCancelNotify = null;
              onEnd?.();
            }
          }
        });
      }
    });
    return;
  }

  // For English, use native browser SpeechSynthesis (instant) with audio stream fallback if unavailable
  const hasEnglishVoice = Boolean(findNativeVoice('en', ttsLang));
  if (hasEnglishVoice || typeof window !== 'undefined' && 'speechSynthesis' in window) {
    playWithNativeSpeech({
      text,
      langId: 'en',
      ttsLang,
      gen,
      onEnd,
      onFail: () => {
        playWithAudioStream({
          text,
          langId: 'en',
          gen,
          onEnd,
          onFail: () => {
            if (gen === playbackGeneration) {
              currentCancelNotify = null;
              onEnd?.();
            }
          }
        });
      }
    });
  } else {
    playWithAudioStream({
      text,
      langId: 'en',
      gen,
      onEnd,
      onFail: () => {
        if (gen === playbackGeneration) {
          currentCancelNotify = null;
          onEnd?.();
        }
      }
    });
  }
};

