import { describe, expect, it } from 'vitest';
import {
  channelsHref,
  telegramBotHref,
  telegramBotPrefix,
  telegramNewHref,
} from '@/features/channels/logic/helpers/route.helpers';

describe('channel route helpers', () => {
  it('encodes the workspace id', () => {
    expect(channelsHref('ws 1')).toBe('/w/ws%201/channels');
  });

  it('builds the Telegram routes from the channels href', () => {
    expect(telegramNewHref('ws_demo')).toBe('/w/ws_demo/channels/telegram/new');
    expect(telegramBotHref('ws_demo', 'bot 1')).toBe('/w/ws_demo/channels/telegram/bot%201');
    expect(telegramBotPrefix('ws_demo')).toBe('/w/ws_demo/channels/telegram/');
  });
});
