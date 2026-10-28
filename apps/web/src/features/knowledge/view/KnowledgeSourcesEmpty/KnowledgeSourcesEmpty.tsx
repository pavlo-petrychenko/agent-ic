import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function KnowledgeSourcesEmpty() {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <EmptyState
          icon={IconName.Kb}
          title={t('detail.sourcesTitle')}
          description={t('detail.sourcesDescription')}
        />
      </Card>
      <Callout tone={CalloutTone.Neutral}>{t('detail.agentsNote')}</Callout>
    </div>
  );
}
