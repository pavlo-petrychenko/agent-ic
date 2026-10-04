import type { InviteDetails } from '@/features/auth/typedefs/invite.typedefs';

export interface SignUpPageProps {
  invite?: InviteDetails | null;
}
