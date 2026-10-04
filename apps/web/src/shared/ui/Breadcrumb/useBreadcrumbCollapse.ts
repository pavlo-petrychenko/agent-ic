import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BREADCRUMB_COLLAPSE_KEY_SEPARATOR } from '@/shared/ui/Breadcrumb/Breadcrumb.constants';

interface CollapseState {
  key: string;
  count: number;
}

export function useBreadcrumbCollapse(signature: string, collapsibleCount: number) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState<CollapseState>({ key: '', count: 0 });

  const key = `${signature}${BREADCRUMB_COLLAPSE_KEY_SEPARATOR}${width}`;
  const count = state.key === key ? state.count : 0;

  useEffect(() => {
    const nav = navRef.current;
    if (nav === null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setWidth(Math.round(entry.contentRect.width));
      }
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null || count >= collapsibleCount) {
      return;
    }
    if (list.scrollWidth > list.clientWidth) {
      setState({ key, count: count + 1 });
    }
  }, [count, collapsibleCount, key]);

  return { navRef, listRef, collapsedCount: Math.min(count, collapsibleCount) };
}
