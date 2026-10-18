import { useTranslation } from 'react-i18next';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptDetailsPanelProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsPanel.typedefs';
import { pinnedNumbers } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { PromptUsages } from '@/features/prompts/view/PromptUsages';
import { PromptVersions } from '@/features/prompts/view/PromptVersions';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Panel, PanelSide } from '@/shared/ui/layout/Panel';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsPanel.module.scss';

export function PromptDetailsPanel({
  promptId,
  activeVersionId,
  usages,
  usagesFailed,
  onRetryUsages,
}: PromptDetailsPanelProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const { versions, failed, retry } = usePromptVersions(promptId);

  const failedNote = (message: string, onRetry: () => void) => (
    <div className={styles.failed}>
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {message}
      </Text>
      <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary} onClick={onRetry}>
        {t('retry')}
      </Button>
    </div>
  );

  const usageBody = () => {
    if (usagesFailed) {
      return failedNote(t('details.usage.loadError'), onRetryUsages);
    }
    if (usages === null) {
      return null;
    }
    if (usages.length === 0) {
      return (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('details.usage.empty')}
        </Text>
      );
    }
    return <PromptUsages usages={usages} />;
  };

  const versionsBody = () => {
    if (failed) {
      return failedNote(t('versions.loadError'), () => {
        void retry();
      });
    }
    if (versions === null) {
      return null;
    }
    if (versions.length === 0) {
      return (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('versions.empty')}
        </Text>
      );
    }
    return (
      <PromptVersions
        activeId={activeVersionId}
        pinnedNumbers={usages === null ? [] : pinnedNumbers(usages)}
        versions={versions.map((version) => ({
          id: version.id,
          number: version.number,
          note: version.note,
          date: formatPromptVersionDate(version.savedAt, locale),
        }))}
      />
    );
  };

  return (
    <Panel ariaLabel={t('details.panelLabel')} className={styles.panel} side={PanelSide.Left}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('details.usage.title')}</h3>
          {usageBody()}
          {usages !== null && usages.length > 0 && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('details.usage.note')}
            </Text>
          )}
        </section>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('versions.title')}</h3>
          {versionsBody()}
        </section>
      </div>
    </Panel>
  );
}
