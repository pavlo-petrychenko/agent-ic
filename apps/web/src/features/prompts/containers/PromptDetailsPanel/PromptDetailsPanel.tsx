import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptDetailsPanelProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsPanel.typedefs';
import { PromptUsagesSection } from '@/features/prompts/containers/PromptDetailsPanel/PromptUsagesSection';
import { PromptVersionsSection } from '@/features/prompts/containers/PromptDetailsPanel/PromptVersionsSection';
import { usePromptDetailsPanel } from '@/features/prompts/containers/PromptDetailsPanel/usePromptDetailsPanel';
import { Panel, PanelSide } from '@/shared/ui/layout/Panel';
import styles from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsPanel.module.scss';

export function PromptDetailsPanel({
  promptId,
  activeVersionId,
  onSelect,
  onCompare,
  usages,
  usagesFailed,
  onRetryUsages,
}: PromptDetailsPanelProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { versions, pinnedNumbers, versionsFailed, retryVersions, compareVersions } =
    usePromptDetailsPanel(promptId, usages, onCompare);

  return (
    <Panel ariaLabel={t('details.panelLabel')} className={styles.panel} side={PanelSide.Left}>
      <div className={styles.content}>
        <PromptUsagesSection usages={usages} failed={usagesFailed} onRetry={onRetryUsages} />
        <PromptVersionsSection
          versions={versions}
          pinnedNumbers={pinnedNumbers}
          activeId={activeVersionId}
          onSelect={onSelect}
          onCompare={compareVersions}
          failed={versionsFailed}
          onRetry={retryVersions}
        />
      </div>
    </Panel>
  );
}
