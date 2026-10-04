import type { InviteDetails } from '@/features/auth/typedefs/invite.typedefs';

export interface InviteSummaryProps {
  invite: InviteDetails;
  initials: string;
}
