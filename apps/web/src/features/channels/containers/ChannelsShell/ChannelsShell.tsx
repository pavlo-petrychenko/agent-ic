import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents';
import { useChannels } from '@/features/channels/communication/hooks/useChannels';
import { ChannelKind } from '@/features/channels/constants/channel.constants';
import { API_CHANNEL_MOCKS } from '@/features/channels/constants/channelMocks.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import {
  CHANNELS_API_CHANNEL_PATH,
  CHANNELS_TELEGRAM_BOT_PATH,
  CHANNELS_TELEGRAM_NEW_PATH,
} from '@/features/channels/constants/route.constants';
import { ApiChannelCreateDialogs } from '@/features/channels/containers/ApiChannelCreateDialogs';
import { TELEGRAM_NAV_STATUS_KEY } from '@/features/channels/containers/ChannelsShell/ChannelsShell.constants';
import type { ChannelsShellProps } from '@/features/channels/containers/ChannelsShell/ChannelsShell.typedefs';
import { apiChannelHref, telegramBotHref } from '@/features/channels/logic/helpers/route.helpers';
import type { TelegramChannelSummary } from '@/features/channels/typedefs/telegram.typedefs';
import type { ChannelsNavGroup, ChannelsNavItem } from '@/features/channels/view/ChannelsNav';
import { ChannelsNav } from '@/features/channels/view/ChannelsNav';
import { IconName } from '@/shared/ui/foundations/Icon';

export function ChannelsShell({ workspaceId, children }: ChannelsShellProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { agents } = useAgents();
  const { channels } = useChannels(agents);
  const [apiCreateOpen, setApiCreateOpen] = useState(false);
  const openApiCreate = () => setApiCreateOpen(true);

  const subtitleOf = (channel: TelegramChannelSummary): string => {
    const agent = channel.agentName ?? t('nav.noAgent');
    const statusKey = TELEGRAM_NAV_STATUS_KEY[channel.status];
    return statusKey === null ? agent : `${agent} · ${t(statusKey)}`;
  };

  const telegramItems: readonly ChannelsNavItem[] = channels.map((channel) => ({
    id: channel.id,
    title: channel.displayName,
    subtitle: subtitleOf(channel),
    icon: IconName.Send,
    selected: pathname === telegramBotHref(workspaceId, channel.id),
    to: CHANNELS_TELEGRAM_BOT_PATH,
    params: { workspaceId, botId: channel.id },
  }));

  const apiItems: readonly ChannelsNavItem[] = API_CHANNEL_MOCKS.map((channel) => ({
    id: channel.id,
    title: channel.name,
    subtitle: channel.sendsEvents
      ? `${channel.agentName} · ${t('nav.messagesAndEvents')}`
      : channel.agentName,
    icon: IconName.Api,
    selected: pathname === apiChannelHref(workspaceId, channel.id),
    to: CHANNELS_API_CHANNEL_PATH,
    params: { workspaceId, channelId: channel.id },
  }));

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
        emptyLabel={telegramItems.length === 0 && apiItems.length === 0 ? t('nav.empty') : null}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</div>
      {apiCreateOpen && <ApiChannelCreateDialogs onClose={() => setApiCreateOpen(false)} />}
    </div>
  );
}
