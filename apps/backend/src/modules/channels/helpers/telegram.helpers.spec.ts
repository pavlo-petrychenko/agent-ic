import { describe, expect, it } from 'vitest';
import { maskTelegramToken } from '@/modules/channels/helpers/telegram.helpers';

describe('maskTelegramToken', () => {
  it('shows the first four bot id characters and the first three secret characters', () => {
    expect(maskTelegramToken('700000001:demo-salon-token')).toBe('7000•••••:dem•••••••••••••');
  });

  it('masks a token without a separator completely', () => {
    expect(maskTelegramToken('invalid')).toBe('•••••••');
  });
});
