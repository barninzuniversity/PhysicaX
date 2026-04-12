import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { RevealOnScroll } from "./components/RevealOnScroll";
import { Providers } from "./providers";
import { LabRail } from "./components/LabRail";

export const metadata: Metadata = {
  title: "PhysicaX - Physics Workspace",
  description: "Local-first computational physics workspace with guided labs, desktop tooling, and CFD workflows.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="bg-grid" aria-hidden="true" />
          <SiteHeader />
          <div className="app-shell">
            <LabRail />
            <div className="app-main">
              <main className="page">{children}</main>
              <SiteFooter />
            </div>
          </div>
          <RevealOnScroll />
        </Providers>
      </body>
    </html>
  );
}
