import { CONTEXT_MENU_MIN_WIDTH } from '@/shared/ui/overlays/ContextMenu/ContextMenu.constants';
import type { ContextMenuProps } from '@/shared/ui/overlays/ContextMenu/ContextMenu.typedefs';
import { Menu, MenuRole, MenuVariant } from '@/shared/ui/overlays/Menu';
import { Popover } from '@/shared/ui/overlays/Popover';

export function ContextMenu({
  anchor,
  items,
  ariaLabel,
  minWidth = CONTEXT_MENU_MIN_WIDTH,
  onSelect,
  onClose,
}: ContextMenuProps) {
  if (anchor === null) {
    return null;
  }

  return (
    <Popover
      open
      bare
      anchor={anchor}
      ariaLabel={ariaLabel}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Menu
        items={items}
        variant={MenuVariant.Action}
        role={MenuRole.Menu}
        minWidth={minWidth}
        ariaLabel={ariaLabel}
        onSelect={(id) => {
          onClose();
          onSelect(id);
        }}
      />
    </Popover>
  );
}
