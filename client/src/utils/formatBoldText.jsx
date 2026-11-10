import React from 'react';

/**
 * Highlights specific phrases inside plain text with bold styling while keeping the
 * underlying string plain for Text-to-Speech and dynamic translation.
 */
export function renderBoldPhrases(text = '', phrases = []) {
  if (!text || !Array.isArray(phrases) || phrases.length === 0) {
    return text;
  }

  const valid = phrases.filter((p) => typeof p === 'string' && p.trim().length > 0);
  if (valid.length === 0) return text;

  const escaped = valid.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  return String(text)
    .split(regex)
    .map((part, idx) => {
      const isMatch = valid.some((p) => p.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <strong key={idx} className="font-bold text-[#09090B]">
            {part}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
}

export default renderBoldPhrases;

