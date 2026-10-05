import { useState } from 'react';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton } from '@/shared/ui/IconButton/IconButton';
import { IconButtonSize } from '@/shared/ui/IconButton/IconButton.constants';
import { Menu } from '@/shared/ui/Menu/Menu';
import { MenuVariant } from '@/shared/ui/Menu/Menu.constants';
import { Popover } from '@/shared/ui/Popover/Popover';
import { PopoverAlign } from '@/shared/ui/Popover/Popover.constants';
import { TABLE_ROW_MENU_WIDTH } from '@/shared/ui/Table/Table.constants';
import type { TableRowMenuProps } from '@/shared/ui/Table/TableRowMenu/TableRowMenu.typedefs';

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
        width={TABLE_ROW_MENU_WIDTH}
        ariaLabel={menuLabel}
        onSelect={(id) => {
          setOpen(false);
          onSelect(id);
        }}
      />
    </Popover>
  );
}
