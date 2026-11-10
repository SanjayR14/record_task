'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';
import { Camera, Mic, MapPin, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import usePermissions from '@/hooks/usePermissions';
import VerificationContext from '@/context/VerificationContext';
import { getLanguageConfig, getTranslations } from '@/i18n/translations';
import { speakText, stopSpeech } from '@/utils/speech';
import { renderBoldPhrases } from '@/utils/formatBoldText';

export const Step3Permissions = ({ onGrantPermissions }) => {
  const params = useParams();
  const token = params?.token;
  const ctx = useContext(VerificationContext);
  const langConfig = ctx?.langConfig || getLanguageConfig('en');
  const t = ctx?.t || getTranslations('en');
  const isTranslating = Boolean(ctx?.isTranslating);

  const {
    cameraStatus,
    microphoneStatus,
    locationStatus,
    locationDetails,
    isResolvingPincode,
    isRequesting,
    errorMessage,
    canProceed,
    requestPermissions,
    retryPermissions
  } = usePermissions(token);

  const [hasReadText, setHasReadText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const promptText = t.step3.promptSpeech;

  // Automatically read the text fully on page mount in the selected language
  useEffect(() => {
    if (isTranslating) return;

    setIsSpeaking(true);
    setHasReadText(false);

    speakText({
      text: promptText,
      langId: langConfig.id,
      ttsLang: langConfig.ttsLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setHasReadText(true);
      },
      onCancel: () => {
        setIsSpeaking(false);
      }
    });

    // Safety fallback timer to unlock Grant Access even if browser blocks autoplay audio
    const readTimer = setTimeout(() => {
      setIsSpeaking(false);
      setHasReadText(true);
    }, 9950);

    return () => {
      clearTimeout(readTimer);
      stopSpeech();
    };
  }, [promptText, langConfig.id, langConfig.ttsLang, isTranslating]);

  // When all mandatory permissions (camera, microphone, location + PIN code) are granted, proceed smoothly
  const handleGrant = async () => {
    if (!hasReadText || isRequesting) return;

    // Call the actual native permission request
    const result = await requestPermissions();

    if (result.success) {
      // Camera, microphone, and location + PIN code granted!
      // Brief pause so candidate sees green Allowed checkmarks and detected PIN code
      setTimeout(() => {
        if (onGrantPermissions) {
          onGrantPermissions({
            camera: true,
            microphone: true,
            location: true,
            locationDetails: result.location?.locationDetails || null
          });
        }
      }, 800);
    }
  };

  const handleRetry = async () => {
    const result = await retryPermissions();
    if (result.success) {
      setTimeout(() => {
        if (onGrantPermissions) {
          onGrantPermissions({
            camera: true,
            microphone: true,
            location: true,
            locationDetails: result.location?.locationDetails || null
          });
        }
      }, 800);
    }
  };

  const isDeniedOrUnavailable =
    cameraStatus === 'denied' ||
    cameraStatus === 'unavailable' ||
    microphoneStatus === 'denied' ||
    microphoneStatus === 'unavailable' ||
    locationStatus === 'denied' ||
    locationStatus === 'unavailable';

  // Dynamic status badge renderer preserving exact Figma visual design
  const renderStatusBadge = (status, isMandatory = true) => {
    switch (status) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> {t.step3.badges.granted}
          </span>
        );
      case 'requesting':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xl border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> {t.step3.badges.requesting}
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> {t.step3.badges.denied}
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-xl">
            {t.step3.badges.unavailable}
          </span>
        );
      default:
        return isMandatory ? (
          <span className="text-[10px] font-bold text-[#FF502B] bg-[#FFF0EE] px-2.5 py-1 rounded-xl tracking-wider">
            {t.step3.badges.required}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[#9A9A9A] bg-slate-100 px-3.5 py-1 rounded-xl">
            Optional
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3.5">
        {/* Assistant Bubble */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] space-y-1.5">
          <p className="text-lg sm:text-xl text-black font-medium leading-relaxed ">
            {renderBoldPhrases(t.step3.promptSpeech, ['camera, mic, and location', 'camera and mic'])}
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-[11px] text-slate-500 font-medium">{t.step3.accessRequired}</p>
          </div>
        </div>

        {/* Permissions Items List */}
        <div className="space-y-2 pt-1">
          {/* Camera Permission Item */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">{t.step3.camera}</span>
              </div>
            </div>
            {renderStatusBadge(cameraStatus, true)}
          </div>

          {/* Microphone Permission Item */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">{t.step3.microphone}</span>
              </div>
            </div>
            {renderStatusBadge(microphoneStatus, true)}
          </div>

          {/* Location Permission Item (Mandatory + PIN code resolution) */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">{t.step3.location}</span>
                {isResolvingPincode && (
                  <span className="text-[10px] text-amber-600 font-medium block">
                    {t.step3.detectingPin}
                  </span>
                )}
                {!isResolvingPincode && locationDetails?.pincode && (
                  <span className="text-[11px] text-emerald-700 font-semibold block">
                    {t.step3.pinLabel}: {locationDetails.pincode}
                    {locationDetails.postOffice
                      ? ` · ${locationDetails.postOffice}`
                      : locationDetails.city
                        ? ` · ${locationDetails.city}`
                        : ''}
                  </span>
                )}
              </div>
            </div>
            {renderStatusBadge(locationStatus, true)}
          </div>
        </div>

        {/* Helpful error banner when permissions are denied or devices unavailable */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1.5 animate-fadeIn shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{t.step3.permissionRequiredTitle}</span>
            </div>
            <p>{errorMessage}</p>
            <p className="text-[11px] text-rose-600">
              {t.step3.permissionHint}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 space-y-2">
        {isDeniedOrUnavailable ? (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRequesting}
            className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRequesting ? t.step3.requestingAccess : t.step3.retryAccess}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGrant}
            disabled={!hasReadText || isRequesting || canProceed}
            className={`w-full py-3.5 px-4 font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${hasReadText && !isRequesting && !canProceed
              ? 'bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white active:scale-[0.99] cursor-pointer'
              : canProceed
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none opacity-60'
              }`}
          >
            {isRequesting ? (
              t.step3.requestingAccess
            ) : canProceed ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {t.step3.permissionsGranted}
              </span>
            ) : (
              t.step3.grantAccess
            )}
          </button>
        )}

        {!hasReadText && !isDeniedOrUnavailable && (
          <p className="text-center text-[11px] text-stone-500 font-medium animate-fadeIn">
            {t.step3.listenPromptHint}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step3Permissions;
