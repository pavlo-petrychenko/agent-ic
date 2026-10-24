import { describe, expect, it } from 'vitest';
import { channelDisplayName } from '@/modules/channels/helpers/channel.helpers';

describe('channelDisplayName', () => {
  it('uses the Telegram username', () => {
    expect(channelDisplayName({ username: 'demo_bot' }, 'fallback')).toBe('demo_bot');
  });

  it('uses the API channel name', () => {
    expect(channelDisplayName({ name: 'Website' }, 'fallback')).toBe('Website');
  });

  it('falls back when no display value exists', () => {
    expect(channelDisplayName({ username: '' }, 'chn_123')).toBe('chn_123');
  });
});
