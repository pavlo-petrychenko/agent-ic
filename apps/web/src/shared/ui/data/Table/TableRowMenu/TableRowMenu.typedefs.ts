import type { MenuEntry } from '@/shared/ui/overlays/Menu/Menu.typedefs';

export interface TableRowMenuProps {
  label: string;
  menuLabel: string;
  items: readonly MenuEntry[];
  onSelect: (itemId: string) => void;
  disabled: boolean;
  triggerClassName?: string;
}
