import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function FlowBuilderPage() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
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
