import {
  METRIC_LABEL_PATTERN,
  METRIC_LINE_PATTERN,
  METRIC_TOTAL_SUFFIX,
} from '@test/support/constants/metrics-testing.constants';

export const metricTypeLine = (name: string): string =>
  `# TYPE ${name.endsWith(METRIC_TOTAL_SUFFIX) ? name.slice(0, -METRIC_TOTAL_SUFFIX.length) : name} `;

export const scrapedValue = (
  scrape: string,
  name: string,
  labels: Readonly<Record<string, string>>,
): number | null => {
  for (const line of scrape.split('\n')) {
    const match = METRIC_LINE_PATTERN.exec(line);
    if (match?.[1] !== name) {
      continue;
    }
    const sampleLabels = new Map(
      [...(match[2] ?? '').matchAll(METRIC_LABEL_PATTERN)].map(([, key, value]) => [key, value]),
    );
    if (Object.entries(labels).every(([key, wanted]) => sampleLabels.get(key) === wanted)) {
      return Number(match[3]);
    }
  }
  return null;
};
