import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const VerificationContext = createContext(null);

export const VerificationProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [currentStep, setCurrentStep] = useState('language_selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

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
