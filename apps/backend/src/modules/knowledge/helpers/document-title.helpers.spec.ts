import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_TITLE_TRUNCATED_MESSAGE,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { documentTitle } from '@/modules/knowledge/helpers/document-title.helpers';

describe('documentTitle', () => {
  it('takes the file name without its extension', () => {
    expect(documentTitle('Pricing 2026.pdf')).toEqual({
      title: 'Pricing 2026',
      warnings: [],
    });
  });

  it('removes a Windows directory and the extension', () => {
    expect(documentTitle('C:\\documents\\guide.md').title).toBe('guide');
  });

  it('prefers an explicit title', () => {
    expect(documentTitle('guide.md', 'Workspace guide').title).toBe('Workspace guide');
  });

  it('uses a fallback for an empty file name', () => {
    expect(documentTitle('').title).toBe('Untitled document');
  });

  it('shortens a long title and warns', () => {
    const result = documentTitle(`${'a'.repeat(KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH + 1)}.txt`);

    expect(result.title).toHaveLength(KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH);
    expect(result.warnings).toEqual([
      {
        code: DocumentParseWarningCode.TitleTruncated,
        message: DOCUMENT_TITLE_TRUNCATED_MESSAGE,
      },
    ]);
  });
});
