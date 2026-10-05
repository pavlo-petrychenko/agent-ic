import { Breakpoint } from '@/shared/viewport/constants/viewport.constants';
import type { BreakpointMatches } from '@/shared/viewport/typedefs/viewport.typedefs';

export const resolveBreakpoint = ({
  wide,
  compact,
  unsupported,
}: BreakpointMatches): Breakpoint => {
  if (unsupported) {
    return Breakpoint.Unsupported;
  }
  if (compact) {
    return Breakpoint.Compact;
  }
  return wide ? Breakpoint.Wide : Breakpoint.Default;
};

export const isCompactBreakpoint = (breakpoint: Breakpoint): boolean =>
  breakpoint === Breakpoint.Compact || breakpoint === Breakpoint.Unsupported;
