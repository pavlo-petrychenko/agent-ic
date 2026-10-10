import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { BlankFlowHintProps } from '@/features/flow-builder/view/BlankFlowHint/BlankFlowHint.typedefs';
import { AddTile, AddTileLayout } from '@/shared/ui/actions/AddTile';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Menu, MenuVariant } from '@/shared/ui/overlays/Menu';
import { Popover } from '@/shared/ui/overlays/Popover';
import styles from '@/features/flow-builder/view/BlankFlowHint/BlankFlowHint.module.scss';

export function BlankFlowHint({ items, onAdd }: BlankFlowHintProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        bare
        trigger={
          <AddTile
            layout={AddTileLayout.Tile}
            label={t('blank.addStep')}
            sub={t('blank.addStepHint')}
            className={styles.tile}
          />
        }
      >
        <Menu
          ariaLabel={t('canvas.addStep')}
          variant={MenuVariant.Action}
          items={items}
          onSelect={(itemId) => {
            setOpen(false);
            onAdd(itemId);
          }}
        />
      </Popover>
      <Card>
        <EmptyState
          icon={IconName.Agent}
          title={t('blank.title')}
          description={t('blank.description')}
        />
      </Card>
    </div>
  );
}
