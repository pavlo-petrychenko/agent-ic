import { describe, expect, it } from 'vitest';
import {
  knowledgeContentStorageKey,
  knowledgeOriginalStorageKey,
  knowledgeUploadStorageKey,
  knowledgeWorkspaceStoragePrefix,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';

describe('knowledge storage keys', () => {
  it('versions uploads, originals and canonical Markdown under the workspace', () => {
    expect(knowledgeUploadStorageKey('ws', 'doc', 'upload-1', 'Handbook.PDF')).toBe(
      'workspaces/ws/knowledge/uploads/doc/upload-1/original-upload-1.pdf',
    );
    expect(knowledgeOriginalStorageKey('ws', 'doc', 'run-1', 'Handbook.PDF')).toBe(
      'workspaces/ws/knowledge/documents/doc/original-run-1.pdf',
    );
    expect(knowledgeContentStorageKey('ws', 'doc', 3)).toBe(
      'workspaces/ws/knowledge/documents/doc/content-3.md',
    );
  });

  it('scopes the workspace cleanup prefix to the knowledge folder', () => {
    expect(knowledgeWorkspaceStoragePrefix('ws')).toBe('workspaces/ws/knowledge/');
  });
});
