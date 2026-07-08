"use client";

import { useEffect, useRef } from "react";

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 30 * 1000;
const STORAGE_KEY = "pawscript:lastActivity";

/**
 * App-level session idle timeout. Signs the user out after 30 minutes of
 * inactivity. Activity is shared across tabs via localStorage. This complements
 * Supabase's JWT expiry / refresh-token rotation, which enforces absolute
 * expiry on the server.
 */
export function IdleTimeout() {
  const signingOut = useRef(false);

  useEffect(() => {
    function markActive() {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore storage failures
      }
    }

    function lastActive(): number {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? Number(raw) : Date.now();
      } catch {
        return Date.now();
      }
    }

    async function signOut() {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        await fetch("/auth/signout", { method: "POST" });
      } catch {
        // ignore network failure; still redirect
      }
      window.location.href = "/login";
    }

    function check() {
      if (Date.now() - lastActive() >= IDLE_LIMIT_MS) {
        void signOut();
      }
    }

    markActive();

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
