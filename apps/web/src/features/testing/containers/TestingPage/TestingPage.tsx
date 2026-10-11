import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { Card } from '@/shared/ui/display/Card';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function TestingPage() {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
      <div className="px-7">
        <Card>
          <EmptyState
            icon={IconName.Flask}
            title={t('simulator.title')}
            description={t('simulator.description')}
          />
        </Card>
      </div>
    </div>
  );
}
