import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { InviteLinkPanel } from '@/features/settings/containers/InviteLinkPanel';
import type { TeamPageProps } from '@/features/settings/containers/TeamPage/TeamPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { useActiveWorkspace } from '@/features/workspace';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { PageHeader } from '@/shared/ui/PageHeader';

export function TeamPage({ workspaceId }: TeamPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const memberCount = useActiveWorkspace(workspaceId)?.memberCount ?? 0;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.team')}
        subtitle={t('team.subtitle', { count: memberCount })}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <InviteLinkPanel workspaceId={workspaceId} />
      </div>
    </div>
  );
}
