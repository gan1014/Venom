import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteChrome } from "../components/UnlockGate";

export const metadata: Metadata = {
  title: "LEGO LEVIATHON — Build Beyond Limits",
  description: "Free AI Hackathon 2026. Register your team. Bind your symbionts. Enter the Leviathon.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#030304",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
