import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { SetupChecklistProps } from '@/features/agents/view/SetupChecklist/SetupChecklist.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { IconRow } from '@/shared/ui/display/IconRow';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';

export function SetupChecklist({ creating, inviteHref, onStart, onInvite }: SetupChecklistProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const steps = [
    <IconRow
      key="workspace"
      icon={IconName.Check}
      tone={NodeKind.Ok}
      label={t('setup.workspace')}
      trailing={<Badge tone={BadgeTone.Ok}>{t('setup.done')}</Badge>}
    />,
    <IconRow
      key="agent"
      icon={IconName.Agent}
      tone={NodeKind.Agent}
      label={t('setup.agent')}
      trailing={
        <Button size={ButtonSize.Sm} loading={creating} onClick={onStart}>
          {t('setup.start')}
        </Button>
      }
    />,
  ];
  if (inviteHref !== null) {
    steps.push(
      <IconRow
        key="invite"
        icon={IconName.User}
        label={t('setup.invite')}
        trailing={
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            href={inviteHref}
            onClick={(event) => {
              event.preventDefault();
              onInvite();
            }}
          >
            {t('setup.copyInvite')}
          </Button>
        }
      />,
    );
  }

  return (
    <Card>
      <CardHeader title={t('setup.title')} sub={t('setup.subtitle', { count: steps.length })} />
      <div className="flex flex-col gap-1">{steps}</div>
    </Card>
  );
}
