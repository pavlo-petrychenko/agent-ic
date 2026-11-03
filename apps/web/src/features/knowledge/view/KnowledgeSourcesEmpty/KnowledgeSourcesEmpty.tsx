import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { KnowledgeSourcesEmptyProps } from '@/features/knowledge/view/KnowledgeSourcesEmpty/KnowledgeSourcesEmpty.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function KnowledgeSourcesEmpty({ onAddSource }: KnowledgeSourcesEmptyProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <Card>
      <EmptyState
        icon={IconName.Kb}
        title={t('detail.sourcesTitle')}
        description={t('detail.sourcesDescription')}
        actions={
          onAddSource === null ? null : (
            <Button icon={IconName.Plus} onClick={onAddSource}>
              {t('add.action')}
            </Button>
          )
        }
      />
    </Card>
  );
}
