import clsx from 'clsx';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import {
  TOOLTIP_MULTILINE_MAX_WIDTH,
  TOOLTIP_OPEN_DELAY_MS,
  TOOLTIP_SIDE_OFFSET,
  TooltipSide,
} from '@/shared/ui/overlays/Tooltip/Tooltip.constants';
import type { TooltipProps } from '@/shared/ui/overlays/Tooltip/Tooltip.typedefs';
import { useTooltipHideDelay } from '@/shared/ui/overlays/Tooltip/useTooltipHideDelay';
import styles from '@/shared/ui/overlays/Tooltip/Tooltip.module.scss';

export function Tooltip({
  content,
  side = TooltipSide.Top,
  arrow = true,
  multiline = false,
  className,
  children,
}: TooltipProps) {
  const { open, handleOpenChange, handleEscapeKeyDown } = useTooltipHideDelay();

  return (
    <TooltipPrimitive.Provider delayDuration={TOOLTIP_OPEN_DELAY_MS}>
      <TooltipPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={TOOLTIP_SIDE_OFFSET}
            className={clsx(styles.content, multiline && styles.multiline, className)}
            style={multiline ? { maxWidth: TOOLTIP_MULTILINE_MAX_WIDTH } : undefined}
            onEscapeKeyDown={handleEscapeKeyDown}
          >
            {content}
            {arrow ? (
              <TooltipPrimitive.Arrow asChild>
                <span data-arrow="" className={styles.arrow} />
              </TooltipPrimitive.Arrow>
            ) : null}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
