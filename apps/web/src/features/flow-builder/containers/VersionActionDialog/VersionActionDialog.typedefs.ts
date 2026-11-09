import type { VersionAction } from '@/features/flow-builder/constants/versions.constants';
import type { BuilderVersion } from '@/features/flow-builder/typedefs/versions.typedefs';

export interface VersionActionDialogProps {
  action: VersionAction;
  version: BuilderVersion;
  liveNumber: number | null;
  nextNumber: number | null;
  changeCount: number | null;
  onDone: (action: VersionAction, number: number | null) => void;
  onClose: () => void;
}
