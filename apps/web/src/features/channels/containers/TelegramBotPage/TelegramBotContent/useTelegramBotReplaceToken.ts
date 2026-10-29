import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReplaceTelegramToken } from '@/features/channels/communication/hooks/useReplaceTelegramToken';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TELEGRAM_TOKEN_PATTERN } from '@/features/channels/constants/telegram.constants';
import type { TelegramBotReplaceTokenResult } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useTelegramBotReplaceToken(channelId: string): TelegramBotReplaceTokenResult {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { replaceTelegramToken, replacing } = useReplaceTelegramToken();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => {
    setToken('');
    setTokenError(null);
    setError(null);
    setOpen(true);
  };

  const changeToken = (value: string) => {
    setToken(value);
    setTokenError(null);
    setError(null);
  };

  const confirm = async () => {
    const trimmed = token.trim();
    if (trimmed === '') {
      setTokenError(t('telegram.bot.replaceDialog.tokenRequired'));
      return;
    }
    if (!TELEGRAM_TOKEN_PATTERN.test(trimmed)) {
      setTokenError(t('telegram.bot.replaceDialog.tokenError'));
      return;
    }
    setTokenError(null);
    setError(null);
    try {
      await replaceTelegramToken({ id: channelId, token: trimmed });
      setOpen(false);
      showToast({ message: t('telegram.bot.tokenReplaced'), tone: ToastTone.Ok });
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    }
  };

  return {
    replaceOpen: open,
    replacing,
    replaceToken: token,
    replaceTokenError: tokenError,
    replaceError: error,
    onReplaceToken: openDialog,
    onReplaceTokenChange: changeToken,
    onReplaceOpenChange: (value: boolean) => {
      if (!value) {
        setOpen(false);
      }
    },
    onReplaceCancel: () => setOpen(false),
    onReplaceConfirm: () => void confirm(),
  };
}
