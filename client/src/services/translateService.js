import api from './api';

const CACHE_PREFIX = 'record_i18n_v2_';
const memoryCache = new Map();

const loadLocalCache = (lang) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalCache = (lang, map) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Dynamically translates a dictionary of English strings into targetLang via Groq backend API
 * with persistent localStorage + in-memory caching so identical text isn't re-translated.
 *
 * @param {Record<string, string>} englishMap - Key -> English string
 * @param {string} targetLang - 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml'
 * @returns {Promise<Record<string, string>>}
 */
export const translateTextMap = async (englishMap, targetLang = 'en') => {
  const lang = (targetLang || 'en').toLowerCase();
  if (lang === 'en') {
    return { ...englishMap };
  }

  const stored = loadLocalCache(lang);
  const resolved = {};
  const missing = {};

  for (const [key, engText] of Object.entries(englishMap)) {
    if (typeof engText !== 'string' || !engText.trim()) {
      resolved[key] = engText;
      continue;
    }

    const memKey = `${lang}:${engText}`;
    if (memoryCache.has(memKey)) {
      resolved[key] = memoryCache.get(memKey);
    } else if (stored[engText]) {
      memoryCache.set(memKey, stored[engText]);
      resolved[key] = stored[engText];
    } else {
      missing[key] = engText;
    }
  }

  const missingKeys = Object.keys(missing);
  if (missingKeys.length === 0) {
    return resolved;
  }

  try {
    const res = await api.post(
      '/translate',
      { targetLang: lang, texts: missing },
      { timeout: 25000 }
    );

    const translatedData = res?.data || {};
    const updatedStore = { ...stored };

    for (const k of missingKeys) {
      const translatedText = translatedData[k] || missing[k];
      resolved[k] = translatedText;

      // Only cache real translations (when backend didn't fall back to unconfigured English)
      if (!res?.usedFallback) {
        memoryCache.set(`${lang}:${missing[k]}`, translatedText);
        updatedStore[missing[k]] = translatedText;
      }
    }

    if (!res?.usedFallback) {
      saveLocalCache(lang, updatedStore);
    }
  } catch (err) {
    console.warn(`[Translate] Falling back to English for ${lang}:`, err.message);
    for (const k of missingKeys) {
      resolved[k] = missing[k];
    }
  }

  return resolved;
};

export default { translateTextMap };

