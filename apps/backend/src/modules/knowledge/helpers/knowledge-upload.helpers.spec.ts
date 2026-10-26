import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import {
  normalizeUploadMimeType,
  uploadFileName,
  uploadTitle,
  validateUploadFile,
} from '@/modules/knowledge/helpers/knowledge-upload.helpers';

describe('knowledge upload helpers', () => {
  it('sanitizes the file name and derives the title', () => {
    expect(uploadFileName('C:\\fakepath\\Refunds.MD')).toBe('Refunds.MD');
    expect(uploadTitle('C:\\fakepath\\Refunds.MD')).toBe('Refunds');
  });

  it('normalizes a MIME type with parameters', () => {
    expect(normalizeUploadMimeType(' Text/Markdown ; charset=utf-8 ')).toBe('text/markdown');
  });

  it('accepts a supported file within the limit', () => {
    expect(validateUploadFile('refunds.md', 'text/markdown', 100)).toBe('text/markdown');
  });

  it('rejects an unsupported file, an empty file and a file over the limit', () => {
    expect(() => validateUploadFile('refunds.doc', 'application/msword', 100)).toThrow(
      KnowledgeUploadInvalidError,
    );
    expect(() => validateUploadFile('refunds.md', 'text/markdown', 0)).toThrow(
      KnowledgeUploadInvalidError,
    );
    expect(() =>
      validateUploadFile('refunds.md', 'text/markdown', KNOWLEDGE_DOCUMENT_MAX_BYTES + 1),
    ).toThrow(KnowledgeUploadInvalidError);
  });
});
