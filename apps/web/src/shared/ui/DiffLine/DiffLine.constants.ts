export enum DiffSign {
  Added = 'added',
  Changed = 'changed',
  Removed = 'removed',
}

export const DIFF_SIGN_GLYPH: Readonly<Record<DiffSign, string>> = {
  [DiffSign.Added]: '+',
  [DiffSign.Changed]: '~',
  [DiffSign.Removed]: '−',
};
