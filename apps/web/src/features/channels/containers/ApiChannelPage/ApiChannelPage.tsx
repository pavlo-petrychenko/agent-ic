import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents';
import { useApiChannel } from '@/features/channels/communication/hooks/useApiChannel';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { ApiChannelContent } from '@/features/channels/containers/ApiChannelPage/ApiChannelContent';
import type { ApiChannelPageProps } from '@/features/channels/containers/ApiChannelPage/ApiChannelPage.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';

export function ApiChannelPage({ workspaceId, channelId }: ApiChannelPageProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const { agents } = useAgents();
  const { channel, loading, failed, retry } = useApiChannel(channelId, agents);

  if (loading) {
    return <Skeleton label={t('api.channel.loading')} />;
  }

  if (failed || channel === null) {
    return (
      <EmptyState
        icon={IconName.Alert}
        tone={EmptyStateTone.Err}
        title={t(failed ? 'api.channel.loadError' : 'api.channel.notFound')}
        actions={
          <Button variant={ButtonVariant.Secondary} onClick={retry}>
            {t('api.channel.retry')}
          </Button>
        }
      />
    );
  }

  return <ApiChannelContent workspaceId={workspaceId} channel={channel} agents={agents} />;
}
