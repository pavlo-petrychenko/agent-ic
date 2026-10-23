import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChannelKind } from '@/features/channels/constants/channel.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import { CHANNELS_TELEGRAM_NEW_PATH } from '@/features/channels/constants/route.constants';
import type { ChannelsShellProps } from '@/features/channels/containers/ChannelsShell/ChannelsShell.typedefs';
import type { ChannelsNavGroup } from '@/features/channels/view/ChannelsNav';
import { ChannelsNav } from '@/features/channels/view/ChannelsNav';

export function ChannelsShell({ workspaceId, children }: ChannelsShellProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const navigate = useNavigate();
  const openCreate = () => undefined;

  const groups: readonly ChannelsNavGroup[] = [
    {
      id: ChannelKind.Telegram,
      label: t('nav.groups.telegram'),
      action: {
        label: t('options.telegram.title'),
        onClick: () => void navigate({ to: CHANNELS_TELEGRAM_NEW_PATH, params: { workspaceId } }),
      },
    },
    {
      id: ChannelKind.Api,
      label: t('nav.groups.api'),
      action: { label: t('options.api.title'), onClick: openCreate },
    },
  ];

  return (
    <div className="flex h-full min-h-0">
      <ChannelsNav
        title={t('nav.title')}
        ariaLabel={t('nav.label')}
        groups={groups}
        emptyLabel={t('nav.empty')}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
