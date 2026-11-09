import type { SetupInviteAction } from '@/features/agents/view/SetupChecklist/SetupChecklist.constants';

export interface SetupInvite {
  action: SetupInviteAction;
  teamHref: string;
  loading: boolean;
}

export interface SetupChecklistProps {
  canStart: boolean;
  invite: SetupInvite | null;
  onStart: () => void;
  onCopyInvite: () => void;
  onOpenTeam: () => void;
}
