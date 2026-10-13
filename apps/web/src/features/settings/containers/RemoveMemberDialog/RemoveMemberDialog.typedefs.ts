import type { TeamMember } from '@/features/settings/typedefs/member.typedefs';

export interface RemoveMemberDialogProps {
  readonly member: TeamMember;
  readonly roleLabel: string;
  readonly workspaceName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
