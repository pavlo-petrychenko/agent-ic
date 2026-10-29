import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteChannel } from '@/features/channels/communication/hooks/useDeleteChannel';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useTelegramBotDelete(channelId: string, displayName: string, workspaceId: string) {
  const navigate = useNavigate();
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const errorMessage = useErrorMessage();
  const { showToast } = useToast();
  const { deleteChannel, deleting } = useDeleteChannel();
  const [open, setOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openDialog = () => {
    setTypedName('');
    setError(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setTypedName('');
    setError(null);
  };

  const changeTypedName = (value: string) => {
    setTypedName(value);
    setError(null);
  };

  const confirm = async () => {
    if (typedName !== displayName) {
      return;
    }
    setError(null);
    try {
      await deleteChannel(channelId);
      setOpen(false);
      showToast({ message: t('telegram.bot.deleted'), tone: ToastTone.Ok });
      await navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    }
  };

  return {
    deleteOpen: open,
    deleting,
    deleteError: error,
    typedName,
    deleteConfirmed: typedName === displayName,
    onDelete: openDialog,
    onDeleteOpenChange: (value: boolean) => {
      if (!value) {
        closeDialog();
      }
    },
    onDeleteCancel: closeDialog,
    onTypedNameChange: changeTypedName,
    onDeleteConfirm: () => void confirm(),
  };
}
