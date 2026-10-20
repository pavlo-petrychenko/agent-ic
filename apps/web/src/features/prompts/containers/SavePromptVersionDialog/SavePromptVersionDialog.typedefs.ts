export interface SavePromptVersionDialogProps {
  readonly promptId: string;
  readonly promptName: string;
  readonly text: string;
  readonly versionNumber: number;
  readonly onSaved: () => void;
  readonly onClose: () => void;
}
