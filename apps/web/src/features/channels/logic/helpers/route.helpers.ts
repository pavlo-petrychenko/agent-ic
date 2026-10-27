import { CHANNELS_PATH } from '@/features/channels/constants/route.constants';

export const channelsHref = (workspaceId: string): string =>
  CHANNELS_PATH.replace('$workspaceId', encodeURIComponent(workspaceId));
