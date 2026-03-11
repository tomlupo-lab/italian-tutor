"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // Ignore unregister failures in local dev
          });
        });
      });
      return;
    }

    navigator.serviceWorker.register("/tutor/sw.js").catch(() => {
      // Service worker registration failed — non-critical
    });
  }, []);

  return null;
}
