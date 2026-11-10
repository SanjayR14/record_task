'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ENGLISH_STRINGS,
  buildUiTranslations,
  getLanguageConfig
} from '@/i18n/translations';
import { translateTextMap } from '@/services/translateService';

const VerificationContext = createContext(null);

export const VerificationProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [currentStep, setCurrentStep] = useState('language_selection');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedFlatMap, setTranslatedFlatMap] = useState(ENGLISH_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

  const langConfig = useMemo(() => getLanguageConfig(selectedLanguage), [selectedLanguage]);

  // Dynamically translate UI & scenario strings via Groq whenever selectedLanguage changes
  useEffect(() => {
    let active = true;

    const runTranslation = async () => {
      if (langConfig.id === 'en') {
        setTranslatedFlatMap(ENGLISH_STRINGS);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      const translated = await translateTextMap(ENGLISH_STRINGS, langConfig.id);
      if (active) {
        setTranslatedFlatMap(translated);
        setIsTranslating(false);
      }
    };

    runTranslation();

    return () => {
      active = false;
    };
  }, [langConfig.id]);

  // Helper to dynamically translate arbitrary English strings (e.g., DB-loaded questions)
  const translateDynamicTexts = useCallback(
    async (textsMap) => {
      if (langConfig.id === 'en') return textsMap;
      return await translateTextMap(textsMap, langConfig.id);
    },
    [langConfig.id]
  );

  const t = useMemo(() => buildUiTranslations(translatedFlatMap), [translatedFlatMap]);

  const stopMediaStream = useCallback(() => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping media tracks:', e);
      }
      setMediaStream(null);
    }
  }, [mediaStream]);

  // Clean up any active stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach((track) => track.stop());
        } catch (e) {}
      }
    };
  }, [mediaStream]);

  // Clear or reset verification session
  const resetSession = () => {
    stopMediaStream();
    setToken(null);
    setVerificationData(null);
    setCurrentStep('language_selection');
    setError(null);
  };

  const value = {
    token,
    setToken,
    verificationData,
    setVerificationData,
    currentStep,
    setCurrentStep,
    selectedLanguage,
    setSelectedLanguage,
    langConfig,
    t,
    isTranslating,
    translateDynamicTexts,
    isLoading,
    setIsLoading,
    error,
    setError,
    mediaStream,
    setMediaStream,
    stopMediaStream,
    resetSession
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

export default VerificationContext;
