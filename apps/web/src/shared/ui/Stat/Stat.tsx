import { Badge } from '@/shared/ui/Badge/Badge';
import { Card } from '@/shared/ui/Card/Card';
import { CardElement } from '@/shared/ui/Card/Card.constants';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { STAT_LOADING_LINES, STAT_TREND_BADGE_TONES } from '@/shared/ui/Stat/Stat.constants';
import type { StatProps } from '@/shared/ui/Stat/Stat.typedefs';
import styles from '@/shared/ui/Stat/Stat.module.scss';

export function Stat({
  label,
  value,
  sub = null,
  trend = null,
  loading = false,
  ...rest
}: StatProps) {
  return (
    <Card {...rest} as={CardElement.Div} flush>
      <dl className={styles.body}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value}>
          {loading ? (
            <Skeleton label={label} lines={STAT_LOADING_LINES} />
          ) : (
            <>
              {value}
              {trend !== null && (
                <Badge tone={STAT_TREND_BADGE_TONES[trend.tone]} className={styles.trend}>
                  {trend.label}
                </Badge>
              )}
            </>
          )}
        </dd>
        {sub !== null && <dd className={styles.sub}>{sub}</dd>}
      </dl>
    </Card>
  );
}
