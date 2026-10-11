export const durationMs = (startedAt: Date | null, finishedAt: Date | null): number | null =>
  startedAt === null || finishedAt === null ? null : finishedAt.getTime() - startedAt.getTime();
