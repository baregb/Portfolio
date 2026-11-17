import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { THEME_SCRIPT } from "@/features/design/theme";
import "./globals.css";

// Spec 0003: fonts self hosted at build by next/font; no request to Google.
const bricolage = Bricolage_Grotesque({
  // Variable font (one file covers 700 and 800); the opsz axis keeps the
  // display sizes crisp. Fixed weights cannot be combined with axes.
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
});
const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-geist",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Omogbolahan Ajibare",
  description:
    "Web solutions architect and software developer. Case studies organised around the problems solved.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The head script sets the theme class before React loads.
      suppressHydrationWarning
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
