export interface DueTick {
  readonly tick: Date;
  readonly lagSeconds: number;
  readonly missed: boolean;
}

export interface DueTickInput {
  readonly now: Date;
  readonly notBefore: Date;
}
