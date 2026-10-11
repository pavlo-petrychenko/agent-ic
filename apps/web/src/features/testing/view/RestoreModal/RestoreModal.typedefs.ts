export interface RestoreModalProps {
  number: number;
  subtitle: string;
  liveNumber: number | null;
  draftNumber: number;
  changeCount: number | null;
  restoring: boolean;
  error: string | null;
  onRestore: () => void;
  onClose: () => void;
}
