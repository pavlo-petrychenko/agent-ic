export interface DeletePromptFolderModalProps {
  readonly folderName: string;
  readonly blocked: boolean;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
