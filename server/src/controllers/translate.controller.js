import { translateTextMap, LANGUAGE_NAMES } from '../services/translation.service.js';

/**
 * Dynamic translation endpoint powered by Groq AI + in-memory cache
 * POST /api/translate
 * Body: { targetLang: 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'en', texts: { key: 'English text', ... } }
 */
export const translateTexts = async (req, res, next) => {
  try {
    const { targetLang = 'en', texts } = req.body;

    if (!texts || (typeof texts !== 'object' && !Array.isArray(texts))) {
      return res.status(400).json({
        success: false,
        message: 'A "texts" object or array is required.'
      });
    }

    const langCode = (targetLang || 'en').toString().trim().toLowerCase();
    if (!LANGUAGE_NAMES[langCode]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported target language: ${targetLang}`
      });
    }

    // Normalize array input to indexed map if array is passed
    let inputMap = texts;
    const isArrayInput = Array.isArray(texts);
    if (isArrayInput) {
      inputMap = {};
      texts.forEach((txt, idx) => {
        inputMap[String(idx)] = txt;
      });
    }

    const result = await translateTextMap(inputMap, langCode);

    const output = isArrayInput
      ? Object.keys(inputMap).map((k) => result.translations[k])
      : result.translations;

    return res.status(200).json({
      success: true,
      targetLang: langCode,
      cachedCount: result.cachedCount,
      translatedCount: result.translatedCount,
      usedFallback: result.usedFallback,
      data: output
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Streams MP3 Text-to-Speech audio in the selected language (en, hi, ta, te, kn, ml)
 * so all Indian languages speak clearly even when the user's OS lacks local TTS voices.
 * GET /api/translate/tts?lang=ta&text=...
 */
export const streamTextToSpeech = async (req, res, next) => {
  try {
    const langCode = (req.query.lang || 'en').toString().trim().toLowerCase();
    const rawText = (req.query.text || '').toString().trim();

    if (!LANGUAGE_NAMES[langCode]) {
      return res.status(400).json({ success: false, message: `Unsupported TTS language: ${langCode}` });
    }

    if (!rawText) {
      return res.status(400).json({ success: false, message: 'Text parameter is required.' });
    }

    const clipped = rawText.slice(0, 200);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(langCode)}&q=${encodeURIComponent(clipped)}`;

    const upstream = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://translate.google.com/'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!upstream.ok) {
      return res.status(502).json({ success: false, message: 'TTS audio upstream unavailable.' });
    }

    const arrayBuf = await upstream.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuf);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    next(error);
  }
};

export default { translateTexts, streamTextToSpeech };

