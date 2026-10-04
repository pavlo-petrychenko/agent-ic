import { INVITE_LINK_PATH } from '@/modules/identity/constants/workspace.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';

export const inviteLinkUrl = (publicUrl: string, token: string): string =>
  new URL(
    [INVITE_LINK_PATH, encodeURIComponent(token)].join(URL_PATH_SEPARATOR),
    publicUrl,
  ).toString();
