import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UPTIME_UNIT_SEPARATOR } from '@/features/status/constants/uptime.constants';
import { toUptimeUnits } from '@/features/status/logic/helpers/uptime.helpers';

export function useUptimeLabel(uptimeSeconds: number | null): string | null {
  const { t } = useTranslation();

  return useMemo(() => {
    if (uptimeSeconds === null) {
      return null;
    }
    return toUptimeUnits(uptimeSeconds)
      .map(({ unit, count }) => t(`status.duration.${unit}`, { count }))
      .join(UPTIME_UNIT_SEPARATOR);
  }, [uptimeSeconds, t]);
}
