export enum LastUpdateKind {
  Today = 'today',
  Earlier = 'earlier',
}

export interface LastUpdateLabel {
  readonly kind: LastUpdateKind;
  readonly time: string;
  readonly date: string | null;
}
