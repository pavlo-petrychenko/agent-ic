import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChannelKind } from '@/features/channels/constants/channel.constants';
import {
  API_CHANNEL_MOCKS,
  TELEGRAM_BOTS,
} from '@/features/channels/constants/channelMocks.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import {
  CHANNELS_API_CHANNEL_PATH,
  CHANNELS_TELEGRAM_BOT_PATH,
  CHANNELS_TELEGRAM_NEW_PATH,
} from '@/features/channels/constants/route.constants';
import { ApiChannelCreateDialogs } from '@/features/channels/containers/ApiChannelCreateDialogs';
import type { ChannelsShellProps } from '@/features/channels/containers/ChannelsShell/ChannelsShell.typedefs';
import {
  apiChannelHref,
  apiChannelPrefix,
  telegramBotHref,
  telegramBotPrefix,
  telegramNewHref,
} from '@/features/channels/logic/helpers/route.helpers';
import { TelegramBotStatus } from '@/features/channels/typedefs/telegramBot.typedefs';
import type { ChannelsNavGroup, ChannelsNavItem } from '@/features/channels/view/ChannelsNav';
import { ChannelsNav } from '@/features/channels/view/ChannelsNav';
import { StatusKind } from '@/shared/ui/display/StatusDot';
import { IconName } from '@/shared/ui/foundations/Icon';

export function ChannelsShell({ workspaceId, children }: ChannelsShellProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [apiCreateOpen, setApiCreateOpen] = useState(false);
  const showTelegramChannels =
    pathname.startsWith(telegramBotPrefix(workspaceId)) &&
    pathname !== telegramNewHref(workspaceId);
  const showApiChannels = pathname.startsWith(apiChannelPrefix(workspaceId));
  const showMockChannels = showTelegramChannels || showApiChannels;
  const openApiCreate = () => setApiCreateOpen(true);

  const telegramItems: readonly ChannelsNavItem[] = showMockChannels
    ? TELEGRAM_BOTS.map((bot) => ({
        id: bot.id,
        title: bot.username,
        subtitle:
          bot.status === TelegramBotStatus.Revoked
            ? `${bot.agentName} · ${t('nav.tokenRevoked')}`
            : bot.agentName,
        icon: IconName.Send,
        status: bot.status === TelegramBotStatus.Revoked ? StatusKind.Err : StatusKind.Ok,
        selected: pathname === telegramBotHref(workspaceId, bot.id),
        to: CHANNELS_TELEGRAM_BOT_PATH,
        params: { workspaceId, botId: bot.id },
      }))
    : [];

  const apiItems: readonly ChannelsNavItem[] = showMockChannels
    ? API_CHANNEL_MOCKS.map((channel) => ({
        id: channel.id,
        title: channel.name,
        subtitle: channel.sendsEvents
          ? `${channel.agentName} · ${t('nav.messagesAndEvents')}`
          : channel.agentName,
        icon: IconName.Api,
        status: StatusKind.Ok,
        selected: pathname === apiChannelHref(workspaceId, channel.id),
        to: CHANNELS_API_CHANNEL_PATH,
        params: { workspaceId, channelId: channel.id },
      }))
    : [];

  const groups: readonly ChannelsNavGroup[] = [
    {
      id: ChannelKind.Telegram,
      label: t('nav.groups.telegram'),
      action: {
        label: t('options.telegram.title'),
        onClick: () => void navigate({ to: CHANNELS_TELEGRAM_NEW_PATH, params: { workspaceId } }),
      },
      items: telegramItems,
    },
    {
      id: ChannelKind.Api,
      label: t('nav.groups.api'),
      action: { label: t('options.api.title'), onClick: openApiCreate },
      items: apiItems,
    },
  ];

  return (
    <div className="flex h-full min-h-0">
      <ChannelsNav
        title={t('nav.title')}
        ariaLabel={t('nav.label')}
        groups={groups}
        emptyLabel={showMockChannels ? null : t('nav.empty')}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</div>
      {apiCreateOpen && <ApiChannelCreateDialogs onClose={() => setApiCreateOpen(false)} />}
    </div>
  );
}
