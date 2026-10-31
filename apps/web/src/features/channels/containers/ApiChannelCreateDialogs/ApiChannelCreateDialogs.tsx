import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents';
import { useCreateApiChannel } from '@/features/channels/communication/hooks/useCreateApiChannel';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { ApiChannelCreateDialogsProps } from '@/features/channels/containers/ApiChannelCreateDialogs/ApiChannelCreateDialogs.typedefs';
import {
  ApiReplyMode,
  type CreatedApiChannel,
} from '@/features/channels/typedefs/apiChannel.typedefs';
import { ApiSecretKeyDialog } from '@/features/channels/view/ApiSecretKeyDialog';
import { CreateApiChannelDialog } from '@/features/channels/view/CreateApiChannelDialog';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import type { SelectOption } from '@/shared/ui/inputs/Select';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function ApiChannelCreateDialogs({ onClose }: ApiChannelCreateDialogsProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const { agents } = useAgents();
  const { createApiChannel, creating } = useCreateApiChannel();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState(t('api.create.defaultName'));
  const [agentId, setAgentId] = useState('');
  const [replyMode, setReplyMode] = useState(ApiReplyMode.Response);
  const [webhook, setWebhook] = useState('');
  const [created, setCreated] = useState<CreatedApiChannel | null>(null);

  const agentOptions: readonly SelectOption[] =
    agents.length === 0
      ? [{ value: '', label: t('telegram.form.agentPlaceholder'), disabled: true }]
      : agents.map((agent) => ({ value: agent.id, label: agent.name }));
  const selectedAgentId = agentId === '' ? (agentOptions[0]?.value ?? '') : agentId;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const onCreate = async () => {
    if (selectedAgentId === '') {
      return;
    }
    const channelName = name.trim() === '' ? t('api.create.defaultName') : name.trim();
    try {
      const result = await createApiChannel({
        name: channelName,
        agentId: selectedAgentId,
        replyMode,
        webhook: webhook.trim() === '' ? null : webhook.trim(),
      });
      if (result !== null) {
        setCreated(result);
      }
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const onCopy = () => {
    if (created === null || typeof navigator.clipboard === 'undefined') {
      return;
    }
    void navigator.clipboard.writeText(created.secret);
  };

  if (created !== null) {
    return (
      <ApiSecretKeyDialog
        channelName={created.name}
        secret={created.secret}
        endpoint={created.endpoint}
        onOpenChange={onOpenChange}
        onCopy={onCopy}
        onDone={onClose}
      />
    );
  }

  return (
    <CreateApiChannelDialog
      name={name}
      agentId={selectedAgentId}
      agentOptions={agentOptions}
      replyMode={replyMode}
      webhook={webhook}
      submitting={creating}
      onOpenChange={onOpenChange}
      onNameChange={setName}
      onAgentChange={setAgentId}
      onReplyModeChange={setReplyMode}
      onWebhookChange={setWebhook}
      onCancel={onClose}
      onCreate={() => void onCreate()}
    />
  );
}
