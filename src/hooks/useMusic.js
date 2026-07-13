/**
 * useMusic.js
 *
 * Simple background music manager. Cycles through tracks,
 * persists mute preference to localStorage, and handles
 * browser autoplay restrictions gracefully.
 */

import { useRef, useState, useEffect, useCallback } from "react";

const TRACKS = [
  "/audio/medieval-background.mp3",
  "/audio/medieval-waltz.mp3",
  "/audio/medieval-happy.mp3",
];

const STORAGE_KEY = "lords-ledger-music-muted";
const VOLUME = 0.3;

export default function useMusic() {
  const audioRef = useRef(null);
  const trackIndexRef = useRef(0);
  const hasInteractedRef = useRef(false);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [playing, setPlaying] = useState(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.volume = VOLUME;
    audio.loop = false;
    audioRef.current = audio;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[trackIndexRef.current];
      audio.play().catch(() => {});
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      audio.pause();
    } else if (hasInteractedRef.current) {
      audio.play().catch(() => {});
    }

    try {
      localStorage.setItem(STORAGE_KEY, String(muted));
    } catch { /* ignore */ }
  }, [muted]);

  // Start playing on first user interaction (if not muted)
  const ensurePlaying = useCallback(() => {
    if (hasInteractedRef.current) return;
    hasInteractedRef.current = true;
    const audio = audioRef.current;
    if (!audio || muted) return;
    audio.play().catch(() => {});
  }, [muted]);

  const toggleMute = useCallback(() => {
    hasInteractedRef.current = true;
    setMuted((prev) => !prev);
  }, []);

  return { muted, playing, toggleMute, ensurePlaying };
}
