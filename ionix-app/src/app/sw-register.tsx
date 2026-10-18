"use client";

import { useEffect } from "react";

/** Registra il service worker — serve a Chrome/Android per considerare l'app installabile. */
export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
