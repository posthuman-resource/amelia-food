"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "audio-enabled";
const EVENT_NAME = "audio-enabled-changed";

function getStored(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function useAudioEnabled(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(true);

  // Sync from localStorage on mount
  useEffect(() => {
    setEnabled(getStored());
  }, []);

  // Listen for changes from other components
  useEffect(() => {
    function onChanged() {
      setEnabled(getStored());
    }
    window.addEventListener(EVENT_NAME, onChanged);
    return () => window.removeEventListener(EVENT_NAME, onChanged);
  }, []);

  const toggle = useCallback(() => {
    const next = !getStored();
    localStorage.setItem(STORAGE_KEY, String(next));
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }, []);

  return [enabled, toggle];
}
