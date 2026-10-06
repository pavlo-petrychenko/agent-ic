import clsx from 'clsx';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { POPOVER_SIDE_OFFSET, PopoverAlign } from '@/shared/ui/overlays/Popover/Popover.constants';
import type { PopoverProps } from '@/shared/ui/overlays/Popover/Popover.typedefs';
import styles from '@/shared/ui/overlays/Popover/Popover.module.scss';

export function Popover({
  open,
  onOpenChange,
  trigger,
  align = PopoverAlign.Start,
  bare = false,
  ariaLabel = null,
  className,
  children,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={POPOVER_SIDE_OFFSET}
          aria-label={ariaLabel ?? undefined}
          className={clsx(styles.content, bare ? styles.bare : styles.surface, className)}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
