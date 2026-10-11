export interface ProfileIdentityFieldsProps {
  readonly name: string;
  readonly email: string;
  readonly emailDraft: string;
  readonly emailEditing: boolean;
  readonly emailSending: boolean;
  readonly onNameChange: (name: string) => void;
  readonly onEmailDraftChange: (email: string) => void;
  readonly onEmailEdit: () => void;
  readonly onEmailCancel: () => void;
  readonly onEmailSubmit: () => void;
}
