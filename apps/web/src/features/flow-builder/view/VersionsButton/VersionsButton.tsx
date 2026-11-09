import type { VersionsButtonProps } from '@/features/flow-builder/view/VersionsButton/VersionsButton.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Tooltip } from '@/shared/ui/overlays/Tooltip';

export function VersionsButton({ label, compact, onClick }: VersionsButtonProps) {
  if (compact) {
    return (
      <Tooltip content={label}>
        <IconButton
          icon={IconName.Hour}
          label={label}
          size={IconButtonSize.Sm}
          variant={IconButtonVariant.Secondary}
          onClick={onClick}
        />
      </Tooltip>
    );
  }
  return (
    <Button
      variant={ButtonVariant.Secondary}
      size={ButtonSize.Sm}
      icon={IconName.Hour}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
