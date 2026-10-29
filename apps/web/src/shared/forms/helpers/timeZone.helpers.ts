import {
  EXCLUDED_TIME_ZONES,
  EXTRA_TIME_ZONES,
  RENAMED_TIME_ZONES,
} from '@/shared/forms/constants/timeZone.constants';
import type { ComboboxOption } from '@/shared/ui/inputs/Combobox';

export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const canonicalTimeZone = (timeZone: string): string =>
  RENAMED_TIME_ZONES[timeZone] ?? timeZone;

export const supportedTimeZones = (): readonly string[] => {
  const zones = new Set<string>(EXTRA_TIME_ZONES);
  for (const timeZone of Intl.supportedValuesOf('timeZone')) {
    const canonical = canonicalTimeZone(timeZone);
    if (!EXCLUDED_TIME_ZONES.has(canonical)) {
      zones.add(canonical);
    }
  }
  return [...zones];
};

export const timeZoneChoices = (current: string): readonly string[] => {
  const canonical = canonicalTimeZone(current);
  const zones = supportedTimeZones();
  return canonical === '' || zones.includes(canonical) ? zones : [canonical, ...zones];
};

export const timeZoneOptions = (current: string): readonly ComboboxOption[] =>
  timeZoneChoices(current).map((timeZone) => ({ value: timeZone, label: timeZone }));
