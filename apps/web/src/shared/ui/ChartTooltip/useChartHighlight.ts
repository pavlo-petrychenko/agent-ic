import { useState } from 'react';
import { ChartHighlightKey } from '@/shared/ui/ChartTooltip/ChartTooltip.constants';
import type {
  ChartHighlight,
  ChartHighlightOptions,
} from '@/shared/ui/ChartTooltip/ChartTooltip.typedefs';

const isHighlightKey = (key: string): key is ChartHighlightKey =>
  Object.values<string>(ChartHighlightKey).includes(key);

const nextIndex = (key: ChartHighlightKey, current: number | null, count: number) => {
  const last = count - 1;
  switch (key) {
    case ChartHighlightKey.Next:
      return current === null ? 0 : Math.min(current + 1, last);
    case ChartHighlightKey.Previous:
      return current === null ? last : Math.max(current - 1, 0);
    case ChartHighlightKey.First:
      return 0;
    case ChartHighlightKey.Last:
      return last;
    case ChartHighlightKey.Dismiss:
      return null;
  }
};

export function useChartHighlight({
  count,
  onHighlight = null,
}: ChartHighlightOptions): ChartHighlight {
  const [current, setCurrent] = useState<number | null>(null);
  const index = current !== null && current < count ? current : null;

  const setIndex = (next: number | null) => {
    const bounded = next !== null && next >= 0 && next < count ? next : null;
    if (bounded === index) {
      return;
    }
    setCurrent(bounded);
    onHighlight?.(bounded);
  };

  const onKeyDown: ChartHighlight['onKeyDown'] = (event) => {
    if (count === 0 || !isHighlightKey(event.key)) {
      return;
    }
    if (event.key === ChartHighlightKey.Dismiss && index === null) {
      return;
    }
    event.preventDefault();
    setIndex(nextIndex(event.key, index, count));
  };

  return { index, setIndex, onKeyDown };
}
