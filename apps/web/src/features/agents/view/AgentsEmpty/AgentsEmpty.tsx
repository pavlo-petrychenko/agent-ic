import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { AgentsEmptyProps } from '@/features/agents/view/AgentsEmpty/AgentsEmpty.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function AgentsEmpty({ creating, onCreate }: AgentsEmptyProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);

  return (
    <Card>
      <EmptyState
        icon={IconName.Agent}
        title={t('empty.title')}
        description={t('empty.description')}
        actions={
          <Button icon={IconName.Plus} loading={creating} onClick={onCreate}>
            {t('actions.blankFlow')}
          </Button>
        }
      />
    </Card>
  );
}
