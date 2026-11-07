import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationsPageProps } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { useNotificationsPage } from '@/features/settings/containers/NotificationsPage/useNotificationsPage';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { NotificationPreferences } from '@/features/settings/view/NotificationPreferences';
import { NotificationsCard } from '@/features/settings/view/NotificationsCard';
import { TelegramLinkCard } from '@/features/settings/view/TelegramLinkCard';
import { TelegramLinkedFooter } from '@/features/settings/view/TelegramLinkedFooter';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function NotificationsPage({ workspaceId }: NotificationsPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const page = useNotificationsPage(workspaceId);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.notifications')}
        subtitle={t('notifications.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <NotificationsCard
          title={page.cardTitle}
          description={page.cardDescription}
          footer={page.cardFooter}
        >
          <NotificationPreferences {...page.preferences} />
          {page.telegramLinked ? (
            <TelegramLinkedFooter
              linkedOn={page.telegramLinkedOn}
              onUnlink={page.onUnlinkTelegram}
            />
          ) : null}
          {page.telegramLink === null ? null : (
            <TelegramLinkCard {...page.telegramLink} onCopy={page.onCopyTelegramCode} />
          )}
        </NotificationsCard>
      </div>
    </div>
  );
}
