import clsx from 'clsx';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import {
  TOOLTIP_OPEN_DELAY_MS,
  TOOLTIP_SIDE_OFFSET,
  TooltipSide,
} from '@/shared/ui/Tooltip/Tooltip.constants';
import type { TooltipProps } from '@/shared/ui/Tooltip/Tooltip.typedefs';
import styles from '@/shared/ui/Tooltip/Tooltip.module.scss';

export function Tooltip({ content, side = TooltipSide.Top, className, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={TOOLTIP_OPEN_DELAY_MS}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={TOOLTIP_SIDE_OFFSET}
            className={clsx(styles.content, className)}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
