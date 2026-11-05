import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type {
  TelegramBotContentProps,
  UseTelegramBotContentResult,
} from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { useTelegramBotActions } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotActions';
import { useTelegramBotDelete } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotDelete';
import { useTelegramBotDisconnect } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotDisconnect';
import { useTelegramBotReplaceToken } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotReplaceToken';
import { useTelegramBotSettings } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/useTelegramBotSettings';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';

export function useTelegramBotContent({
  workspaceId,
  channel,
  agentOptions,
  onChannelRefetch,
}: TelegramBotContentProps): UseTelegramBotContentResult {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const settings = useTelegramBotSettings(channel, agentOptions);
  const disconnect = useTelegramBotDisconnect(channel.id, workspaceId);
  const actions = useTelegramBotActions(channel.id, onChannelRefetch);
  const replace = useTelegramBotReplaceToken(channel.id);
  const remove = useTelegramBotDelete(channel.id, channel.displayName, workspaceId);

  return {
    channelsLink: channelsHref(workspaceId),
    botUsername: channel.displayName,
    agentName: channel.agentName ?? t('telegram.bot.unknownAgent'),
    ...settings,
    ...disconnect,
    ...actions,
    ...replace,
    ...remove,
  };
}
