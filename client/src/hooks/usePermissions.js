'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVerification } from '@/context/VerificationContext';
import verificationService from '@/services/verificationService';

const normalizeIndianPin = (postcode, countryCode = '') => {
  if (!postcode || typeof postcode !== 'string') return null;
  const trimmed = postcode.trim();
  if (!trimmed) return null;
  if (countryCode.toUpperCase() === 'IN' || /^\d{3}\s*\d{3}$/.test(trimmed)) {
    const compact = trimmed.replace(/\s+/g, '');
    if (/^\d{6}$/.test(compact)) return compact;
  }
  return trimmed;
};

const fetchClientFallbackGeocode = async (latitude, longitude) => {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pincode = normalizeIndianPin(data?.postcode, data?.countryCode || '');
    return {
      latitude,
      longitude,
      pincode,
      city: data?.city || data?.locality || null,
      state: data?.principalSubdivision || null,
      country: data?.countryName || null,
      formattedAddress:
        [data?.locality, data?.city, data?.principalSubdivision, data?.countryName]
          .filter(Boolean)
          .join(', ') || null,
      source: 'bigdatacloud_client'
    };
  } catch {
    return null;
  }
};

const fetchIpLocationFallback = async () => {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success || !Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) {
      return null;
    }
    return {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: null,
      clientHint: {
        postal: data.postal ? data.postal.replace(/\s+/g, '') : '',
        city: data.city || null,
        state: data.region || null,
        country: data.country || null,
        formattedAddress: [data.city, data.region, data.country].filter(Boolean).join(', ') || null
      }
    };
  } catch {
    return null;
  }
};

const getPositionWithOptions = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

/**
 * usePermissions Hook
 * Manages mandatory browser permissions for Camera, Microphone, and Location (with accurate PIN code).
 * Sends captured coordinates to the backend (Groq + GIS + India Post) to resolve and persist the PIN code.
 */
