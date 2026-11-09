import React, { useState, useEffect } from 'react';
import { Camera, Mic, MapPin, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import usePermissions from '@/hooks/usePermissions';

export const Step3Permissions = ({ onGrantPermissions }) => {
  const {
    cameraStatus,
    microphoneStatus,
    locationStatus,
    isRequesting,
    errorMessage,
    canProceed,
    requestPermissions,
    retryPermissions
  } = usePermissions();

  const [hasReadText, setHasReadText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const promptText =
    "Okay... I think you are ready now. Before we start, I'll need your camera and mic, that's how you'll answer the questions on video.";

  // Automatically read the text fully on page mount without needing manual button click
  useEffect(() => {
    setIsSpeaking(true);
    setHasReadText(false);

    // Speak using Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        setIsSpeaking(false);
        setHasReadText(true);
      };

      try {
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // Fallback handled by readTimer
      }
    }

    // The text is 24 words (~5 seconds reading time).
    // Ensure the text reads fully before enabling Grant Access.
    const readTimer = setTimeout(() => {
      setIsSpeaking(false);
      setHasReadText(true);
    }, 9950);

    return () => {
      clearTimeout(readTimer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When both mandatory permissions are granted, smoothly proceed to the next step
  const handleGrant = async () => {
    if (!hasReadText || isRequesting) return;

    // Call the actual native permission request
    const result = await requestPermissions();

    if (result.success) {
      // Both camera and microphone granted!
      // Give a brief 500ms pause so the candidate sees the green Allowed checkmarks
      setTimeout(() => {
        if (onGrantPermissions) {
          onGrantPermissions({
            camera: true,
            microphone: true,
            location: result.location?.status === 'granted'
          });
        }
      }, 500);
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
            location: result.location?.status === 'granted'
          });
        }
      }, 500);
    }
  };

  const isDeniedOrUnavailable =
    cameraStatus === 'denied' ||
    cameraStatus === 'unavailable' ||
    microphoneStatus === 'denied' ||
    microphoneStatus === 'unavailable';

  // Dynamic status badge renderer preserving exact Figma visual design
  const renderStatusBadge = (status, isMandatory = true) => {
    switch (status) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Allowed
          </span>
        );
      case 'requesting':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xl border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Requesting...
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Denied
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-xl">
            Unavailable
          </span>
        );
      default:
        return isMandatory ? (
          <span className="text-[10px] font-bold text-[#FF502B] bg-[#FFF0EE] px-2.5 py-1 rounded-xl tracking-wider">
            Required
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
          <p className="text-lg sm:text-xl text-slate-900 leading-relaxed ">
            Okay... I think you are ready now. Before we start, I'll need your{" "}
            <strong className="font-bold">camera and mic</strong>, that's how you'll
            answer the questions on video.
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Access required</p>
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
                <span className="text-xs font-semibold text-slate-800 block">Camera</span>
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
                <span className="text-xs font-semibold text-slate-800 block">Microphone</span>
              </div>
            </div>
            {renderStatusBadge(microphoneStatus, true)}
          </div>

          {/* Location Permission Item */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Location</span>
              </div>
            </div>
            {renderStatusBadge(locationStatus, false)}
          </div>
        </div>

        {/* Helpful error banner when permissions are denied or devices unavailable */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1.5 animate-fadeIn shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Permission Required</span>
            </div>
            <p>{errorMessage}</p>
            <p className="text-[11px] text-rose-600">
              If previously blocked, click the lock or camera icon in your browser address bar to allow permissions, then click Retry below.
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
            <span>{isRequesting ? 'Requesting access...' : 'Retry Permission Access'}</span>
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
              'Requesting access...'
            ) : canProceed ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Permissions Granted
              </span>
            ) : (
              'Grant Access'
            )}
          </button>
        )}

        {!hasReadText && !isDeniedOrUnavailable && (
          <p className="text-center text-[11px] text-stone-500 font-medium animate-fadeIn">
            Please listen to the instructions above to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default Step3Permissions;
