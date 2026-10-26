import {
  STORAGE_KEY_SEPARATOR,
  STORAGE_WORKSPACE_ROOT,
} from '@/platform/storage/constants/storage.constants';

export const workspaceStorageKey = (workspaceId: string, ...segments: readonly string[]): string =>
  [STORAGE_WORKSPACE_ROOT, workspaceId, ...segments].join(STORAGE_KEY_SEPARATOR);
