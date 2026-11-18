/**
 * Text with one phrase highlighted (spec 0004, AC-15). The content check
 * guarantees the phrase appears exactly once; without one, the text is plain.
 */
export function HighlightedText({
  text,
  phrase,
}: {
  readonly text: string;
  readonly phrase?: string;
}) {
  const index = phrase ? text.indexOf(phrase) : -1;
  if (!phrase || index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-accent-soft box-decoration-clone px-1 text-fg">{phrase}</mark>
      {text.slice(index + phrase.length)}
    </>
  );
}
