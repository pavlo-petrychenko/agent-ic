export interface PromptPickerDialogProps {
  readonly onPick: (promptId: string) => void;
  readonly onClose: () => void;
}
