import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useUsageStatus } from '@/features/settings/communication/hooks/useUsageStatus';
import { USAGE_PATH } from '@/features/settings/constants/route.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { UsageLimitBannerProps } from '@/features/settings/containers/UsageLimitBanner/UsageLimitBanner.typedefs';
import { formatUsageDay, usageReachedWhen } from '@/features/settings/logic/helpers/usage.helpers';
import { useUsageNow } from '@/features/settings/logic/hooks/useUsageNow';
import { UsageWhenKind } from '@/features/settings/typedefs/usage.typedefs';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Banner, BannerTone } from '@/shared/ui/display/Banner';

export function UsageLimitBanner({ workspaceId }: UsageLimitBannerProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { locale } = useLocale();
  const router = useRouter();
  const now = useUsageNow();
  const { status, limitReached } = useUsageStatus();
  const workspace = useActiveWorkspace(workspaceId)?.name ?? '';

  if (!limitReached || status === null) {
    return null;
  }

  const when = usageReachedWhen(status.reachedAt, now, locale);
  const text = t(
    when.kind === UsageWhenKind.Unknown
      ? 'usage.limitBanner.textUndated'
      : 'usage.limitBanner.text',
    {
      workspace,
      when:
        when.kind === UsageWhenKind.Today
          ? t('usage.limitBanner.today')
          : t('usage.limitBanner.on', { date: when.date }),
      date: formatUsageDay(status.periodEnd, locale),
    },
  );

  return (
    <Banner tone={BannerTone.Err}>
      <div className="flex items-center justify-between gap-3">
        <span>{text}</span>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          href={router.buildLocation({ to: USAGE_PATH, params: { workspaceId } }).href}
        >
          {t('usage.limitBanner.action')}
        </Button>
      </div>
    </Banner>
  );
}
