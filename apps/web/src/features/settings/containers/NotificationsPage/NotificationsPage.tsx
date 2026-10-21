import { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TELEGRAM_BOT_HANDLE,
  TELEGRAM_BOT_URL,
  TELEGRAM_CODE_TTL_MINUTES,
  TELEGRAM_LINK_CODE,
  TELEGRAM_LINKED_ACCOUNT,
  TELEGRAM_LINKED_AT,
} from '@/features/settings/constants/notifications.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationsPageProps } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { copyText } from '@/features/settings/logic/helpers/clipboard.helpers';
import { formatDate } from '@/features/settings/logic/helpers/format.helpers';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
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
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { locale } = useLocale();
  const { showToast } = useToast();
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);

  const [inPlatform, setInPlatform] = useState(true);
  const [email, setEmail] = useState(true);
  const [telegramUnlinked, setTelegramUnlinked] = useState(false);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const telegramLinked = !isOperator && !telegramUnlinked;
  const name = user?.name ?? '';
  const linkedOn = formatDate(TELEGRAM_LINKED_AT, locale, { month: 'short', day: 'numeric' });

  const copyCode = async () => {
    await copyText(TELEGRAM_LINK_CODE);
    showToast({ message: t('notifications.link.copied'), tone: ToastTone.Ok });
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
                checked={inPlatform}
                onCheckedChange={setInPlatform}
                aria-label={t('notifications.card.inPlatform')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.email')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {user?.email ?? ''}
                </Text>
              </div>
              <Switch
                checked={email}
                onCheckedChange={setEmail}
                aria-label={t('notifications.card.email')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.telegram')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {telegramLinked
                    ? t('notifications.card.telegramLinked', {
                        account: TELEGRAM_LINKED_ACCOUNT,
                        bot: TELEGRAM_BOT_HANDLE,
                      })
                    : t('notifications.card.telegramNotLinked')}
                </Text>
              </div>
              {telegramLinked ? (
                <Switch
                  checked
                  onCheckedChange={() => setTelegramUnlinked(true)}
                  aria-label={t('notifications.card.telegram')}
                />
              ) : (
                <Badge tone={BadgeTone.Warn} dot>
                  {t('notifications.card.waitingForCode')}
                </Badge>
              )}
            </li>
          </ul>
          {telegramLinked ? (
            <div className={styles.telegramMeta}>
              <Button variant={ButtonVariant.Secondary} onClick={() => setTelegramUnlinked(true)}>
                {t('notifications.card.unlinkTelegram')}
              </Button>
              <Text kind={TextKind.Caption} color={TextColor.Mute}>
                {t('notifications.card.linkedOn', { date: linkedOn })}
              </Text>
            </div>
          ) : (
            <div className={styles.linkCard}>
              <Text>{t('notifications.link.title')}</Text>
              <ul className={styles.steps}>
                <li>{t('notifications.link.openBot', { bot: TELEGRAM_BOT_HANDLE })}</li>
                <li>{t('notifications.link.sendCode', { minutes: TELEGRAM_CODE_TTL_MINUTES })}</li>
              </ul>
              <div className={styles.codeRow}>
                <span className={styles.code}>{TELEGRAM_LINK_CODE}</span>
                <Button variant={ButtonVariant.Secondary} onClick={() => void copyCode()}>
                  {t('notifications.link.copy')}
                </Button>
                <Button href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
                  {t('notifications.link.open')}
                </Button>
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
