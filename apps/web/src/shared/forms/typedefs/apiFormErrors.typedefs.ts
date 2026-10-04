export type FieldErrorMessages = Readonly<Record<string, string>>;

export interface ApiFormErrors {
  readonly fields: FieldErrorMessages;
}
