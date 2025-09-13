"use client";

/* import { TempoDevtools } from 'tempo-devtools'; [deprecated] */
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      /* TempoDevtools.init() [deprecated] */;
    }
  }, []);

  return null;
}