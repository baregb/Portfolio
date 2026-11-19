import type { MetadataRoute } from "next";
import { getSiteUrl, robotsRules } from "@/features/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(getSiteUrl());
}
