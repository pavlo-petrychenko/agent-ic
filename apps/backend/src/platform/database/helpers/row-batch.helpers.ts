export const rowBatches = <TRow>(rows: readonly TRow[], size: number): TRow[][] => {
  const batches: TRow[][] = [];
  for (let start = 0; start < rows.length; start += size) {
    batches.push(rows.slice(start, start + size));
  }
  return batches;
};
