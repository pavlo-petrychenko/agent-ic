import clsx from 'clsx';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useMemo } from 'react';
import { POPOVER_SIDE_OFFSET, PopoverAlign } from '@/shared/ui/overlays/Popover/Popover.constants';
import type { PopoverPoint, PopoverProps } from '@/shared/ui/overlays/Popover/Popover.typedefs';
import styles from '@/shared/ui/overlays/Popover/Popover.module.scss';

const pointRect = ({ x, y }: PopoverPoint): DOMRect => ({
  x,
  y,
  width: 0,
  height: 0,
  top: y,
  right: x,
  bottom: y,
  left: x,
  toJSON: () => ({ x, y }),
});

export function Popover({
  open,
  onOpenChange,
  trigger = null,
  anchor = null,
  align = PopoverAlign.Start,
  bare = false,
  ariaLabel = null,
  onEscapeKeyDown = null,
  className,
  children,
}: PopoverProps) {
  const virtualRef = useMemo(
    () => ({
      current: anchor === null ? null : { getBoundingClientRect: () => pointRect(anchor) },
    }),
    [anchor],
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger !== null && <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>}
      {anchor !== null && <PopoverPrimitive.Anchor virtualRef={virtualRef} />}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={POPOVER_SIDE_OFFSET}
          aria-label={ariaLabel ?? undefined}
          onEscapeKeyDown={onEscapeKeyDown ?? undefined}
          className={clsx(styles.content, bare ? styles.bare : styles.surface, className)}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
