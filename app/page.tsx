import type { Metadata } from "next";
import { HomePage, homeMetadata } from "@/features/home/home-page";

export const metadata: Metadata = homeMetadata();

export default function Home() {
  return <HomePage />;
}
