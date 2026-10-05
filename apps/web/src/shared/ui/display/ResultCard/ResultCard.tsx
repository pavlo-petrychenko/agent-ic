import clsx from 'clsx';
import { Badge } from '@/shared/ui/display/Badge/Badge';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import { RESULT_CARD_SCORE_DIGITS } from '@/shared/ui/display/ResultCard/ResultCard.constants';
import type {
  ResultCardProps,
  SnippetSegment,
} from '@/shared/ui/display/ResultCard/ResultCard.typedefs';
import styles from '@/shared/ui/display/ResultCard/ResultCard.module.scss';

function splitSnippet(snippet: string, highlight: string | null): SnippetSegment[] {
  if (highlight === null || highlight === '') {
    return [{ text: snippet, match: false }];
  }
  const haystack = snippet.toLowerCase();
  const needle = highlight.toLowerCase();
  const segments: SnippetSegment[] = [];
  let cursor = 0;
  let found = haystack.indexOf(needle, cursor);
  while (found !== -1) {
    if (found > cursor) {
      segments.push({ text: snippet.slice(cursor, found), match: false });
    }
    segments.push({ text: snippet.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
    found = haystack.indexOf(needle, cursor);
  }
  if (cursor < snippet.length) {
    segments.push({ text: snippet.slice(cursor), match: false });
  }
  return segments;
}

export function ResultCard({
  source,
  snippet,
  score = null,
  href = null,
  highlight = null,
  className,
}: ResultCardProps) {
  const body = (
    <>
      <span className={styles.header}>
        <span className={styles.source}>{source}</span>
        {score !== null && (
          <Badge tone={BadgeTone.Accent} mono>
            {score.toFixed(RESULT_CARD_SCORE_DIGITS)}
          </Badge>
        )}
      </span>
      <span className={styles.snippet}>
        {splitSnippet(snippet, highlight).map((segment, index) =>
          segment.match ? (
            <mark key={index} className={styles.match}>
              {segment.text}
            </mark>
          ) : (
            segment.text
          ),
        )}
      </span>
    </>
  );

  if (href !== null) {
    return (
      <a href={href} className={clsx(styles.root, styles.link, className)}>
        {body}
      </a>
    );
  }

  return <article className={clsx(styles.root, className)}>{body}</article>;
}
