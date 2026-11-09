import { useState, useCallback, useEffect } from 'react';
import { useVerification } from '@/context/VerificationContext';

/**
 * usePermissions Hook
 * Manages browser permissions for Camera (mandatory), Microphone (mandatory), and Location (optional).
 * Handles native getUserMedia() and geolocation Web APIs with cross-browser compatibility and error mapping.
 */
export const usePermissions = () => {
  const { mediaStream, setMediaStream, stopMediaStream } = useVerification();

  const [cameraStatus, setCameraStatus] = useState('not_requested');
  const [microphoneStatus, setMicrophoneStatus] = useState('not_requested');
  const [locationStatus, setLocationStatus] = useState('not_requested');
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If a live stream is already active in context, update granted statuses
  useEffect(() => {
    if (mediaStream && mediaStream.active) {
      const hasLiveVideo = mediaStream.getVideoTracks().some((t) => t.readyState === 'live');
      const hasLiveAudio = mediaStream.getAudioTracks().some((t) => t.readyState === 'live');
      if (hasLiveVideo) setCameraStatus('granted');
      if (hasLiveAudio) setMicrophoneStatus('granted');
    }
  }, [mediaStream]);

  /**
   * Request Location permission using navigator.geolocation
   * Location is optional: does not block the candidate if denied or unavailable.
   */
  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator) || !navigator.geolocation) {
        setLocationStatus('unavailable');
        resolve({ status: 'unavailable' });
        return;
      }

      setLocationStatus('requesting');

      // 3-second safety timer so location never stalls candidate progression
      const timer = setTimeout(() => {
        setLocationStatus('unavailable');
        resolve({ status: 'unavailable' });
      }, 3000);

      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timer);
            setLocationStatus('granted');
            resolve({ status: 'granted', position });
          },
          (error) => {
            clearTimeout(timer);
            if (error.code === error.PERMISSION_DENIED) {
              setLocationStatus('denied');
              resolve({ status: 'denied', error });
            } else {
              setLocationStatus('unavailable');
              resolve({ status: 'unavailable', error });
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 60000
          }
        );
      } catch (e) {
        clearTimeout(timer);
        setLocationStatus('unavailable');
        resolve({ status: 'unavailable' });
      }
    });
  }, []);

  /**
   * Request Camera and Microphone using navigator.mediaDevices.getUserMedia()
   */
  const requestMedia = useCallback(async () => {
    // 1. Check browser API availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg =
        'Your browser does not support media device recording (getUserMedia) or is running in an insecure (HTTP) context. Please use Chrome, Safari, or Edge over HTTPS.';
      setCameraStatus('unavailable');
      setMicrophoneStatus('unavailable');
      setErrorMessage(msg);
      return { success: false, error: new Error('UNSUPPORTED_BROWSER') };
    }

    setCameraStatus('requesting');
    setMicrophoneStatus('requesting');
    setErrorMessage(null);

    // Clean up any previously stored stream before requesting a fresh one
    if (mediaStream) {
      stopMediaStream();
    }

    try {
      // Request both camera (video) and microphone (audio) together as required by prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Verify that valid video and audio tracks were returned and are active
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const hasVideo = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
      const hasAudio = audioTracks.length > 0 && audioTracks[0].readyState === 'live';

      if (hasVideo && hasAudio) {
        setCameraStatus('granted');
        setMicrophoneStatus('granted');
        setMediaStream(stream);
        setErrorMessage(null);
        return { success: true, stream };
      }

      // Edge case: stream was returned but one track is missing/dead
      if (!hasVideo) setCameraStatus('unavailable');
      if (!hasAudio) setMicrophoneStatus('unavailable');

      const missingMsg =
        !hasVideo && !hasAudio
          ? 'Both camera and microphone tracks were unavailable.'
          : !hasVideo
          ? 'Camera video track was unavailable.'
          : 'Microphone audio track was unavailable.';

      setErrorMessage(missingMsg);
      return { success: false, stream };
    } catch (err) {
      console.warn('getUserMedia request error:', err.name, err.message);

      let friendlyError = '';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // User clicked Deny/Block or system permissions blocked it
        // Probe individual media types to identify whether camera, mic, or both were denied
        let camDenied = true;
        let micDenied = true;

        try {
          const testAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
          micDenied = false;
          testAudio.getTracks().forEach((t) => t.stop());
        } catch (audioErr) {
          if (audioErr.name !== 'NotAllowedError' && audioErr.name !== 'PermissionDeniedError') {
            micDenied = false;
          }
        }

        try {
          const testVideo = await navigator.mediaDevices.getUserMedia({ video: true });
          camDenied = false;
          testVideo.getTracks().forEach((t) => t.stop());
        } catch (videoErr) {
          if (videoErr.name !== 'NotAllowedError' && videoErr.name !== 'PermissionDeniedError') {
            camDenied = false;
          }
        }

        if (camDenied && micDenied) {
          setCameraStatus('denied');
          setMicrophoneStatus('denied');
          friendlyError =
            'Camera and microphone access was denied. Both permissions are required to complete your verification video interview.';
        } else if (camDenied) {
          setCameraStatus('denied');
          setMicrophoneStatus('granted');
          friendlyError =
            'Camera access was denied. Camera permission is required to record your verification video.';
        } else {
          setCameraStatus('granted');
          setMicrophoneStatus('denied');
          friendlyError =
            'Microphone access was denied. Microphone permission is required to record your video responses.';
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'No camera or microphone device was detected. Please connect a working webcam and microphone to your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'Your camera or microphone is currently in use by another application (e.g. Zoom, Google Meet, or another tab). Please close other apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'The requested camera or microphone resolution/features are not supported by your hardware.';
      } else {
        setCameraStatus('denied');
        setMicrophoneStatus('denied');
        friendlyError =
          'Could not access camera or microphone. Please check your browser site permissions and try again.';
      }

      setErrorMessage(friendlyError);
      return { success: false, error: err };
    }
  }, [mediaStream, setMediaStream, stopMediaStream]);

  /**
   * Main entry point: Requests Camera, Microphone, and Location
   */
  const requestPermissions = useCallback(async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    // Request location in parallel (optional: does not block media result)
    requestLocation();

    // Mandatory media request
    const mediaResult = await requestMedia();

    setIsRequesting(false);

    return {
      success: mediaResult.success,
      stream: mediaResult.stream || null
    };
  }, [requestMedia, requestLocation]);

  /**
   * Retry requesting permissions
   */
  const retryPermissions = useCallback(async () => {
    setErrorMessage(null);
    return await requestPermissions();
  }, [requestPermissions]);

  const canProceed = cameraStatus === 'granted' && microphoneStatus === 'granted';

  return {
    cameraStatus,
    microphoneStatus,
    locationStatus,
    isRequesting,
    errorMessage,
    mediaStream,
    canProceed,
    requestPermissions,
    retryPermissions,
    stopMediaStream
  };
};

export default usePermissions;
