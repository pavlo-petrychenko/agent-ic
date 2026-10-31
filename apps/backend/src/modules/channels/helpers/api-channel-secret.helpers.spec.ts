import { describe, expect, it } from 'vitest';
import { apiChannelSecretHint } from '@/modules/channels/helpers/api-channel-secret.helpers';

describe('apiChannelSecretHint', () => {
  it('keeps the first eight and last two characters and masks every hidden one', () => {
    expect(apiChannelSecretHint('sk_live_abcdefghijklmnopQ4')).toBe('sk_live_••••••••••••••••Q4');
  });

  it('counts the bullets from the actual secret length', () => {
    expect(apiChannelSecretHint('12345678middle99')).toBe('12345678••••••99');
  });

  it('masks a secret that is too short to split', () => {
    expect(apiChannelSecretHint('short')).toBe('•••••');
  });
});