export const usePermissions = (explicitToken = null) => {
  const { token: contextToken, mediaStream, setMediaStream, stopMediaStream } = useVerification();
  const activeToken = explicitToken || contextToken;

  const [cameraStatus, setCameraStatus] = useState('not_requested');
  const [microphoneStatus, setMicrophoneStatus] = useState('not_requested');
  const [locationStatus, setLocationStatus] = useState('not_requested');
  const [locationDetails, setLocationDetails] = useState(null);
  const [isResolvingPincode, setIsResolvingPincode] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const syncPermissionsToBackend = useCallback(
    async (permissions) => {
      if (!activeToken || activeToken === 'invalid' || activeToken === 'completed') return;
      try {
        await verificationService.updateProgress(activeToken, { permissions });
      } catch (e) {
        // Non-fatal
      }
    },
    [activeToken]
  );

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
   * Request mandatory Location permission using navigator.geolocation
   * and send coordinates to backend (Groq + GIS + India Post) to resolve exact PIN code.
   */
  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator) || !navigator.geolocation) {
      setLocationStatus('unavailable');
      setErrorMessage(
        'Location services are not supported by your browser or require an HTTPS connection.'
      );
      await syncPermissionsToBackend({ location: 'unavailable' });
      return { success: false, status: 'unavailable' };
    }

    setLocationStatus('requesting');

    let coords = null;
    let clientHint = null;

    try {
      const position = await getPositionWithOptions({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      });
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (err) {
      if (err.code === err.PERMISSION_DENIED) {
        setLocationStatus('denied');
        setErrorMessage(
          'Location access was denied. Location permission is mandatory to verify your area PIN code and proceed.'
        );
        await syncPermissionsToBackend({ location: 'denied' });
        return { success: false, status: 'denied', error: err };
      }

      // Retry once with standard network/OS cached accuracy
      try {
        const position = await getPositionWithOptions({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000
        });
        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (fallbackErr) {
        if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setErrorMessage(
            'Location access was denied. Location permission is mandatory to verify your area PIN code and proceed.'
          );
          await syncPermissionsToBackend({ location: 'denied' });
          return { success: false, status: 'denied', error: fallbackErr };
        }

        // Check browser permission state: if user ALLOWED Location (not denied),
        // automatically obtain coordinates via IP lookup so Groq/backend can resolve the PIN without manual typing.
        let browserAllowed = false;
        try {
          if (navigator.permissions?.query) {
            const p = await navigator.permissions.query({ name: 'geolocation' });
            browserAllowed = p.state === 'granted';
          }
        } catch {
          // Ignore Permissions API errors
        }

        if (browserAllowed) {
          const ipLoc = await fetchIpLocationFallback();
          if (ipLoc) {
            coords = {
              latitude: ipLoc.latitude,
              longitude: ipLoc.longitude,
              accuracy: ipLoc.accuracy
            };
            clientHint = ipLoc.clientHint;
          }
        }

        if (!coords) {
          setLocationStatus('unavailable');
          setErrorMessage(
            'Unable to detect your device location. Please enable GPS/Location Services on your device and retry.'
          );
          await syncPermissionsToBackend({ location: 'unavailable' });
          return { success: false, status: 'unavailable', error: fallbackErr };
        }
      }
    }

    // Send coordinates to backend (Groq + GIS + India Post) to resolve PIN code
    setIsResolvingPincode(true);
    let resolved = null;

    try {
      if (activeToken && activeToken !== 'invalid' && activeToken !== 'completed') {
        const res = await verificationService.saveLocation(activeToken, {
          ...coords,
          clientHint
        });
        if (res?.success && res?.data) {
          resolved = res.data;
        }
      }
    } catch (backendErr) {
      console.warn('[Location] Backend geocoding fallback triggered:', backendErr.message);
    }

    if (!resolved?.pincode) {
      const clientGeo = await fetchClientFallbackGeocode(coords.latitude, coords.longitude);
      if (clientGeo) {
        resolved = {
          ...coords,
          ...clientGeo,
          pincode: clientGeo.pincode || resolved?.pincode || clientHint?.postal || null
        };
      } else if (clientHint?.postal) {
        resolved = {
          ...coords,
          pincode: clientHint.postal,
          city: clientHint.city,
          state: clientHint.state,
          country: clientHint.country,
          formattedAddress: clientHint.formattedAddress,
          source: 'ip_fallback'
        };
      }
    }

    setIsResolvingPincode(false);

    if (!resolved || !resolved.pincode) {
      setLocationDetails({ ...coords, pincode: null });
      setLocationStatus('unavailable');
      setErrorMessage(
        'Location was detected, but we could not determine an accurate PIN code. Please check your internet connection and retry.'
      );
      await syncPermissionsToBackend({ location: 'unavailable' });
      return { success: false, status: 'unavailable', coords };
    }

    setLocationDetails(resolved);
    setLocationStatus('granted');
    await syncPermissionsToBackend({ location: 'granted' });
    return { success: true, status: 'granted', locationDetails: resolved };
  }, [activeToken, syncPermissionsToBackend]);

  /**
   * Request Camera and Microphone using navigator.mediaDevices.getUserMedia()
   */
  const requestMedia = useCallback(async () => {
    if (mediaStream && mediaStream.active) {
      const hasLiveVideo = mediaStream.getVideoTracks().some((t) => t.readyState === 'live');
      const hasLiveAudio = mediaStream.getAudioTracks().some((t) => t.readyState === 'live');
      if (hasLiveVideo && hasLiveAudio) {
        setCameraStatus('granted');
        setMicrophoneStatus('granted');
        await syncPermissionsToBackend({ camera: 'granted', microphone: 'granted' });
        return { success: true, stream: mediaStream, cameraStatus: 'granted', microphoneStatus: 'granted' };
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg =
        'Your browser does not support media device recording (getUserMedia) or is running in an insecure (HTTP) context. Please use Chrome, Safari, or Edge over HTTPS.';
      setCameraStatus('unavailable');
      setMicrophoneStatus('unavailable');
      setErrorMessage(msg);
      await syncPermissionsToBackend({ camera: 'unavailable', microphone: 'unavailable' });
      return {
        success: false,
        cameraStatus: 'unavailable',
        microphoneStatus: 'unavailable',
        error: new Error('UNSUPPORTED_BROWSER')
      };
    }

    setCameraStatus('requesting');
    setMicrophoneStatus('requesting');
    setErrorMessage(null);

    if (mediaStream) {
      stopMediaStream();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const hasVideo = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
      const hasAudio = audioTracks.length > 0 && audioTracks[0].readyState === 'live';

      if (hasVideo && hasAudio) {
        setCameraStatus('granted');
        setMicrophoneStatus('granted');
        setMediaStream(stream);
        setErrorMessage(null);
        await syncPermissionsToBackend({ camera: 'granted', microphone: 'granted' });
        return { success: true, stream, cameraStatus: 'granted', microphoneStatus: 'granted' };
      }

      const camStat = hasVideo ? 'granted' : 'unavailable';
      const micStat = hasAudio ? 'granted' : 'unavailable';
      if (!hasVideo) setCameraStatus('unavailable');
      if (!hasAudio) setMicrophoneStatus('unavailable');

      const missingMsg =
        !hasVideo && !hasAudio
          ? 'Both camera and microphone tracks were unavailable.'
          : !hasVideo
          ? 'Camera video track was unavailable.'
          : 'Microphone audio track was unavailable.';

      setErrorMessage(missingMsg);
      await syncPermissionsToBackend({ camera: camStat, microphone: micStat });
      return { success: false, stream, cameraStatus: camStat, microphoneStatus: micStat };
    } catch (err) {
      console.warn('getUserMedia request error:', err.name, err.message);

      let friendlyError = '';
      let camStat = 'denied';
      let micStat = 'denied';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
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
          camStat = 'denied';
          micStat = 'denied';
          setCameraStatus('denied');
          setMicrophoneStatus('denied');
          friendlyError =
            'Camera and microphone access was denied. Camera, microphone, and location permissions are all required to complete your verification.';
        } else if (camDenied) {
          camStat = 'denied';
          micStat = 'granted';
          setCameraStatus('denied');
          setMicrophoneStatus('granted');
          friendlyError =
            'Camera access was denied. Camera permission is required to record your verification video.';
        } else {
          camStat = 'granted';
          micStat = 'denied';
          setCameraStatus('granted');
          setMicrophoneStatus('denied');
          friendlyError =
            'Microphone access was denied. Microphone permission is required to record your video responses.';
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        camStat = 'unavailable';
        micStat = 'unavailable';
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'No camera or microphone device was detected. Please connect a working webcam and microphone to your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        camStat = 'unavailable';
        micStat = 'unavailable';
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'Your camera or microphone is currently in use by another application (e.g. Zoom, Google Meet, or another tab). Please close other apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        camStat = 'unavailable';
        micStat = 'unavailable';
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        friendlyError =
          'The requested camera or microphone resolution/features are not supported by your hardware.';
      } else {
        camStat = 'denied';
        micStat = 'denied';
        setCameraStatus('denied');
        setMicrophoneStatus('denied');
        friendlyError =
          'Could not access camera or microphone. Please check your browser site permissions and try again.';
      }

      setErrorMessage(friendlyError);
      await syncPermissionsToBackend({ camera: camStat, microphone: micStat });
      return { success: false, cameraStatus: camStat, microphoneStatus: micStat, error: err };
    }
  }, [mediaStream, setMediaStream, stopMediaStream, syncPermissionsToBackend]);

  /**
   * Main entry point: Requests Camera & Microphone, then mandatory Location + PIN code
   */
  const requestPermissions = useCallback(async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    const mediaResult = await requestMedia();
    if (!mediaResult.success) {
      setIsRequesting(false);
      return {
        success: false,
        stream: null,
        location: { status: locationStatus }
      };
    }

    const locationResult = await requestLocation();

    setIsRequesting(false);

    return {
      success: mediaResult.success && locationResult.success,
      stream: mediaResult.stream || null,
      location: locationResult
    };
  }, [requestMedia, requestLocation, locationStatus]);

  const retryPermissions = useCallback(async () => {
    setErrorMessage(null);
    return await requestPermissions();
  }, [requestPermissions]);

  const canProceed =
    cameraStatus === 'granted' &&
    microphoneStatus === 'granted' &&
    locationStatus === 'granted' &&
    Boolean(locationDetails?.pincode);

  return {
    cameraStatus,
    microphoneStatus,
    locationStatus,
    locationDetails,
    isResolvingPincode,
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
