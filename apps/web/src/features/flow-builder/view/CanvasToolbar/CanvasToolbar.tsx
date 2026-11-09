import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { GUIDES_TOOLBAR_ICON } from '@/features/flow-builder/constants/guide.constants';
import { CanvasShortcut } from '@/features/flow-builder/constants/shortcut.constants';
import type { CanvasToolbarProps } from '@/features/flow-builder/view/CanvasToolbar/CanvasToolbar.typedefs';
import { TourAnchor, tourAnchor } from '@/features/onboarding';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { KeyValue } from '@/shared/ui/display/KeyValue';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Popover, PopoverAlign } from '@/shared/ui/overlays/Popover';
import styles from '@/features/flow-builder/view/CanvasToolbar/CanvasToolbar.module.scss';

export function CanvasToolbar({
  density,
  onDensityChange,
  settingsOpen,
  onSettingsOpen,
  onGuides,
  compact,
}: CanvasToolbarProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        align={PopoverAlign.End}
        ariaLabel={t('shortcuts.title')}
        trigger={
          <IconButton
            icon={IconName.Keyboard}
            label={t('shortcuts.title')}
            size={IconButtonSize.Sm}
          />
        }
      >
        <KeyValue
          items={Object.values(CanvasShortcut).map((shortcut) => ({
            label: t(`shortcuts.action.${shortcut}`),
            value: t(`shortcuts.keys.${shortcut}`),
            mono: true,
          }))}
        />
      </Popover>
      <SegmentedControl
        ariaLabel={t('density.label')}
        size={SegmentedControlSize.Sm}
        value={density}
        onValueChange={onDensityChange}
        options={Object.values(Density).map((value) => ({ value, label: t(`density.${value}`) }))}
      />
      {compact ? (
        <IconButton
          {...tourAnchor(TourAnchor.BuilderGuides)}
          icon={GUIDES_TOOLBAR_ICON}
          label={t('guide.open')}
          size={IconButtonSize.Sm}
          variant={IconButtonVariant.Secondary}
          onClick={onGuides}
        />
      ) : (
        <Button
          {...tourAnchor(TourAnchor.BuilderGuides)}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          icon={GUIDES_TOOLBAR_ICON}
          onClick={onGuides}
        >
          {t('guide.open')}
        </Button>
      )}
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        icon={IconName.Gear}
        aria-pressed={settingsOpen}
        onClick={onSettingsOpen}
      >
        {t('settings.open')}
      </Button>
    </div>
  );
}
