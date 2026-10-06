import { Badge } from '@/shared/ui/display/Badge/Badge';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardElement } from '@/shared/ui/display/Card/Card.constants';
import { Skeleton } from '@/shared/ui/display/Skeleton/Skeleton';
import {
  STAT_LOADING_LINES,
  STAT_TREND_BADGE_TONES,
} from '@/shared/ui/display/Stat/Stat.constants';
import type { StatProps } from '@/shared/ui/display/Stat/Stat.typedefs';
import styles from '@/shared/ui/display/Stat/Stat.module.scss';

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
