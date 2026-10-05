import { describe, expect, it } from 'vitest';
import { isValidCron, isValidTimeZone } from '@flow/validation/helpers/schedule.helpers';

describe('isValidCron', () => {
  it.each(['* * * * *', '0 9 * * 1-5', '*/15 8-18 * * *', '0,30 9 1,15 1-12/2 0', ' 5 4 * * 7 '])(
    'accepts %j',
    (expression) => {
      expect(isValidCron(expression)).toBe(true);
    },
  );

  it.each([
    '',
    '* * * *',
    '* * * * * *',
    '60 * * * *',
    '* 24 * * *',
    '* * 0 * *',
    '* * * 13 *',
    '* * * * 8',
    '5-1 * * * *',
    '*/0 * * * *',
    'a * * * *',
    '1/2/3 * * * *',
    '1-2-3 * * * *',
    ', * * * *',
  ])('refuses %j', (expression) => {
    expect(isValidCron(expression)).toBe(false);
  });
});

describe('isValidTimeZone', () => {
  it('accepts IANA zones and refuses unknown ones', () => {
    expect(isValidTimeZone('Europe/Kyiv')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Mars/Base')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});
