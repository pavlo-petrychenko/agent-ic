import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { UsageCardProps } from '@/features/settings/view/UsageCard/UsageCard.typedefs';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card } from '@/shared/ui/display/Card';
import { Progress } from '@/shared/ui/display/Progress';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function UsageCard({ periodLabel, rows }: UsageCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card flush>
      <div className="flex items-baseline justify-between gap-2 px-4 pb-3 pt-4">
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {t('usage.thisMonth')}
        </Heading>
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {periodLabel}
        </Text>
      </div>
      <ul className="flex flex-col gap-4 px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Text as={TextElement.Span}>{row.label}</Text>
              <Text as={TextElement.Span}>{row.value}</Text>
            </div>
            <Progress value={row.used} max={row.limit} tone={row.tone} label={row.label} />
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {row.note}
            </Text>
          </li>
        ))}
      </ul>
      <div className="px-4 pb-4 pt-4">
        <Callout tone={CalloutTone.Warn} icon={IconName.Alert}>
          {t('usage.notice')}
        </Callout>
      </div>
    </Card>
  );
}
