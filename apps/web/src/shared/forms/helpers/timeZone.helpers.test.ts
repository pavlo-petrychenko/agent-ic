import { describe, expect, it } from 'vitest';
import {
  canonicalTimeZone,
  supportedTimeZones,
  timeZoneChoices,
  timeZoneOptions,
} from '@/shared/forms/helpers/timeZone.helpers';

describe('canonicalTimeZone', () => {
  it('renames a retired identifier and keeps the rest', () => {
    expect(canonicalTimeZone('Europe/Kiev')).toBe('Europe/Kyiv');
    expect(canonicalTimeZone('Europe/London')).toBe('Europe/London');
  });
});

describe('supportedTimeZones', () => {
  it('offers UTC and Kyiv, leaves out the excluded zones and repeats nothing', () => {
    const zones = supportedTimeZones();

    expect(zones).toContain('UTC');
    expect(zones).toContain('Europe/Kyiv');
    expect(zones).not.toContain('Europe/Moscow');
    expect(zones).not.toContain('Europe/Kiev');
    expect(new Set(zones).size).toBe(zones.length);
  });
});

describe('timeZoneChoices', () => {
  it('puts an unknown current zone first and ignores an empty one', () => {
    expect(timeZoneChoices('Mars/Base')[0]).toBe('Mars/Base');
    expect(timeZoneChoices('')).toEqual(supportedTimeZones());
    expect(timeZoneChoices('Europe/Kiev')).toEqual(supportedTimeZones());
  });
});

describe('timeZoneOptions', () => {
  it('uses the zone name as value and label', () => {
    expect(timeZoneOptions('UTC')).toContainEqual({
      value: 'Europe/London',
      label: 'Europe/London',
    });
  });
});
