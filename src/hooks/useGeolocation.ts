import { useState } from 'react';

export interface GeolocationState {
  enabled: boolean;
  coordinates: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  toggle: () => void;
  clearError: () => void;
  reset: () => void;
}

export function useGeolocation(): GeolocationState {
  const [enabled, setEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    if (enabled) {
      setEnabled(false);
      setCoordinates(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
        setEnabled(true);
      },
      (err) => {
        let msg = 'Failed to get location coordinates.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable. Make sure GPS/location services are enabled and active.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setError(msg);
        setLoading(false);
        setEnabled(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return {
    enabled,
    coordinates,
    loading,
    error,
    toggle,
    clearError: () => setError(null),
    reset: () => { setEnabled(false); setCoordinates(null); setError(null); setLoading(false); },
  };
}
