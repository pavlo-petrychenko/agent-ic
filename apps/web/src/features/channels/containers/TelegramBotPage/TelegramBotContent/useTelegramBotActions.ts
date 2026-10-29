import { useTranslation } from 'react-i18next';
import { useReconnectTelegram } from '@/features/channels/communication/hooks/useReconnectTelegram';
import { useRefreshTelegramIdentity } from '@/features/channels/communication/hooks/useRefreshTelegramIdentity';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useTelegramBotActions(channelId: string) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { reconnectTelegram, reconnecting } = useReconnectTelegram();
  const { refreshTelegramIdentity, refreshing } = useRefreshTelegramIdentity();

  const reconnect = async () => {
    try {
      await reconnectTelegram(channelId);
      showToast({ message: t('telegram.bot.reconnected'), tone: ToastTone.Ok });
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const refresh = async () => {
    try {
      await refreshTelegramIdentity(channelId);
      showToast({ message: t('telegram.bot.refreshed'), tone: ToastTone.Ok });
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  return {
    reconnecting,
    refreshing,
    onReconnect: () => void reconnect(),
    onRefreshIdentity: () => void refresh(),
  };
}
