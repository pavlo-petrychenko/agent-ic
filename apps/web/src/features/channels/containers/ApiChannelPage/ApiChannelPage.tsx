import { useState } from 'react';
import { API_CHANNEL_AGENT_OPTIONS } from '@/features/channels/constants/apiChannel.constants';
import {
  API_CHANNEL_MOCKS,
  DEFAULT_API_CHANNEL,
} from '@/features/channels/constants/channelMocks.constants';
import type { ApiChannelPageProps } from '@/features/channels/containers/ApiChannelPage/ApiChannelPage.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { ApiChannelDetails } from '@/features/channels/view/ApiChannelDetails';
import { DeleteApiChannelDialog } from '@/features/channels/view/DeleteApiChannelDialog';

export function ApiChannelPage({ workspaceId, channelId }: ApiChannelPageProps) {
  const channel = API_CHANNEL_MOCKS.find((item) => item.id === channelId) ?? DEFAULT_API_CHANNEL;
  const [agentId, setAgentId] = useState(channel.agentId);
  const [replyMode, setReplyMode] = useState(channel.replyMode);
  const [webhook, setWebhook] = useState(channel.webhook);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const noop = () => undefined;

  const closeDelete = () => {
    setDeleteOpen(false);
    setTypedName('');
  };

  return (
    <>
      <ApiChannelDetails
        channelsLink={channelsHref(workspaceId)}
        channel={channel}
        agentOptions={API_CHANNEL_AGENT_OPTIONS}
        agentId={agentId}
        replyMode={replyMode}
        webhook={webhook}
        onAgentChange={setAgentId}
        onReplyModeChange={setReplyMode}
        onWebhookChange={setWebhook}
        onSave={noop}
        onDelete={() => setDeleteOpen(true)}
        onRotate={noop}
      />
      {deleteOpen && (
        <DeleteApiChannelDialog
          channelName={channel.name}
          agentName={channel.agentName}
          typedName={typedName}
          confirmed={typedName === channel.name}
          onTypedNameChange={setTypedName}
          onSubmit={closeDelete}
          onClose={closeDelete}
        />
      )}
    </>
  );
}
