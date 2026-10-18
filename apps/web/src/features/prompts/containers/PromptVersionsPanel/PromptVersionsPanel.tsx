import { useTranslation } from 'react-i18next';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptVersionsPanelProps } from '@/features/prompts/containers/PromptVersionsPanel/PromptVersionsPanel.typedefs';
import { formatPromptVersionDate } from '@/features/prompts/logic/helpers/promptVersion.helpers';
import { PromptVersions } from '@/features/prompts/view/PromptVersions';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Panel, PanelSide } from '@/shared/ui/layout/Panel';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/containers/PromptVersionsPanel/PromptVersionsPanel.module.scss';

export function PromptVersionsPanel({ promptId, activeVersionId }: PromptVersionsPanelProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { locale } = useLocale();
  const { versions, failed, retry } = usePromptVersions(promptId);

  const body = () => {
    if (failed) {
      return (
        <div className={styles.failed}>
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('versions.loadError')}
          </Text>
          <Button
            size={ButtonSize.Sm}
            variant={ButtonVariant.Secondary}
            onClick={() => void retry()}
          >
            {t('retry')}
          </Button>
        </div>
      );
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
    <Panel
      ariaLabel={t('versions.panelLabel')}
      className={styles.panel}
      side={PanelSide.Left}
      title={t('versions.title')}
    >
      <div className={styles.content}>{body()}</div>
    </Panel>
  );
}
