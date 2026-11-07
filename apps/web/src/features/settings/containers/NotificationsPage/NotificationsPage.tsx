import { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrowserNotificationPermission } from '@/features/inbox';
import { useCreateTelegramNotificationLink } from '@/features/settings/communication/hooks/useCreateTelegramNotificationLink';
import { useNotificationSettings } from '@/features/settings/communication/hooks/useNotificationSettings';
import { useUnlinkTelegramNotification } from '@/features/settings/communication/hooks/useUnlinkTelegramNotification';
import { useUpdateNotificationChannel } from '@/features/settings/communication/hooks/useUpdateNotificationChannel';
import { TELEGRAM_LINK_POLL_INTERVAL_MS } from '@/features/settings/constants/notifications.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationsPageProps } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { Switch } from '@/shared/ui/inputs/Switch';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/containers/NotificationsPage/NotificationsPage.module.scss';

export function NotificationsPage({ workspaceId }: NotificationsPageProps) {
  const { t, i18n } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const [telegramLink, setTelegramLink] = useState<TelegramNotificationLink | null>(null);
  const [awaitingTelegramLink, setAwaitingTelegramLink] = useState(false);
  const { settings, loading } = useNotificationSettings(
    awaitingTelegramLink ? TELEGRAM_LINK_POLL_INTERVAL_MS : 0,
  );
  const updateChannel = useUpdateNotificationChannel();
  const { createLink, creating } = useCreateTelegramNotificationLink();
  const unlinkTelegram = useUnlinkTelegramNotification();
  const errorMessage = useErrorMessage();
  const browser = useBrowserNotificationPermission();
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const name = user?.name ?? '';

  const browserHint =
    browser.permission === 'granted'
      ? t('notifications.browser.enabled')
      : browser.permission === 'denied'
        ? t('notifications.browser.denied')
        : browser.permission === 'unsupported'
          ? t('notifications.browser.unsupported')
          : t('notifications.browser.hint');

  const changeChannel = (channel: NotificationChannel, enabled: boolean) => {
    void updateChannel(channel, enabled).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  const startTelegramLink = async () => {
    try {
      const link = await createLink();
      if (link !== null) {
        setTelegramLink(link);
        setAwaitingTelegramLink(true);
      }
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const closeTelegramLink = () => {
    setTelegramLink(null);
    setAwaitingTelegramLink(false);
  };

  const unlinkTelegramAccount = async () => {
    try {
      await unlinkTelegram();
      closeTelegramLink();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const copyTelegramCode = async () => {
    if (telegramLink === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(telegramLink.code);
      showToast({ message: t('notifications.link.copied'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

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
        <Card>
          <div className="flex flex-col gap-0.5">
            <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
              {t('notifications.card.title')}
            </Heading>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {isOperator
                ? t('notifications.card.personal', { name })
                : t('notifications.card.personalOperators', { name })}
            </Text>
          </div>
          <ul className={styles.preferences}>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.inPlatform')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('notifications.card.inPlatformHint')}
                </Text>
              </div>
              <Switch
                checked={settings.platformEnabled}
                onCheckedChange={(enabled) => changeChannel(NotificationChannel.Platform, enabled)}
                disabled={loading}
                aria-label={t('notifications.card.inPlatform')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.browser.title')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {browserHint}
                </Text>
              </div>
              {browser.permission === 'default' ? (
                <Button variant={ButtonVariant.Secondary} onClick={() => void browser.request()}>
                  {t('notifications.browser.enable')}
                </Button>
              ) : null}
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.email')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {settings.email ?? user?.email ?? ''}
                </Text>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(enabled) => changeChannel(NotificationChannel.Email, enabled)}
                disabled={loading}
                aria-label={t('notifications.card.email')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.telegram')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {settings.telegramLinked
                    ? settings.telegramUsername !== null && settings.telegramBotUsername !== null
                      ? t('notifications.card.telegramLinked', {
                          account: `@${settings.telegramUsername}`,
                          bot: `@${settings.telegramBotUsername}`,
                        })
                      : settings.telegramUsername === null
                        ? t('notifications.card.telegramLinkedShort')
                        : t('notifications.card.telegramLinkedAs', {
                            username: settings.telegramUsername,
                          })
                    : t('notifications.card.telegramNotLinked')}
                </Text>
              </div>
              <div className={styles.actions}>
                {telegramLink !== null && !settings.telegramLinked ? (
                  <Badge tone={BadgeTone.Warn} dot>
                    {t('notifications.card.waitingForCode')}
                  </Badge>
                ) : settings.telegramLinked ? (
                  <Switch
                    checked={settings.telegramEnabled}
                    onCheckedChange={(enabled) =>
                      changeChannel(NotificationChannel.Telegram, enabled)
                    }
                    disabled={loading}
                    aria-label={t('notifications.card.telegram')}
                  />
                ) : (
                  <Button
                    variant={ButtonVariant.Secondary}
                    loading={creating}
                    onClick={() => void startTelegramLink()}
                  >
                    {t('notifications.link.action')}
                  </Button>
                )}
              </div>
            </li>
          </ul>
          {settings.telegramLinked ? (
            <div className={styles.telegramFooter}>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={() => void unlinkTelegramAccount()}
              >
                {t('notifications.card.unlinkTelegram')}
              </Button>
              {settings.telegramLinkedAt === null ? null : (
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('notifications.card.linkedOn', {
                    date: formatTelegramLinkedAt(settings.telegramLinkedAt, i18n.language),
                  })}
                </Text>
              )}
            </div>
          ) : null}
          {telegramLink === null || settings.telegramLinked ? null : (
            <div className={styles.linkCard}>
              <Heading size={HeadingSize.H3} as={HeadingElement.H4}>
                {t('notifications.link.title')}
              </Heading>
              <ul className={styles.linkSteps}>
                <li>
                  {t('notifications.link.openBot', {
                    bot: `@${telegramLink.botUsername}`,
                  })}
                </li>
                <li>
                  {t('notifications.link.sendCode', {
                    minutes: telegramLinkMinutesLeft(telegramLink.expiresAt),
                  })}
                </li>
              </ul>
              <div className={styles.codeRow}>
                <code className={styles.code}>{formatTelegramLinkCode(telegramLink.code)}</code>
                <div className={styles.codeActions}>
                  <Button variant={ButtonVariant.Secondary} onClick={() => void copyTelegramCode()}>
                    {t('notifications.link.copy')}
                  </Button>
                  <Button
                    variant={ButtonVariant.Primary}
                    href={`https://t.me/${telegramLink.botUsername}?start=${telegramLink.code}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('notifications.link.open')}
                  </Button>
                </div>
              </div>
              <Text kind={TextKind.Caption} color={TextColor.Mute}>
                {t('notifications.link.hint')}
              </Text>
            </div>
          )}
          <div className={styles.footer}>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('notifications.card.footer')}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
