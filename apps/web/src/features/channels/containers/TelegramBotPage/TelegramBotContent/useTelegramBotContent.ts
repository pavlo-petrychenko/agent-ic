import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteChannel } from '@/features/channels/communication/hooks/useDeleteChannel';
import { useDisconnectTelegram } from '@/features/channels/communication/hooks/useDisconnectTelegram';
import { useReconnectTelegram } from '@/features/channels/communication/hooks/useReconnectTelegram';
import { useReplaceTelegramToken } from '@/features/channels/communication/hooks/useReplaceTelegramToken';
import { useUpdateTelegram } from '@/features/channels/communication/hooks/useUpdateTelegram';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import { TELEGRAM_TOKEN_PATTERN } from '@/features/channels/constants/telegram.constants';
import type {
  TelegramBotContentProps,
  UseTelegramBotContentResult,
} from '@/features/channels/containers/TelegramBotPage/TelegramBotContent/TelegramBotContent.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useTelegramBotContent({
  workspaceId,
  channel,
  agentOptions,
}: TelegramBotContentProps): UseTelegramBotContentResult {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { deleteChannel, deleting } = useDeleteChannel();
  const { disconnectTelegram, disconnecting } = useDisconnectTelegram();
  const { reconnectTelegram, reconnecting } = useReconnectTelegram();
  const { replaceTelegramToken, replacing } = useReplaceTelegramToken();
  const { updateTelegram, saving } = useUpdateTelegram();

  const [agentId, setAgentId] = useState(channel.agentId ?? agentOptions[0]?.value ?? '');
  const [typing, setTyping] = useState(channel.showTyping);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceToken, setReplaceToken] = useState('');
  const [replaceTokenError, setReplaceTokenError] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const saveSettings = async () => {
    try {
      await updateTelegram({ id: channel.id, agentId, showTyping: typing });
      showToast({ message: t('telegram.bot.saved'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const openDisconnect = () => {
    setDisconnectError(null);
    setDisconnectOpen(true);
  };

  const disconnectBot = async () => {
    setDisconnectError(null);
    try {
      await disconnectTelegram(channel.id);
      setDisconnectOpen(false);
      await navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (error) {
      setDisconnectError(errorMessage(toAppError(error)));
    }
  };

  const reconnectBot = async () => {
    try {
      await reconnectTelegram(channel.id);
      showToast({ message: t('telegram.bot.reconnected'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const openReplaceToken = () => {
    setReplaceToken('');
    setReplaceTokenError(null);
    setReplaceError(null);
    setReplaceOpen(true);
  };

  const changeReplaceToken = (value: string) => {
    setReplaceToken(value);
    setReplaceTokenError(null);
    setReplaceError(null);
  };

  const submitReplaceToken = async () => {
    const trimmed = replaceToken.trim();
    if (trimmed === '') {
      setReplaceTokenError(t('telegram.bot.replaceDialog.tokenRequired'));
      return;
    }
    if (!TELEGRAM_TOKEN_PATTERN.test(trimmed)) {
      setReplaceTokenError(t('telegram.bot.replaceDialog.tokenError'));
      return;
    }
    setReplaceTokenError(null);
    setReplaceError(null);
    try {
      await replaceTelegramToken({ id: channel.id, token: trimmed });
      setReplaceOpen(false);
      showToast({ message: t('telegram.bot.tokenReplaced'), tone: ToastTone.Ok });
    } catch (error) {
      setReplaceError(errorMessage(toAppError(error)));
    }
  };

  const openDelete = () => {
    setTypedName('');
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setTypedName('');
    setDeleteError(null);
  };

  const changeTypedName = (value: string) => {
    setTypedName(value);
    setDeleteError(null);
  };

  const deleteBot = async () => {
    if (typedName !== channel.displayName) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteChannel(channel.id);
      setDeleteOpen(false);
      showToast({ message: t('telegram.bot.deleted'), tone: ToastTone.Ok });
      await navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (error) {
      setDeleteError(errorMessage(toAppError(error)));
    }
  };

  return {
    channelsLink: channelsHref(workspaceId),
    botUsername: channel.displayName,
    agentName: channel.agentName ?? t('telegram.bot.unknownAgent'),
    agentId,
    typing,
    saving,
    disconnectOpen,
    disconnecting,
    disconnectError,
    reconnecting,
    replaceOpen,
    replacing,
    replaceToken,
    replaceTokenError,
    replaceError,
    deleteOpen,
    deleting,
    deleteError,
    typedName,
    deleteConfirmed: typedName === channel.displayName,
    onAgentChange: setAgentId,
    onTypingChange: setTyping,
    onSave: () => void saveSettings(),
    onReplaceToken: openReplaceToken,
    onReplaceTokenChange: changeReplaceToken,
    onReplaceOpenChange: (open) => {
      if (!open) {
        setReplaceOpen(false);
      }
    },
    onReplaceCancel: () => setReplaceOpen(false),
    onReplaceConfirm: () => void submitReplaceToken(),
    onDisconnect: openDisconnect,
    onDisconnectOpenChange: (open) => {
      if (!open) {
        setDisconnectOpen(false);
      }
    },
    onDisconnectCancel: () => setDisconnectOpen(false),
    onDisconnectConfirm: () => void disconnectBot(),
    onReconnect: () => void reconnectBot(),
    onDelete: openDelete,
    onDeleteOpenChange: (open) => {
      if (!open) {
        closeDelete();
      }
    },
    onDeleteCancel: closeDelete,
    onTypedNameChange: changeTypedName,
    onDeleteConfirm: () => void deleteBot(),
  };
}
