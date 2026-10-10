import type { SaveState } from '@/features/flow-builder/constants/saveState.constants';

export interface SaveStatusProps {
  saveState: SaveState;
  onRetry: () => void;
}
