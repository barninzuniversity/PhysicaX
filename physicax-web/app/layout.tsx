import "./globals.css";
import "katex/dist/katex.min.css";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { RevealOnScroll } from "./components/RevealOnScroll";
import { Providers } from "./providers";
import { LabRail } from "./components/LabRail";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = {
  title: "PhysicaX - Physics Workspace",
  description: "Local-first computational physics workspace with guided labs, desktop tooling, and CFD workflows."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
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
