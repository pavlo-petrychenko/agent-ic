import type { VersionAction } from '@/features/flow-builder/constants/versions.constants';

export interface VersionActionModalProps {
  action: VersionAction;
  number: number;
  liveNumber: number | null;
  nextNumber: number | null;
  changeCount: number | null;
  note: string;
  blockedReason: string | null;
  busy: boolean;
  error: string | null;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}
