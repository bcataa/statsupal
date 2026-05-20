"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function CrispChat() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) {
      return;
    }

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = websiteId;

    const existing = document.getElementById("crisp-chat-sdk");
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.id = "crisp-chat-sdk";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return null;
}

