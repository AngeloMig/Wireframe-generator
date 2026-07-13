import type { Metadata } from "next";
import { Geist, Outfit, Spline_Sans_Mono } from "next/font/google";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

// Body face — clean neutral grotesque with more character than Inter.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Display face for page titles and panel headers — rounded geometric,
// matching the editor's soft "spatial UI" language.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

// Drafting-table lettering: eyebrows, labels, title-block details.
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s · ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${outfit.variable} ${splineMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
