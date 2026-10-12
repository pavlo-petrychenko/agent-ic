import type { PublishButtonProps } from '@/features/flow-builder/view/PublishButton/PublishButton.typedefs';
import { Button, ButtonSize } from '@/shared/ui/actions/Button';
import { Tooltip } from '@/shared/ui/overlays/Tooltip';

export function PublishButton({
  label,
  blockedReason,
  disabled = false,
  onClick,
}: PublishButtonProps) {
  const button = (
    <Button size={ButtonSize.Sm} disabled={disabled || blockedReason !== null} onClick={onClick}>
      {label}
    </Button>
  );
  if (blockedReason === null) {
    return button;
  }
  return (
    <Tooltip content={blockedReason}>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <span tabIndex={0} className="inline-flex">
        {button}
      </span>
    </Tooltip>
  );
}
