import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PromptDetailsFailed } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsFailed';
import { PromptDetailsSection } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsSection';
import type { PromptVersionsSectionProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptVersionsSection/PromptVersionsSection.typedefs';
import { PromptVersions } from '@/features/prompts/view/PromptVersions';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptVersionsSection({
  versions,
  pinnedNumbers,
  activeId,
  failed,
  onRetry,
}: PromptVersionsSectionProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const body = () => {
    if (failed) {
      return <PromptDetailsFailed message={t('versions.loadError')} onRetry={onRetry} />;
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
    return <PromptVersions activeId={activeId} pinnedNumbers={pinnedNumbers} versions={versions} />;
  };

  return (
    <PromptDetailsSection title={t('versions.title')} action={null}>
      {body()}
    </PromptDetailsSection>
  );
}
