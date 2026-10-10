import {
  AGENTS_HREF_SUFFIX,
  WORKSPACE_HREF_PREFIX,
} from '@/features/flow-builder/constants/route.constants';

export const workspaceHref = (workspaceId: string): string =>
  `${WORKSPACE_HREF_PREFIX}${encodeURIComponent(workspaceId)}`;

export const agentsHref = (workspaceId: string): string =>
  `${workspaceHref(workspaceId)}${AGENTS_HREF_SUFFIX}`;
