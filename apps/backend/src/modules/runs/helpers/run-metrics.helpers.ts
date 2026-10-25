import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

export const secondsBetween = (from: Date, to: Date): number =>
  Math.max(0, to.getTime() - from.getTime()) / MILLISECONDS_PER_SECOND;
