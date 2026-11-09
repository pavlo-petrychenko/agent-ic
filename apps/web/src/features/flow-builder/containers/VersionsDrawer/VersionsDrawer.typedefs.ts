import type { VersionAction } from '@/features/flow-builder/constants/versions.constants';

export interface VersionsDrawerProps {
  agentId: string;
  open: boolean;
  liveNumber: number | null;
  nextNumber: number | null;
  changeCount: number | null;
  canRollback: boolean;
  canRestore: boolean;
  onCompare: () => void;
  onChanged: (action: VersionAction, number: number | null) => void;
  onClose: () => void;
}
