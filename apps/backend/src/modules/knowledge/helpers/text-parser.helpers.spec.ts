import { describe, expect, it } from 'vitest';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { parseTextDocument } from '@/modules/knowledge/helpers/text-parser.helpers';

const input = (bytes: Buffer) => ({
  bytes,
  fileName: 'guide.md',
  mimeType: 'text/markdown',
});

describe('parseTextDocument', () => {
  it('keeps Markdown headings and tables', async () => {
    const markdown = '# Pricing\n\n| Service | Price |\n| --- | --- |\n| Haircut | 20 |\n';

    await expect(parseTextDocument(input(Buffer.from(markdown)))).resolves.toEqual({
      markdown,
      warnings: [],
    });
  });

  it('rejects bytes that are not UTF-8', async () => {
    const failure = parseTextDocument(input(Buffer.from([0xff])));

    await expect(failure).rejects.toBeInstanceOf(DocumentParseError);
    await expect(failure).rejects.toMatchObject({ code: DocumentParseErrorCode.Unreadable });
  });
});
