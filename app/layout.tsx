import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ViewTransition } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/site/skip-link";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsClicks, AnalyticsScript, getUmamiWebsiteId } from "@/features/analytics";
import { getProfile } from "@/features/content";
import { THEME_SCRIPT } from "@/features/design/theme";
import { defaultSocialMetadata, getSiteUrl, ICON_FILES, siteRobotsMetadata } from "@/features/seo";
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
const siteUrl = getSiteUrl();
const umamiWebsiteId = getUmamiWebsiteId();

// Spec 0004, AC-13: every page title reads "<page> · <name>"; home sets an
// absolute title. Feature 13: `metadataBase` makes every page's canonical and
// card paths absolute, and pages with no card of their own (request details,
// the styleguide, both never indexed) fall back to the home card. A preview or
// local build marks every page `noindex` (feature 15).
const robots = siteRobotsMetadata(siteUrl);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: `%s · ${profile.name}`, default: profile.name },
  description: profile.headline,
  ...defaultSocialMetadata(),
  ...(robots ? { robots } : {}),
  // Rendered into `public/` by `pnpm cards` (feature 15).
  icons: {
    icon: [
      { url: `/${ICON_FILES.favicon.file}`, sizes: "32x32" },
      { url: `/${ICON_FILES.icon.file}`, type: "image/png", sizes: "512x512" },
    ],
    apple: { url: `/${ICON_FILES.apple.file}`, sizes: "180x180" },
  },
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
        {umamiWebsiteId ? (
          <AnalyticsScript websiteId={umamiWebsiteId} host={new URL(siteUrl).hostname} />
        ) : null}
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
        <AnalyticsClicks />
      </body>
    </html>
  );
}
