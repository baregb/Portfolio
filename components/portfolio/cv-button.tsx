import { Download } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { CvAsset } from "@/features/media/manifest";

/**
 * The CV download (spec 0004, AC-10): a plain `<a download>` with the file
 * size beside the label and the analytics hook. Without a file (drafts mode
 * only; a production build fails first) it is a disabled "CV coming soon".
 */
export function CvButton({
  cv,
  size = "md",
}: {
  readonly cv: CvAsset;
  readonly size?: ButtonSize;
}) {
  if (!cv) {
    return (
      <Button variant="secondary" size={size} disabled iconStart={<Icon icon={Download} />}>
        CV coming soon
      </Button>
    );
  }
  return (
    <Button
      variant="secondary"
      size={size}
      file={cv.href}
      data-analytics-event="cv-download"
      iconStart={<Icon icon={Download} />}
    >
      Download CV
      <span className="font-mono text-xs font-normal text-muted">PDF, {cv.sizeLabel}</span>
    </Button>
  );
}
