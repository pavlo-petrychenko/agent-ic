import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParserService } from '@/modules/knowledge/services/document-parser.service';

const service = new DocumentParserService();

describe('DocumentParserService', () => {
  it('parses Markdown, canonicalizes it and derives the title', async () => {
    const result = await service.parse({
      bytes: Buffer.from('\uFEFF# Pricing\r\n\r\nGift cards\r\n'),
      fileName: 'pricing-2026.md',
      mimeType: 'text/plain',
    });

    expect(result).toMatchObject({
      title: 'pricing-2026',
      markdown: '# Pricing\n\nGift cards\n',
    });
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  it('uses an explicit document title', async () => {
    const result = await service.parse({
      bytes: Buffer.from('Gift cards'),
      fileName: 'guide.txt',
      mimeType: 'text/plain',
      title: 'Workspace guide',
    });

    expect(result.title).toBe('Workspace guide');
  });

  it('rejects a file whose bytes do not match its declared type', async () => {
    await expect(
      service.parse({
        bytes: Buffer.from('not a PDF'),
        fileName: 'guide.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ code: DocumentParseErrorCode.SignatureMismatch });
  });

  it('rejects an unsupported document type', async () => {
    await expect(
      service.parse({
        bytes: Buffer.from('legacy'),
        fileName: 'guide.doc',
        mimeType: 'application/msword',
      }),
    ).rejects.toMatchObject({ code: DocumentParseErrorCode.UnsupportedType });
  });

  it('rejects a document over the byte limit before parsing it', async () => {
    await expect(
      service.parse({
        bytes: Buffer.alloc(KNOWLEDGE_DOCUMENT_MAX_BYTES + 1),
        fileName: 'guide.txt',
        mimeType: 'text/plain',
      }),
    ).rejects.toMatchObject({ code: DocumentParseErrorCode.TooLarge });
  });

  it('rejects an empty text document', async () => {
    await expect(
      service.parse({
        bytes: Buffer.from(' \n\t'),
        fileName: 'guide.txt',
        mimeType: 'text/plain',
      }),
    ).rejects.toMatchObject({ code: DocumentParseErrorCode.Empty });
  });
});
