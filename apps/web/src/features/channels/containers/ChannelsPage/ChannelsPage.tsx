import { useTranslation } from 'react-i18next';
import { ChannelKind } from '@/features/channels/constants/channel.constants';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { ChannelOption } from '@/features/channels/view/ChannelOptions';
import { ChannelOptions } from '@/features/channels/view/ChannelOptions';
import type { ChannelsNavGroup } from '@/features/channels/view/ChannelsNav';
import { ChannelsNav } from '@/features/channels/view/ChannelsNav';
import { ButtonVariant } from '@/shared/ui/actions/Button';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';

export function ChannelsPage() {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const openCreate = () => undefined;

  const groups: readonly ChannelsNavGroup[] = [
    {
      id: ChannelKind.Telegram,
      label: t('nav.groups.telegram'),
      action: { label: t('options.telegram.title'), onClick: openCreate },
    },
    {
      id: ChannelKind.Api,
      label: t('nav.groups.api'),
      action: { label: t('options.api.title'), onClick: openCreate },
    },
  ];

  const options: readonly ChannelOption[] = [
    {
      id: ChannelKind.Telegram,
      icon: IconName.Send,
      tone: EmptyStateTone.Info,
      title: t('options.telegram.title'),
      description: t('options.telegram.description'),
      actionLabel: t('options.telegram.action'),
      actionVariant: ButtonVariant.Primary,
      onAction: openCreate,
    },
    {
      id: ChannelKind.Api,
      icon: IconName.Api,
      tone: EmptyStateTone.Neutral,
      title: t('options.api.title'),
      description: t('options.api.description'),
      actionLabel: t('options.api.action'),
      actionVariant: ButtonVariant.Secondary,
      onAction: openCreate,
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
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <PageHeader title={t('page.title')} subtitle={t('page.subtitle')} />
        <div className="px-7 pt-5">
          <ChannelOptions options={options} />
        </div>
      </div>
    </div>
  );
}
