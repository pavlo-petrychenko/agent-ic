import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { USAGE_ROWS, UsageFormat } from '@/features/settings/constants/usage.constants';
import type { UsagePageProps } from '@/features/settings/containers/UsagePage/UsagePage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import {
  formatUsageDay,
  formatUsageNumber,
  usagePercent,
  usageTone,
} from '@/features/settings/logic/helpers/usage.helpers';
import { useUsagePeriod } from '@/features/settings/logic/hooks/useUsagePeriod';
import { EarlyAccessCard } from '@/features/settings/view/EarlyAccessCard';
import { UsageCard } from '@/features/settings/view/UsageCard';
import type { UsageRow } from '@/features/settings/view/UsageCard';
import { useActiveWorkspace } from '@/features/workspace';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function UsagePage({ workspaceId }: UsagePageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { locale } = useLocale();
  const workspaceName = useActiveWorkspace(workspaceId)?.name ?? '';

  const rows: readonly UsageRow[] = USAGE_ROWS.map((metric) => {
    const percent = usagePercent(metric.used, metric.limit);
    const used = formatUsageNumber(metric.used, locale);
    const limit = formatUsageNumber(metric.limit, locale);
    const count = `${used} / ${limit}`;
    return {
      id: metric.id,
      label: t(metric.labelKey),
      note: t(metric.noteKey),
      used: metric.used,
      limit: metric.limit,
      tone: usageTone(percent),
      value:
        metric.format === UsageFormat.Percent
          ? t('usage.value.percent', { percent })
          : metric.format === UsageFormat.Chunks
            ? t('usage.value.chunks', { used, limit })
            : count,
    };
  });

  const { start, end } = useUsagePeriod();
  const periodLabel = `${formatUsageDay(start, locale)} - ${formatUsageDay(end, locale)}`;

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
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-4 px-7">
        <UsageCard periodLabel={periodLabel} rows={rows} />
        <EarlyAccessCard onAsk={() => undefined} />
      </div>
    </div>
  );
}
