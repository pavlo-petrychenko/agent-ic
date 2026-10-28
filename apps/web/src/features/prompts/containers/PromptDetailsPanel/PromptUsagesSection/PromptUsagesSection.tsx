import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PromptDetailsFailed } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsFailed';
import { PromptDetailsSection } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsSection';
import type { PromptUsagesSectionProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptUsagesSection/PromptUsagesSection.typedefs';
import { PromptUsages } from '@/features/prompts/view/PromptUsages';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PromptUsagesSection({
  usages,
  failed,
  onRetry,
  onOpenUsage,
}: PromptUsagesSectionProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const body = () => {
    if (failed) {
      return <PromptDetailsFailed message={t('details.usage.loadError')} onRetry={onRetry} />;
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
    return <PromptUsages usages={usages} onOpenUsage={onOpenUsage} />;
  };

  return (
    <PromptDetailsSection title={t('details.usage.title')} action={null}>
      {body()}
      {usages !== null && usages.length > 0 && (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('details.usage.note')}
        </Text>
      )}
    </PromptDetailsSection>
  );
}
