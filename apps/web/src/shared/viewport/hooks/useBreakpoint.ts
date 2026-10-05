import { useSyncExternalStore } from 'react';
import {
  type Breakpoint,
  BREAKPOINT_QUERIES,
  COMPACT_QUERY,
  DEFAULT_BREAKPOINT,
  MEDIA_QUERY_CHANGE_EVENT,
  UNSUPPORTED_QUERY,
  WIDE_QUERY,
} from '@/shared/viewport/constants/viewport.constants';
import { resolveBreakpoint } from '@/shared/viewport/helpers/viewport.helpers';

const hasMatchMedia = (): boolean => typeof window.matchMedia === 'function';

const matches = (query: string): boolean => window.matchMedia(query).matches;

const subscribe = (listener: () => void): (() => void) => {
  if (!hasMatchMedia()) {
    return () => undefined;
  }
  const lists = BREAKPOINT_QUERIES.map((query) => window.matchMedia(query));
  for (const list of lists) {
    list.addEventListener(MEDIA_QUERY_CHANGE_EVENT, listener);
  }
  return () => {
    for (const list of lists) {
      list.removeEventListener(MEDIA_QUERY_CHANGE_EVENT, listener);
    }
  };
};

const getSnapshot = (): Breakpoint => {
  if (!hasMatchMedia()) {
    return DEFAULT_BREAKPOINT;
  }
  return resolveBreakpoint({
    wide: matches(WIDE_QUERY),
    compact: matches(COMPACT_QUERY),
    unsupported: matches(UNSUPPORTED_QUERY),
  });
};

export const useBreakpoint = (): Breakpoint => useSyncExternalStore(subscribe, getSnapshot);
