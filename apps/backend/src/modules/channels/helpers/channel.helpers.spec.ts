import { describe, expect, it } from 'vitest';
import { ApiReplyMode } from '@/modules/channels/constants/channel.constants';
import { channelDisplayName, channelFirstName } from '@/modules/channels/helpers/channel.helpers';

describe('channelDisplayName', () => {
  it('uses the Telegram username', () => {
    expect(channelDisplayName({ username: 'demo_bot', firstName: 'Demo' }, 'fallback')).toBe(
      'demo_bot',
    );
  });

  it('uses the API channel name', () => {
    expect(
      channelDisplayName(
        { name: 'Website', replyMode: ApiReplyMode.Response, webhook: null },
        'fallback',
      ),
    ).toBe('Website');
  });

  it('falls back when no display value exists', () => {
    expect(channelDisplayName({ username: '', firstName: 'Demo' }, 'chn_123')).toBe('chn_123');
  });
});

describe('channelFirstName', () => {
  it('uses the Telegram first name', () => {
    expect(channelFirstName({ username: 'demo_bot', firstName: 'Demo' })).toBe('Demo');
  });

  it('returns null for an API channel', () => {
    expect(
      channelFirstName({ name: 'Website', replyMode: ApiReplyMode.Response, webhook: null }),
    ).toBeNull();
  });
});
