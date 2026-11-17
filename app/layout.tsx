import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omogbolahan Ajibare",
  description:
    "Web solutions architect and software developer. Case studies organised around the problems solved.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
