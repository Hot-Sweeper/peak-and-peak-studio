import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FF2D55",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Peak Studio — Slowed & Reverb Audio Effects",
  description:
    "Create slowed + reverb, bass boost, pitch shift, and more — directly in your browser. No downloads, no installs.",
  applicationName: "Peak Studio",
  keywords: ["slowed reverb", "audio effects", "music studio", "browser audio", "bass boost", "pitch shift"],
  openGraph: {
    title: "Peak Studio — Slowed & Reverb Audio Effects",
    description: "Create slowed + reverb, bass boost, pitch shift, and more — directly in your browser.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
