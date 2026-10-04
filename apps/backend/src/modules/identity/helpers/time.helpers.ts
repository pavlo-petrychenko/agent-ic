import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

export const addSeconds = (date: Date, seconds: number): Date =>
  new Date(date.getTime() + seconds * MILLISECONDS_PER_SECOND);

export const isPast = (moment: Date, now: Date): boolean => moment.getTime() <= now.getTime();
