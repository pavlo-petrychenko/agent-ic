import {
  SETTINGS_HREF_PREFIX,
  SETTINGS_HREF_SUFFIX,
} from '@/features/settings/constants/route.constants';

export const settingsHref = (workspaceId: string): string =>
  `${SETTINGS_HREF_PREFIX}${encodeURIComponent(workspaceId)}${SETTINGS_HREF_SUFFIX}`;
