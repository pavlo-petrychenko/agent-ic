export const isDraftUnchanged = (changeCount: number | null, liveNumber: number | null): boolean =>
  liveNumber !== null && changeCount === 0;
