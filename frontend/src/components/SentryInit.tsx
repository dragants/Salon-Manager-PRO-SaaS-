"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/react";

export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0"),
      environment: process.env.NODE_ENV || "development",
    });
  }, []);

  return null;
}

