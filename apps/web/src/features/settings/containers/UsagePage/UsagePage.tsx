import { useTranslation } from 'react-i18next';
import { useWorkspaceUsage } from '@/features/settings/communication/hooks/useWorkspaceUsage';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { USAGE_ROW_DEFINITIONS, UsageFormat } from '@/features/settings/constants/usage.constants';
import type { UsagePageProps } from '@/features/settings/containers/UsagePage/UsagePage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import {
  formatUsageNumber,
  usagePercent,
  usagePeriodLabel,
  usageTone,
} from '@/features/settings/logic/helpers/usage.helpers';
import type { WorkspaceUsageView } from '@/features/settings/typedefs/usage.typedefs';
import { EarlyAccessCard } from '@/features/settings/view/EarlyAccessCard';
import { UsageCard } from '@/features/settings/view/UsageCard';
import type { UsageRow } from '@/features/settings/view/UsageCard';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function UsagePage({ workspaceId }: UsagePageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { locale } = useLocale();
  const workspaceName = useActiveWorkspace(workspaceId)?.name ?? '';
  const { usage, loading, failed, retry } = useWorkspaceUsage();

  const toRows = (current: WorkspaceUsageView): readonly UsageRow[] =>
    USAGE_ROW_DEFINITIONS.map((definition) => {
      const { used, limit } = current.meters[definition.key];
      const percent = usagePercent(used, limit);
      const usedText = formatUsageNumber(used, locale);
      const limitText = formatUsageNumber(limit, locale);
      const count = `${usedText} / ${limitText}`;
      return {
        id: definition.key,
        label: t(definition.labelKey),
        note: t(definition.noteKey),
        used,
        limit,
        tone: usageTone(percent),
        value:
          definition.format === UsageFormat.Percent
            ? t('usage.value.percent', { percent })
            : definition.format === UsageFormat.Chunks
              ? t('usage.value.chunks', { used: usedText, limit: limitText })
              : count,
      };
    });

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.usage')}
        subtitle={t('usage.subtitle', { workspace: workspaceName })}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="px-7">
        {failed && (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button
                variant={ButtonVariant.Ghost}
                size={ButtonSize.Sm}
                onClick={() => void retry()}
              >
                {t('usage.retry')}
              </Button>
            }
          >
            {t('usage.failed')}
          </Callout>
        )}
        {usage === null && !failed && loading && <Skeleton label={t('usage.loading')} />}
        {usage !== null && (
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-4">
            <UsageCard
              periodLabel={usagePeriodLabel(usage.periodStart, usage.periodEnd, locale)}
              rows={toRows(usage)}
            />
            <EarlyAccessCard />
          </div>
        )}
      </div>
    </div>
  );
}
