"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "./components/LocaleProvider";
import { FirstRunTour } from "./components/FirstRunTour";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        {children}
        <FirstRunTour />
      </LocaleProvider>
    </SessionProvider>
  );
}
