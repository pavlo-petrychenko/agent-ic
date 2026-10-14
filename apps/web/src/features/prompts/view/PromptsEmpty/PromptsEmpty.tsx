import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function PromptsEmpty() {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <Card>
      <EmptyState
        icon={IconName.Note}
        title={t('empty.title')}
        description={t('empty.description')}
      />
    </Card>
  );
}
