import { MissingStoredRowError } from '@/platform/database/errors/missing-stored-row.error';

export const storedRow = <TRow>(rows: readonly TRow[]): TRow => {
  const [row] = rows;
  if (row === undefined) {
    throw new MissingStoredRowError();
  }
  return row;
};
