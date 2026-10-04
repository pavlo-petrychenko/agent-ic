import { INVITE_PATH_PREFIX } from '@/features/auth/constants/invite.constants';

export const inviteHref = (token: string): string =>
  `${INVITE_PATH_PREFIX}${encodeURIComponent(token)}`;
