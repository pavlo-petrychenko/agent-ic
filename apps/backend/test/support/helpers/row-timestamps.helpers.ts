import type { RowTimestamps } from '@test/support/typedefs/row-timestamps.typedefs';

export const rowTimestamps = (at: Date): RowTimestamps => ({ createdAt: at, updatedAt: at });
