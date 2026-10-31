import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteChannel } from '@/features/channels/communication/hooks/useDeleteChannel';
import { useRotateApiChannelKey } from '@/features/channels/communication/hooks/useRotateApiChannelKey';
import { useUpdateChannel } from '@/features/channels/communication/hooks/useUpdateChannel';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import type { ApiChannelContentProps } from '@/features/channels/containers/ApiChannelPage/ApiChannelContent/ApiChannelContent.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import type { RotatedApiChannel } from '@/features/channels/typedefs/apiChannel.typedefs';
import { ApiChannelDetails } from '@/features/channels/view/ApiChannelDetails';
import { ApiSecretKeyDialog } from '@/features/channels/view/ApiSecretKeyDialog';
import { DeleteApiChannelDialog } from '@/features/channels/view/DeleteApiChannelDialog';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import type { SelectOption } from '@/shared/ui/inputs/Select';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ApiChannelContent({ workspaceId, channel, agents }: ApiChannelContentProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const { updateChannel, saving } = useUpdateChannel();
  const { rotateApiChannelKey, rotating } = useRotateApiChannelKey();
  const { deleteChannel, deleting } = useDeleteChannel();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [agentId, setAgentId] = useState(channel.agentId ?? '');
  const [replyMode, setReplyMode] = useState(channel.replyMode);
  const [webhook, setWebhook] = useState(channel.webhook ?? '');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [rotated, setRotated] = useState<RotatedApiChannel | null>(null);

  const agentOptions: readonly SelectOption[] =
    agents.length === 0
      ? [{ value: '', label: t('telegram.form.agentPlaceholder'), disabled: true }]
      : agents.map((agent) => ({ value: agent.id, label: agent.name }));

  const closeDelete = () => {
    setDeleteOpen(false);
    setTypedName('');
  };

  const copySecret = (secret: string) => {
    if (typeof navigator.clipboard !== 'undefined') {
      void navigator.clipboard.writeText(secret);
    }
  };

  const save = async () => {
    try {
      await updateChannel({
        id: channel.id,
        agentId,
        showTyping: channel.showTyping,
        replyMode,
        webhook: webhook.trim() === '' ? null : webhook.trim(),
      });
      showToast({ message: t('api.channel.saved'), tone: ToastTone.Ok });
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const rotate = async () => {
    try {
      const result = await rotateApiChannelKey(channel.id);
      if (result !== null) {
        setRotated(result);
      }
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const remove = async () => {
    try {
      await deleteChannel(channel.id);
      closeDelete();
      void navigate({ to: CHANNELS_PATH, params: { workspaceId } });
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  return (
    <>
      <ApiChannelDetails
        channelsLink={channelsHref(workspaceId)}
        channel={channel}
        agentOptions={agentOptions}
        agentId={agentId}
        replyMode={replyMode}
        webhook={webhook}
        onAgentChange={setAgentId}
        onReplyModeChange={setReplyMode}
        onWebhookChange={setWebhook}
        onSave={() => void save()}
        onDelete={() => setDeleteOpen(true)}
        onRotate={() => void rotate()}
        saving={saving}
        rotating={rotating}
        deleting={deleting}
      />
      {deleteOpen && (
        <DeleteApiChannelDialog
          channelName={channel.name}
          agentName={channel.agentName ?? t('nav.noAgent')}
          typedName={typedName}
          confirmed={typedName === channel.name}
          onTypedNameChange={setTypedName}
          onSubmit={() => void remove()}
          onClose={closeDelete}
        />
      )}
      {rotated !== null && (
        <ApiSecretKeyDialog
          channelName={rotated.name}
          secret={rotated.secret}
          endpoint={rotated.endpoint}
          onOpenChange={(open) => {
            if (!open) {
              setRotated(null);
            }
          }}
          onCopy={() => copySecret(rotated.secret)}
          onDone={() => setRotated(null)}
        />
      )}
    </>
  );
}
