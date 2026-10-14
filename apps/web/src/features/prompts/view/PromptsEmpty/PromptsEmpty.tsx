import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptsEmptyProps } from '@/features/prompts/view/PromptsEmpty/PromptsEmpty.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function PromptsEmpty({ onCreate }: PromptsEmptyProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <Card>
      <EmptyState
        icon={IconName.Note}
        title={t('empty.title')}
        description={t('empty.description')}
        actions={
          <Button icon={IconName.Plus} onClick={onCreate}>
            {t('actions.newPrompt')}
          </Button>
        }
      />
    </Card>
  );
}
