import type { MenuItem } from '@/shared/ui/overlays/Menu';

export interface BlankFlowHintProps {
  items: readonly MenuItem[];
  onAdd: (itemId: string) => void;
}
