import translate from 'google-translate-api-x';
import { config } from '../config/env.js';

export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam'
};

// In-memory translation cache: key = `${targetLang}:${sourceText}` -> translatedText
const translationCache = new Map();

/**
 * Protects {{placeholder}} tokens before sending to Google Translate and restores them afterward.
 */
const maskPlaceholders = (text) => {
  const placeholders = [];
  const masked = text.replace(/\{\{(\w+)\}\}/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `[${idx}]`;
  });
  return { masked, placeholders };
};

const unmaskPlaceholders = (text, placeholders) => {
  if (!placeholders || placeholders.length === 0) return text;
  let restored = text;
  placeholders.forEach((ph, idx) => {
    restored = restored.replace(new RegExp(`\\[\\s*${idx}\\s*\\]`, 'g'), ph);
  });
  return restored;
};

/**
 * Primary free translator: Google Translate (google-translate-api-x)
 */
const translateBatchWithGoogle = async (batchPayload, targetLang) => {
  const keys = Object.keys(batchPayload);
  const maskedEntries = keys.map((k) => {
    const { masked, placeholders } = maskPlaceholders(batchPayload[k]);
    return { key: k, masked, placeholders };
  });

  const textsToTranslate = maskedEntries.map((e) => e.masked);
  const res = await translate(textsToTranslate, {
    from: 'en',
    to: targetLang,
    rejectOnPartialFail: false
  });

  const translatedArray = Array.isArray(res) ? res : [res];
  const output = {};

  maskedEntries.forEach((entry, idx) => {
    const item = translatedArray[idx];
    const rawText = item?.text;
    output[entry.key] =
      typeof rawText === 'string' && rawText.trim()
        ? unmaskPlaceholders(rawText.trim(), entry.placeholders)
        : batchPayload[entry.key];
  });

  return output;
};

/**
 * Secondary fallback translator: Groq AI (used only if Google Translate rate-limits or errors)
 */
const translateBatchWithGroq = async (batchPayload, targetLang) => {
  const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const targetLanguageName = LANGUAGE_NAMES[targetLang];
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: config.groqModel || 'openai/gpt-oss-20b',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Translate all JSON string values from English into natural ${targetLanguageName} (${targetLang}). Return ONLY a valid JSON object with identical keys and preserve {{placeholders}} verbatim.`
        },
        {
          role: 'user',
          content: JSON.stringify(batchPayload)
        }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return content ? JSON.parse(content) : null;
};

/**
 * Dynamically translates a dictionary of English strings into targetLang
 * using Google Translate (primary, free) with Groq AI fallback & in-memory caching.
 *
 * @param {Record<string, string>} textsObj
 * @param {string} targetLang
 */
export const translateTextMap = async (textsObj = {}, targetLang = 'en') => {
  const normalizedLang = (targetLang || 'en').toString().trim().toLowerCase();

  if (normalizedLang === 'en' || !LANGUAGE_NAMES[normalizedLang]) {
    return {
      translations: { ...textsObj },
      cachedCount: Object.keys(textsObj).length,
      translatedCount: 0,
      usedFallback: false,
      provider: 'none'
    };
  }

  const results = {};
  const missingEntries = {};

  for (const [key, sourceText] of Object.entries(textsObj)) {
    if (typeof sourceText !== 'string' || !sourceText.trim()) {
      results[key] = sourceText;
      continue;
    }

    const cacheKey = `${normalizedLang}:${sourceText}`;
    if (translationCache.has(cacheKey)) {
      results[key] = translationCache.get(cacheKey);
    } else {
      missingEntries[key] = sourceText;
    }
  }

  const missingKeys = Object.keys(missingEntries);
  if (missingKeys.length === 0) {
    return {
      translations: results,
      cachedCount: Object.keys(results).length,
      translatedCount: 0,
      usedFallback: false,
      provider: 'cache'
    };
  }

  const BATCH_SIZE = 40;
  let translatedCount = 0;
  let usedFallback = false;
  let provider = 'google_translate';

  for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
    const batchKeys = missingKeys.slice(i, i + BATCH_SIZE);
    const batchPayload = {};
    for (const k of batchKeys) {
      batchPayload[k] = missingEntries[k];
    }

    let translatedBatch = null;

    try {
      translatedBatch = await translateBatchWithGoogle(batchPayload, normalizedLang);
    } catch (googleErr) {
      console.warn(`[Google Translate] Batch error for ${normalizedLang}, trying Groq fallback:`, googleErr.message);
      try {
        translatedBatch = await translateBatchWithGroq(batchPayload, normalizedLang);
        if (translatedBatch) provider = 'groq_fallback';
      } catch (groqErr) {
        console.warn(`[Groq Fallback] Error for ${normalizedLang}:`, groqErr.message);
      }
    }

    if (!translatedBatch) {
      usedFallback = true;
      provider = 'english_fallback';
      for (const k of batchKeys) {
        results[k] = batchPayload[k];
      }
      continue;
    }

    for (const k of batchKeys) {
      const translated =
        typeof translatedBatch[k] === 'string' && translatedBatch[k].trim()
          ? translatedBatch[k].trim()
          : batchPayload[k];
      results[k] = translated;
      translationCache.set(`${normalizedLang}:${batchPayload[k]}`, translated);
      translatedCount += 1;
    }
  }

  return {
    translations: results,
    cachedCount: Object.keys(textsObj).length - missingKeys.length,
    translatedCount,
    usedFallback,
    provider
  };
};

export default { translateTextMap, LANGUAGE_NAMES };
