import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateTelegram } from '@/features/channels/communication/hooks/useUpdateTelegram';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { TelegramBotSettingsResult } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import type { SelectOption } from '@/shared/ui/inputs/Select';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useTelegramBotSettings(
  channel: TelegramChannelView,
  agentOptions: readonly SelectOption[],
): TelegramBotSettingsResult {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { updateTelegram, saving } = useUpdateTelegram();
  const [agentId, setAgentId] = useState(channel.agentId ?? agentOptions[0]?.value ?? '');
  const [typing, setTyping] = useState(channel.showTyping);

  const save = async () => {
    try {
      await updateTelegram({ id: channel.id, agentId, showTyping: typing });
      showToast({ message: t('telegram.bot.saved'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  return {
    agentId,
    typing,
    saving,
    onAgentChange: setAgentId,
    onTypingChange: setTyping,
    onSave: () => void save(),
  };
}
