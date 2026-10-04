import type { WorkspaceRole } from '@agent-ic/contracts';
import type { InviteLinkView } from '@/features/settings/typedefs/inviteLink.typedefs';
import type { SelectOption } from '@/shared/ui/Select';

export interface InviteLinkCardProps {
  link: InviteLinkView | null;
  workspaceName: string;
  expiresOn: string | null;
  canEdit: boolean;
  roleOptions: readonly SelectOption[];
  resetting: boolean;
  onCopy: () => void;
  onReset: () => void;
  onRoleChange: (role: WorkspaceRole) => void;
}
