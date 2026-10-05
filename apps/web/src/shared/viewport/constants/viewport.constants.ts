export enum Breakpoint {
  Wide = 'wide',
  Default = 'default',
  Compact = 'compact',
  Unsupported = 'unsupported',
}

export const WIDE_QUERY = '(min-width: 1440px)';
export const COMPACT_QUERY = '(max-width: 1279px)';
export const UNSUPPORTED_QUERY = '(max-width: 1023px)';

export const BREAKPOINT_QUERIES: readonly string[] = [WIDE_QUERY, COMPACT_QUERY, UNSUPPORTED_QUERY];
export const DEFAULT_BREAKPOINT = Breakpoint.Wide;
export const MEDIA_QUERY_CHANGE_EVENT = 'change';
