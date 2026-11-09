export interface NotificationEmailFieldProps {
  readonly value: string;
  readonly verified: boolean;
  readonly usingAccountEmail: boolean;
  readonly accountEmail: string;
  readonly saving: boolean;
  readonly resending: boolean;
  readonly onChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onResend: () => void;
}
