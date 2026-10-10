import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { CanvasShortcut } from '@/features/flow-builder/constants/shortcut.constants';
import type { CanvasToolbarProps } from '@/features/flow-builder/view/CanvasToolbar/CanvasToolbar.typedefs';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { KeyValue } from '@/shared/ui/display/KeyValue';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Popover, PopoverAlign } from '@/shared/ui/overlays/Popover';
import styles from '@/features/flow-builder/view/CanvasToolbar/CanvasToolbar.module.scss';

export function CanvasToolbar({ density, onDensityChange }: CanvasToolbarProps) {
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
    </div>
  );
}
