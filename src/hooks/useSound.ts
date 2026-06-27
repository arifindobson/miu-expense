import { useState, useEffect, useRef, useCallback } from 'react';

export interface SoundPrefs {
  enabled: boolean;
  volume: number; // 0..1
}

const DEFAULTS: SoundPrefs = { enabled: true, volume: 0.6 };
const keyFor = (userId: string | null) => `miu_sound_${userId || 'local'}`;

function loadPrefs(userId: string | null): SoundPrefs {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw);
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULTS.enabled,
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : DEFAULTS.volume,
    };
  } catch {
    return DEFAULTS;
  }
}

export interface UseSound extends SoundPrefs {
  setEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  /** Play the coin sound when sound is enabled (used on a successful submit). */
  playCoin: () => void;
  /** Always play (ignores the enabled flag) — for the Settings "test" button. */
  preview: () => void;
}

/** Per-user sound preferences + a synthesized "cha-ching" coin sound (Web Audio, no asset). */
export function useSound(userId: string | null): UseSound {
  const [prefs, setPrefs] = useState<SoundPrefs>(() => loadPrefs(userId));
  const ctxRef = useRef<AudioContext | null>(null);

  // Reload the right user's prefs whenever the logged-in user changes
  useEffect(() => { setPrefs(loadPrefs(userId)); }, [userId]);

  const persist = (next: SoundPrefs) => {
    setPrefs(next);
    try { localStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch { /* quota */ }
  };

  const play = useCallback((volume: number) => {
    if (volume <= 0) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!ctxRef.current) ctxRef.current = new AC();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const master = ctx.createGain();
      master.gain.value = Math.min(1, Math.max(0, volume));
      master.connect(ctx.destination);

      // Two quick ascending square-wave notes → classic coin "cha-ching"
      const note = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(master);
        const t0 = ctx.currentTime + start;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
      };
      note(987.77, 0, 0.09);      // B5
      note(1318.51, 0.085, 0.34); // E6
    } catch {
      /* audio not available — silently ignore */
    }
  }, []);

  const playCoin = useCallback(() => {
    if (!prefs.enabled) return;
    play(prefs.volume);
  }, [prefs.enabled, prefs.volume, play]);

  const preview = useCallback(() => {
    play(prefs.volume > 0 ? prefs.volume : DEFAULTS.volume);
  }, [prefs.volume, play]);

  return {
    enabled: prefs.enabled,
    volume: prefs.volume,
    setEnabled: (v: boolean) => persist({ ...prefs, enabled: v }),
    setVolume: (v: number) => persist({ ...prefs, volume: Math.min(1, Math.max(0, v)) }),
    playCoin,
    preview,
  };
}
