import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { WAIT_FOR_OPTIONS } from '@/features/flow-builder/constants/inspector.constants';
import type { ParallelInspectorProps } from '@/features/flow-builder/view/ParallelInspector/ParallelInspector.typedefs';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { RowList } from '@/shared/ui/display/RowList';
import { Radio, RadioOrientation } from '@/shared/ui/inputs/Radio';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function ParallelInspector({
  branches,
  waitFor,
  onWaitForChange,
  onBackgroundChange,
}: ParallelInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const radioName = useId();
  const options = WAIT_FOR_OPTIONS.map((value) => ({
    value,
    label: t(`inspector.parallel.waitFor.${value}`),
  }));

  return (
    <>
      <InspectorSection title={t('inspector.parallel.branches')}>
        {branches.length === 0 ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('inspector.parallel.noBranches')}
          </Text>
        ) : (
          <RowList
            aria-label={t('inspector.parallel.branches')}
            mono={false}
            rows={branches.map((branch) => ({
              id: branch.nodeId,
              name: branch.label,
              leading: <NodeTile kind={branch.kind} icon={branch.icon} size={TileSize.Sm} />,
              meta: (
                <Switch
                  label={t('inspector.parallel.inBackground')}
                  aria-label={t('inspector.parallel.inBackgroundFor', { name: branch.label })}
                  checked={branch.background}
                  disabled={branch.lastWaited}
                  onCheckedChange={(background) => onBackgroundChange(branch.edgeId, background)}
                />
              ),
            }))}
          />
        )}
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.parallel.backgroundNote')}
        </Text>
      </InspectorSection>
      <InspectorSection title={t('inspector.parallel.continueWhen')}>
        <Radio
          name={radioName}
          ariaLabel={t('inspector.parallel.continueWhen')}
          orientation={RadioOrientation.Vertical}
          value={waitFor}
          options={options}
          onValueChange={(value) => {
            const next = WAIT_FOR_OPTIONS.find((option) => option === value);
            if (next !== undefined) {
              onWaitForChange(next);
            }
          }}
        />
      </InspectorSection>
    </>
  );
}
