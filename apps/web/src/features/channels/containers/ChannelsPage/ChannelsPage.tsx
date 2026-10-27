import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChannelKind } from '@/features/channels/constants/channel.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_TELEGRAM_NEW_PATH } from '@/features/channels/constants/route.constants';
import { ApiChannelCreateDialogs } from '@/features/channels/containers/ApiChannelCreateDialogs';
import type { ChannelsPageProps } from '@/features/channels/containers/ChannelsPage/ChannelsPage.typedefs';
import type { ChannelOption } from '@/features/channels/view/ChannelOptions';
import { ChannelOptions } from '@/features/channels/view/ChannelOptions';
import { ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function ChannelsPage({ workspaceId }: ChannelsPageProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const [creatingApi, setCreatingApi] = useState(false);

  const options: readonly ChannelOption[] = [
    {
      id: ChannelKind.Telegram,
      icon: IconName.Send,
      tone: EmptyStateTone.Info,
      title: t('options.telegram.title'),
      description: t('options.telegram.description'),
      actionLabel: t('options.telegram.action'),
      actionVariant: ButtonVariant.Primary,
      onAction: () => void navigate({ to: CHANNELS_TELEGRAM_NEW_PATH, params: { workspaceId } }),
    },
    {
      id: ChannelKind.Api,
      icon: IconName.Api,
      tone: EmptyStateTone.Neutral,
      title: t('options.api.title'),
      description: t('options.api.description'),
      actionLabel: t('options.api.action'),
      actionVariant: ButtonVariant.Secondary,
      onAction: () => setCreatingApi(true),
    },
  ];

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
      <div className="px-7">
        <ChannelOptions options={options} />
      </div>
      {creatingApi && <ApiChannelCreateDialogs onClose={() => setCreatingApi(false)} />}
    </div>
  );
}
