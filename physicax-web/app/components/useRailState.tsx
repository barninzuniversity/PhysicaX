"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "physicaxLabRailCollapsed";
const EVENT_NAME = "physicax-rail-toggle";

export function useRailState() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCollapsed(stored === "true");
      return;
    }
    // Hide the rail by default; users can summon it with the toggle button.
    setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    document.body.classList.toggle("rail-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") {
        setCollapsed(detail);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, []);

  const setValue = useCallback((value: boolean) => {
    setCollapsed(value);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
    }
  }, []);

  const toggle = useCallback(() => {
    setValue(!collapsed);
  }, [collapsed, setValue]);

  return { collapsed, toggle, setCollapsed: setValue };
}
