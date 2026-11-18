import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ViewTransition } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/site/skip-link";
import { Toaster } from "@/components/ui/toaster";
import { getProfile } from "@/features/content";
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

const profile = getProfile();

// Spec 0004, AC-13: every page title reads "<page> · <name>"; home sets an
// absolute title. Social cards and canonical addresses come with feature 13.
export const metadata: Metadata = {
  title: { template: `%s · ${profile.name}`, default: profile.name },
  description: profile.headline,
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
      <body className="flex min-h-dvh flex-col">
        <Toaster>
          <SkipLink />
          <SiteHeader />
          {/* AC-7: route changes crossfade; reduced motion turns it off in CSS. */}
          <ViewTransition>
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
          </ViewTransition>
          <SiteFooter />
        </Toaster>
      </body>
    </html>
  );
}
