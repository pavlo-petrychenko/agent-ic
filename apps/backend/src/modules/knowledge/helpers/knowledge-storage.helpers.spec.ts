import { describe, expect, it } from 'vitest';
import {
  knowledgeContentStorageKey,
  knowledgeOriginalStorageKey,
  knowledgeUploadStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';

describe('knowledge storage keys', () => {
  it('uses the document id and extension under the workspace', () => {
    expect(knowledgeUploadStorageKey('ws', 'doc', 'Handbook.PDF')).toBe(
      'workspaces/ws/knowledge/uploads/doc/original.pdf',
    );
    expect(knowledgeOriginalStorageKey('ws', 'doc', 'Handbook.PDF')).toBe(
      'workspaces/ws/knowledge/documents/doc/original.pdf',
    );
    expect(knowledgeContentStorageKey('ws', 'doc')).toBe(
      'workspaces/ws/knowledge/documents/doc/content.md',
    );
  });
});
