import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import type { StepPaletteProps } from '@/features/flow-builder/view/StepPalette/StepPalette.typedefs';
import { PaletteItem } from '@/shared/ui/flow/PaletteItem';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Panel, PanelSide } from '@/shared/ui/layout/Panel';
import { NavSectionLabel } from '@/shared/ui/navigation/NavSectionLabel';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/StepPalette/StepPalette.module.scss';

export function StepPalette({ sections, query, onQueryChange, onAdd }: StepPaletteProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <Panel
      ariaLabel={t('palette.title')}
      title={t('palette.title')}
      side={PanelSide.Right}
      className={styles.root}
      footer={
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('palette.knowledgeNote')}
        </Text>
      }
    >
      <SearchInput
        value={query}
        label={t('palette.search')}
        placeholder={t('palette.search')}
        clearLabel={t('palette.clearSearch')}
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange('')}
      />
      {sections.length === 0 && (
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {t('palette.nothingFound')}
        </Text>
      )}
      {sections.map((section) => (
        <div key={section.group} className={styles.section}>
          <NavSectionLabel label={t(`palette.group.${section.group}`)} />
          {section.types.map((type) => (
            <PaletteItem
              key={type}
              label={t(`step.${type}`)}
              kind={NODE_PRESENTATION[type].kind}
              icon={NODE_PRESENTATION[type].icon}
              dragData={type}
              onSelect={() => onAdd(type)}
            />
          ))}
        </div>
      ))}
    </Panel>
  );
}
