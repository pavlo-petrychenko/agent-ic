import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgents } from '@/features/agents';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';
import { TELEGRAM_TOKEN_PATTERN } from '@/features/channels/constants/telegram.constants';
import { EMPTY_TELEGRAM_STATS } from '@/features/channels/constants/telegramBot.constants';
import type { TelegramConnectPageProps } from '@/features/channels/containers/TelegramConnectPage/TelegramConnectPage.typedefs';
import { channelsHref } from '@/features/channels/logic/helpers/route.helpers';
import { TelegramActivityCard } from '@/features/channels/view/TelegramActivityCard';
import { TelegramConnectForm } from '@/features/channels/view/TelegramConnectForm';
import { TelegramConnectHelpCard } from '@/features/channels/view/TelegramConnectHelpCard';
import type { SelectOption } from '@/shared/ui/inputs/Select';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';

export function TelegramConnectPage({ workspaceId }: TelegramConnectPageProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const { agents } = useAgents();
  const [token, setToken] = useState('');
  const [agentId, setAgentId] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const agentOptions: readonly SelectOption[] =
    agents.length === 0
      ? [{ value: '', label: t('telegram.form.agentPlaceholder'), disabled: true }]
      : agents.map((agent) => ({ value: agent.id, label: agent.name }));

  const onTokenChange = (value: string) => {
    setToken(value);
    setTokenError(null);
  };

  const onSubmit = () => {
    const trimmed = token.trim();
    if (trimmed === '') {
      setTokenError(t('telegram.form.tokenRequired'));
      return;
    }
    if (!TELEGRAM_TOKEN_PATTERN.test(trimmed)) {
      setTokenError(t('telegram.form.tokenError'));
      return;
    }
    setTokenError(null);
  };

  const channelsLink = channelsHref(workspaceId);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('telegram.title')}
        subtitle={t('telegram.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('telegram.breadcrumb')}
            moreLabel={t('telegram.breadcrumbMore')}
            items={[
              { label: t('telegram.breadcrumbChannels'), to: channelsLink },
              { label: t('telegram.breadcrumbTelegram'), to: channelsLink },
            ]}
          />
        }
      />
      <div className="grid grid-cols-1 items-start gap-5 px-7 compact:grid-cols-[minmax(18rem,1fr)_minmax(15rem,20rem)]">
        <TelegramConnectForm
          token={token}
          tokenError={tokenError}
          agentId={agentId === '' ? (agents[0]?.id ?? '') : agentId}
          agentOptions={agentOptions}
          onTokenChange={onTokenChange}
          onAgentChange={setAgentId}
          onSubmit={onSubmit}
          onCancel={() => void navigate({ to: CHANNELS_PATH, params: { workspaceId } })}
        />
        <div className="flex flex-col gap-4">
          <TelegramConnectHelpCard />
          <TelegramActivityCard stats={EMPTY_TELEGRAM_STATS} />
        </div>
      </div>
    </div>
  );
}
