export interface ProfileIdentityFieldsProps {
  readonly name: string;
  readonly email: string;
  readonly onNameChange: (name: string) => void;
  readonly onEmailChange: () => void;
}
