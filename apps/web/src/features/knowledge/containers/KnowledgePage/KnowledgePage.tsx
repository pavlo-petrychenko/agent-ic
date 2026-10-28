import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { KnowledgeEmpty } from '@/features/knowledge/view/KnowledgeEmpty';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { SecondaryNav } from '@/shared/ui/navigation/SecondaryNav';
import { HeadingElement } from '@/shared/ui/typography/Heading';

export function KnowledgePage() {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <div className="flex h-full min-h-0">
      <SecondaryNav
        className="shrink-0"
        title={t('title')}
        ariaLabel={t('nav.label')}
        action={null}
        groups={[]}
        emptyMessage={t('empty.title')}
        headingAs={HeadingElement.H2}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto pb-8">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="px-7 pt-5">
          <KnowledgeEmpty />
        </div>
      </div>
    </div>
  );
}
