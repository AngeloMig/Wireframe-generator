import type { Metadata } from "next";
import { Archivo, Inter, Spline_Sans_Mono } from "next/font/google";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Display face for page titles — technical-grotesque, set tight.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
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
      className={`${inter.variable} ${archivo.variable} ${splineMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
