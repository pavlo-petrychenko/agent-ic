import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API_CHANNEL_AGENT_OPTIONS,
  API_ENDPOINT_MOCK,
  API_SECRET_KEY_MOCK,
} from '@/features/channels/constants/apiChannel.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { ApiChannelCreateDialogsProps } from '@/features/channels/containers/ApiChannelCreateDialogs/ApiChannelCreateDialogs.typedefs';
import {
  ApiReplyMode,
  type CreatedApiChannel,
} from '@/features/channels/typedefs/apiChannel.typedefs';
import { ApiSecretKeyDialog } from '@/features/channels/view/ApiSecretKeyDialog';
import { CreateApiChannelDialog } from '@/features/channels/view/CreateApiChannelDialog';

export function ApiChannelCreateDialogs({ onClose }: ApiChannelCreateDialogsProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const [name, setName] = useState(t('api.create.defaultName'));
  const [agentId, setAgentId] = useState('');
  const [replyMode, setReplyMode] = useState(ApiReplyMode.Response);
  const [webhook, setWebhook] = useState('');
  const [created, setCreated] = useState<CreatedApiChannel | null>(null);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const onCreate = () => {
    const channelName = name.trim() === '' ? t('api.create.defaultName') : name.trim();
    setCreated({
      name: channelName,
      secret: API_SECRET_KEY_MOCK,
      endpoint: API_ENDPOINT_MOCK,
    });
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
      agentId={agentId === '' ? (API_CHANNEL_AGENT_OPTIONS[0]?.value ?? '') : agentId}
      agentOptions={API_CHANNEL_AGENT_OPTIONS}
      replyMode={replyMode}
      webhook={webhook}
      onOpenChange={onOpenChange}
      onNameChange={setName}
      onAgentChange={setAgentId}
      onReplyModeChange={setReplyMode}
      onWebhookChange={setWebhook}
      onCancel={onClose}
      onCreate={onCreate}
    />
  );
}
