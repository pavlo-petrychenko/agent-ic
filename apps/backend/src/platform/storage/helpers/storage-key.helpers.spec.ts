import { describe, expect, it } from 'vitest';
import { workspaceStorageKey } from '@/platform/storage/helpers/storage-key.helpers';

describe('workspaceStorageKey', () => {
  it('puts every object under its workspace prefix', () => {
    expect(
      workspaceStorageKey('workspace-id', 'knowledge', 'uploads', 'document-id', 'original.pdf'),
    ).toBe('workspaces/workspace-id/knowledge/uploads/document-id/original.pdf');
  });

  it('keeps a workspace prefix without extra segments', () => {
    expect(workspaceStorageKey('workspace-id')).toBe('workspaces/workspace-id');
  });
});
