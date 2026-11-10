import { config } from '../config/env.js';

/**
 * Reverse Geocoding & Groq AI PIN Code Service
 * Resolves GPS coordinates (latitude, longitude) into accurate postal/PIN codes
 * using Groq LLM (when GROQ_API_KEY is configured), OSM Nominatim, BigDataCloud,
 * Photon, and India Post cross-verification.
 */

const normalizePostcode = (rawPostcode, countryCode = '') => {
  if (!rawPostcode || typeof rawPostcode !== 'string') return null;
  const cleaned = rawPostcode.trim();
  if (!cleaned) return null;

  // Normalize Indian 6-digit PIN codes (e.g., "560 001" -> "560001")
  if (countryCode.toUpperCase() === 'IN' || /^\d{3}\s*\d{3}$/.test(cleaned)) {
    const digitsOnly = cleaned.replace(/\s+/g, '');
    if (/^\d{6}$/.test(digitsOnly)) {
      return digitsOnly;
    }
  }

  return cleaned;
};

/**
 * Cross-verify an Indian 6-digit PIN code with India Post API (https://api.postalpincode.in)
 * Returns official Post Office, District, State, and Country metadata.
 */
export const verifyIndianPincode = async (pincode) => {
  if (!pincode || !/^\d{6}$/.test(pincode)) return null;

  try {
    const url = `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const payload = await res.json();
    const record = Array.isArray(payload) ? payload[0] : null;
    if (!record || record.Status !== 'Success' || !Array.isArray(record.PostOffice) || record.PostOffice.length === 0) {
      return { verified: false };
    }

    const po = record.PostOffice[0];
    return {
      verified: true,
      pincode: po.Pincode || pincode,
      postOffice: po.Name?.trim() || null,
      district: po.District?.trim() || null,
      state: po.State?.trim() || null,
      country: po.Country?.trim() || 'India'
    };
  } catch {
    return null;
  }
};

/**
 * Calls Groq Chat Completions API to extract/resolve the accurate PIN code
 * from GPS coordinates and available location context.
 */
const fetchGroqPincode = async ({ latitude, longitude, context = {} }) => {
  const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const contextLines = [
      `Latitude: ${latitude}`,
      `Longitude: ${longitude}`,
      context.formattedAddress ? `Detected Address/Area: ${context.formattedAddress}` : null,
      context.city ? `City/Locality: ${context.city}` : null,
      context.state ? `State/Region: ${context.state}` : null,
      context.country ? `Country: ${context.country}` : null,
      context.gisPostcode ? `Reference Postal Code from map lookup: ${context.gisPostcode}` : null
    ]
      .filter(Boolean)
      .join('\n');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: config.groqModel || 'openai/gpt-oss-20b',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a precise geolocation assistant. Given GPS coordinates and optional address metadata, return ONLY valid JSON with keys: "pincode" (string postal/PIN code, e.g. 6 digits for India without spaces), "city" (string), "state" (string), "country" (string), "countryCode" (2-letter ISO code).'
          },
          {
            role: 'user',
            content: `Find the accurate postal/PIN code for this exact location:\n${contextLines}`
          }
        ]
      })
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const countryCode = parsed.countryCode || context.countryCode || '';
    const pincode = normalizePostcode(String(parsed.pincode || ''), countryCode);
    if (!pincode) return null;

    return {
      pincode,
      city: parsed.city || context.city || null,
      state: parsed.state || context.state || null,
      country: parsed.country || context.country || null,
      countryCode,
      formattedAddress: context.formattedAddress || [parsed.city, parsed.state, parsed.country].filter(Boolean).join(', '),
      source: 'groq'
    };
  } catch (err) {
    console.warn('[Groq Geocoding] Fallback triggered:', err.message);
    return null;
  }
};

const enrichWithIndiaPost = async (primary, alternate = null) => {
  if (!primary) return null;

  const isIndia =
    primary.countryCode?.toUpperCase() === 'IN' ||
    primary.country === 'India' ||
    /^\d{6}$/.test(primary.pincode || '');

  if (!isIndia) {
    return {
      ...primary,
      pincodeVerified: false,
      postOffice: null,
      district: null
    };
  }

  if (primary.pincode && /^\d{6}$/.test(primary.pincode)) {
    const check = await verifyIndianPincode(primary.pincode);
    if (check?.verified) {
      return {
        ...primary,
        pincode: check.pincode,
        pincodeVerified: true,
        postOffice: check.postOffice,
        district: check.district,
        state: primary.state || check.state,
        country: primary.country || check.country,
        source: `${primary.source}+indiapost`
      };
    }
  }

  if (alternate?.pincode && alternate.pincode !== primary.pincode && /^\d{6}$/.test(alternate.pincode)) {
    const altCheck = await verifyIndianPincode(alternate.pincode);
    if (altCheck?.verified) {
      return {
        ...primary,
        ...alternate,
        pincode: altCheck.pincode,
        pincodeVerified: true,
        postOffice: altCheck.postOffice,
        district: altCheck.district,
        state: alternate.state || altCheck.state,
        country: alternate.country || altCheck.country,
        source: `${alternate.source}+indiapost`
      };
    }
  }

  return {
    ...primary,
    pincodeVerified: false,
    postOffice: null,
    district: null
  };
};

const fetchNominatim = async (lat, lon, zoom = 18) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=${zoom}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RecordVideoVerification/1.0 (https://record.technology)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const countryCode = addr.country_code || '';

    return {
      pincode: normalizePostcode(addr.postcode, countryCode),
      city: addr.city || addr.town || addr.village || addr.suburb || addr.county || null,
      state: addr.state || null,
      country: addr.country || null,
      countryCode,
      formattedAddress: data?.display_name || null,
      source: `nominatim_z${zoom}`
    };
  } catch {
    return null;
  }
};

const fetchBigDataCloud = async (lat, lon) => {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const countryCode = data?.countryCode || '';

    return {
      pincode: normalizePostcode(data?.postcode, countryCode),
      city: data?.city || data?.locality || null,
      state: data?.principalSubdivision || null,
      country: data?.countryName || null,
      countryCode,
      formattedAddress: [data?.locality, data?.city, data?.principalSubdivision, data?.countryName]
        .filter(Boolean)
        .join(', ') || null,
      source: 'bigdatacloud'
    };
  } catch {
    return null;
  }
};

const fetchPhoton = async (lat, lon) => {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RecordVideoVerification/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const props = data?.features?.[0]?.properties || {};
    const countryCode = props.countrycode || '';

    return {
      pincode: normalizePostcode(props.postcode, countryCode),
      city: props.city || props.town || props.village || props.district || null,
      state: props.state || null,
      country: props.country || null,
      countryCode,
      formattedAddress: [props.name, props.street, props.city, props.state, props.postcode]
        .filter(Boolean)
        .join(', ') || null,
      source: 'photon'
    };
  } catch {
    return null;
  }
};

/**
 * Resolves exact postal/PIN code and location metadata from coordinates.
 * Uses map context + Groq LLM (when GROQ_API_KEY is configured) + India Post verification.
 */
export const reverseGeocodeLocation = async (latitude, longitude, clientHint = null) => {
  // 1. Gather street-level & administrative map context in parallel
  const [nomRes, bdcRes] = await Promise.allSettled([
    fetchNominatim(latitude, longitude, 18),
    fetchBigDataCloud(latitude, longitude)
  ]);

  const nominatim = nomRes.status === 'fulfilled' ? nomRes.value : null;
  const bigData = bdcRes.status === 'fulfilled' ? bdcRes.value : null;

  const gisCandidate =
    (nominatim?.pincode ? nominatim : null) ||
    (bigData?.pincode ? bigData : null) ||
    nominatim ||
    bigData;

  // 2. Send location coordinates + context to Groq when GROQ_API_KEY is configured
  const groqResult = await fetchGroqPincode({
    latitude,
    longitude,
    context: {
      formattedAddress: nominatim?.formattedAddress || bigData?.formattedAddress || clientHint?.formattedAddress,
      city: nominatim?.city || bigData?.city || clientHint?.city,
      state: nominatim?.state || bigData?.state || clientHint?.state,
      country: nominatim?.country || bigData?.country || clientHint?.country,
      countryCode: nominatim?.countryCode || bigData?.countryCode || '',
      gisPostcode: nominatim?.pincode || bigData?.pincode || clientHint?.postal || null
    }
  });

  if (groqResult?.pincode) {
    return enrichWithIndiaPost(groqResult, gisCandidate);
  }

  // 3. Fallback when GROQ_API_KEY is not set or unavailable
  if (gisCandidate?.pincode) {
    return enrichWithIndiaPost(
      {
        ...gisCandidate,
        city: gisCandidate.city || bigData?.city || nominatim?.city || null,
        state: gisCandidate.state || bigData?.state || nominatim?.state || null,
        country: gisCandidate.country || bigData?.country || nominatim?.country || null,
        formattedAddress: nominatim?.formattedAddress || bigData?.formattedAddress || null
      },
      bigData?.pincode !== gisCandidate.pincode ? bigData : nominatim
    );
  }

  // 4. Final fallback: Photon or lower-zoom Nominatim (zoom=14)
  const [photonRes, nom14Res] = await Promise.allSettled([
    fetchPhoton(latitude, longitude),
    fetchNominatim(latitude, longitude, 14)
  ]);
  const photon = photonRes.status === 'fulfilled' ? photonRes.value : null;
  const nom14 = nom14Res.status === 'fulfilled' ? nom14Res.value : null;

  const best = (photon?.pincode ? photon : null) || (nom14?.pincode ? nom14 : null) || gisCandidate;

  return enrichWithIndiaPost({
    pincode: best?.pincode || normalizePostcode(clientHint?.postal || '', '') || null,
    city: best?.city || clientHint?.city || null,
    state: best?.state || clientHint?.state || null,
    country: best?.country || clientHint?.country || null,
    countryCode: best?.countryCode || '',
    formattedAddress: best?.formattedAddress || clientHint?.formattedAddress || null,
    source: best?.source || (clientHint?.postal ? 'ip_fallback' : 'coordinates_only')
  });
};

export default { reverseGeocodeLocation, verifyIndianPincode };
