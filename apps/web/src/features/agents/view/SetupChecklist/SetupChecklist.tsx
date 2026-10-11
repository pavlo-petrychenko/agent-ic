import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  SetupInviteAction,
  SetupStep,
} from '@/features/agents/view/SetupChecklist/SetupChecklist.constants';
import type { SetupChecklistProps } from '@/features/agents/view/SetupChecklist/SetupChecklist.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card } from '@/shared/ui/display/Card';
import { CardHeader } from '@/shared/ui/display/CardHeader';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { RowList, type RowListRow } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';

export function SetupChecklist({
  creating,
  invite,
  onStart,
  onCopyInvite,
  onOpenTeam,
}: SetupChecklistProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const steps: RowListRow[] = [
    {
      id: SetupStep.Workspace,
      name: t('setup.workspace'),
      leading: <NodeTile kind={NodeKind.Ok} size={TileSize.Sm} icon={IconName.Check} />,
      meta: <Badge tone={BadgeTone.Ok}>{t('setup.done')}</Badge>,
    },
    {
      id: SetupStep.Agent,
      name: t('setup.agent'),
      leading: <NodeTile kind={NodeKind.Agent} size={TileSize.Sm} icon={IconName.Agent} />,
      meta: (
        <Button size={ButtonSize.Sm} loading={creating} onClick={onStart}>
          {t('setup.start')}
        </Button>
      ),
    },
  ];
  if (invite !== null) {
    steps.push({
      id: SetupStep.Invite,
      name: t('setup.invite'),
      leading: <NodeTile kind={NodeKind.Neutral} size={TileSize.Sm} icon={IconName.User} />,
      meta:
        invite.action === SetupInviteAction.Copy ? (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            loading={invite.loading}
            onClick={onCopyInvite}
          >
            {t('setup.copyInvite')}
          </Button>
        ) : (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            href={invite.teamHref}
            onClick={(event) => {
              event.preventDefault();
              onOpenTeam();
            }}
          >
            {t('setup.inviteTeammates')}
          </Button>
        ),
    });
  }

  return (
    <Card>
      <CardHeader title={t('setup.title')} sub={t('setup.subtitle', { count: steps.length })} />
      <RowList mono={false} rows={steps} />
    </Card>
  );
}
