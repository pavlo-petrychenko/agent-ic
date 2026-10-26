import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { KnowledgeFileSkipReason } from '@/features/knowledge/constants/knowledgeUpload.constants';
import {
  formatKnowledgeFileSize,
  knowledgeFileExtension,
  knowledgeFileMimeType,
  knowledgeFileSkipReason,
  knowledgeFileTypeLabel,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';

const fileOf = (name: string, content = 'x'): File => new File([content], name);

describe('knowledge upload helpers', () => {
  it('reads the extension and type label', () => {
    expect(knowledgeFileExtension('GUIDE.MD')).toBe('.md');
    expect(knowledgeFileTypeLabel('GUIDE.MD')).toBe('MD');
    expect(knowledgeFileExtension('README')).toBe('');
  });

  it('rejects unsupported, empty and oversized files', () => {
    expect(knowledgeFileSkipReason(fileOf('prices.xlsx'))).toBe(
      KnowledgeFileSkipReason.Unsupported,
    );
    expect(knowledgeFileSkipReason(fileOf('empty.pdf', ''))).toBe(KnowledgeFileSkipReason.Empty);

    const tooLarge = fileOf('large.pdf');
    Object.defineProperty(tooLarge, 'size', { value: KNOWLEDGE_DOCUMENT_MAX_BYTES + 1 });
    expect(knowledgeFileSkipReason(tooLarge)).toBe(KnowledgeFileSkipReason.TooLarge);
  });

  it('accepts supported files within the limit', () => {
    expect(knowledgeFileSkipReason(fileOf('guide.pdf'))).toBeNull();
    expect(knowledgeFileSkipReason(fileOf('notes.TXT'))).toBeNull();
  });

  it('maps supported extensions to upload MIME types', () => {
    expect(knowledgeFileMimeType('guide.pdf')).toBe('application/pdf');
    expect(knowledgeFileMimeType('notes.MD')).toBe('text/markdown');
    expect(knowledgeFileMimeType('unknown.bin')).toBe('application/octet-stream');
  });

  it('formats file sizes', () => {
    expect(formatKnowledgeFileSize(512)).toBe('512 B');
    expect(formatKnowledgeFileSize(1536)).toBe('1.5 KB');
    expect(formatKnowledgeFileSize(2 * 1024 * 1024)).toBe('2 MB');
  });
});
