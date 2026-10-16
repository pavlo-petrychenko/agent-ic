export interface DiscardPromptDraftModalProps {
  readonly versionNumber: number;
  readonly baseVersionNumber: number | null;
  readonly onDiscard: () => void;
  readonly onClose: () => void;
}
