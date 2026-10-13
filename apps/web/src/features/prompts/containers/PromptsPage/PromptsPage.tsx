import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PromptsEmpty } from '@/features/prompts/view/PromptsEmpty';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function PromptsPage() {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
      <div className="px-7">
        <PromptsEmpty />
      </div>
    </div>
  );
}
