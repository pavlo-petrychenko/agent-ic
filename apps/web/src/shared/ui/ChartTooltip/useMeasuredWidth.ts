import { useLayoutEffect, useState } from 'react';

export function useMeasuredWidth(element: HTMLElement | null, fallback: number): number {
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    if (element === null) {
      return;
    }
    const measure = () => {
      const next = element.clientWidth;
      if (next > 0) {
        setWidth(next);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return width;
}
