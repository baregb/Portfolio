import { serializeJsonLd } from "./structured-data";

/** Structured data for search engines; read, never run, by the browser. */
export function JsonLd({ data }: { readonly data: Readonly<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
