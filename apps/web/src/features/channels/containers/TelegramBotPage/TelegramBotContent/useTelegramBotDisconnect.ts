import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDisconnectTelegram } from '@/features/channels/communication/hooks/useDisconnectTelegram';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function useTelegramBotDisconnect(channelId: string, workspaceId: string) {
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { disconnectTelegram, disconnecting } = useDisconnectTelegram();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => {
    setError(null);
    setOpen(true);
  };

  const confirm = async () => {
    setError(null);
    try {
      await disconnectTelegram(channelId);
      setOpen(false);
      await navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    }
  };

  return {
    disconnectOpen: open,
    disconnecting,
    disconnectError: error,
    onDisconnect: openDialog,
    onDisconnectOpenChange: (value: boolean) => {
      if (!value) {
        setOpen(false);
      }
    },
    onDisconnectCancel: () => setOpen(false),
    onDisconnectConfirm: () => void confirm(),
  };
}
