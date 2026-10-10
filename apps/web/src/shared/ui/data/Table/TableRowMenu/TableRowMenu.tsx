import { useState } from 'react';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import { IconButtonSize } from '@/shared/ui/actions/IconButton/IconButton.constants';
import { TABLE_ROW_MENU_MIN_WIDTH } from '@/shared/ui/data/Table/Table.constants';
import type { TableRowMenuProps } from '@/shared/ui/data/Table/TableRowMenu/TableRowMenu.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Menu } from '@/shared/ui/overlays/Menu/Menu';
import { MenuVariant } from '@/shared/ui/overlays/Menu/Menu.constants';
import { Popover } from '@/shared/ui/overlays/Popover/Popover';
import { PopoverAlign } from '@/shared/ui/overlays/Popover/Popover.constants';

export function TableRowMenu({
  label,
  menuLabel,
  items,
  onSelect,
  disabled,
  triggerClassName,
}: TableRowMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={PopoverAlign.End}
      bare
      ariaLabel={menuLabel}
      trigger={
        <IconButton
          icon={IconName.More}
          label={label}
          size={IconButtonSize.Sm}
          disabled={disabled}
          className={triggerClassName}
        />
      }
    >
      <Menu
        items={items}
        variant={MenuVariant.Action}
        minWidth={TABLE_ROW_MENU_MIN_WIDTH}
        ariaLabel={menuLabel}
        onSelect={(id) => {
          setOpen(false);
          onSelect(id);
        }}
      />
    </Popover>
  );
}
