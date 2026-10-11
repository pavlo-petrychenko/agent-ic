import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { AgentsPageProps } from '@/features/agents/containers/AgentsPage/AgentsPage.typedefs';
import { useActiveWorkspace } from '@/features/workspace';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function AgentsPage({ workspaceId }: AgentsPageProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const workspace = useActiveWorkspace(workspaceId)?.name ?? '';

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle', { workspace })} />
      <div className="px-7">
        <Card>
          <EmptyState
            icon={IconName.Agent}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        </Card>
      </div>
    </div>
  );
}
