export interface ChangePasswordCardProps {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly onCurrentPasswordChange: (value: string) => void;
  readonly onNewPasswordChange: (value: string) => void;
  readonly onSave: () => void;
}
