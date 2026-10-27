import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents';
import { useChannel } from '@/features/channels/communication/hooks/useChannel';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { TelegramBotContent } from '@/features/channels/containers/TelegramBotPage/TelegramBotContent';
import type { TelegramBotPageProps } from '@/features/channels/containers/TelegramBotPage/TelegramBotPage.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export function TelegramBotPage({ workspaceId, botId }: TelegramBotPageProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const { agents } = useAgents();
  const { channel, loading, failed, retry } = useChannel(botId, agents);

  if (loading) {
    return <Skeleton label={t('telegram.loading')} />;
  }

  if (failed || channel === null) {
    return (
      <EmptyState
        icon={IconName.Alert}
        tone={EmptyStateTone.Err}
        title={t(failed ? 'telegram.loadError' : 'telegram.notFound')}
        actions={
          <Button variant={ButtonVariant.Secondary} onClick={retry}>
            {t('telegram.retry')}
          </Button>
        }
      />
    );
  }

  const agentOptions: readonly SelectOption[] =
    agents.length === 0
      ? [{ value: '', label: t('telegram.form.agentPlaceholder'), disabled: true }]
      : agents.map((agent) => ({ value: agent.id, label: agent.name }));

  return (
    <TelegramBotContent workspaceId={workspaceId} channel={channel} agentOptions={agentOptions} />
  );
}
