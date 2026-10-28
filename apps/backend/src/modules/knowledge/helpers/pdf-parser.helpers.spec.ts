import { describe, expect, it } from 'vitest';
import {
  DocumentParseErrorCode,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { parsePdfDocument } from '@/modules/knowledge/helpers/pdf-parser.helpers';

const escapePdfText = (text: string): string =>
  text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');

const buildPdf = (pages: readonly string[]): Buffer => {
  const objects: string[] = [];
  const pageReferences = pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ');
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageReferences}] /Count ${pages.length} >>`;
  objects[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((text, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = 5 + index * 2;
    const content =
      text.length === 0 ? '' : `BT /F1 12 Tf 72 720 Td (${escapePdfText(text)}) Tj ET`;
    objects[pageObject - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject - 1] =
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index] ?? ''}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index] ?? 0).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
};

const input = (bytes: Buffer) => ({
  bytes,
  fileName: 'guide.pdf',
  mimeType: 'application/pdf',
});

describe('parsePdfDocument', () => {
  it('extracts text from the PDF text layer', async () => {
    await expect(parsePdfDocument(input(buildPdf(['Hello PDF'])))).resolves.toEqual({
      markdown: 'Hello PDF',
      warnings: [],
    });
  });

  it('fails a PDF with no extractable text', async () => {
    await expect(parsePdfDocument(input(buildPdf([''])))).rejects.toMatchObject({
      code: DocumentParseErrorCode.PdfHasNoText,
    });
  });

  it('warns when only some pages have text', async () => {
    const result = await parsePdfDocument(input(buildPdf(['Hello', ''])));

    expect(result.markdown).toBe('Hello');
    expect(result.warnings).toMatchObject([{ code: DocumentParseWarningCode.PdfPagesWithoutText }]);
  });

  it('fails a file that the PDF reader cannot open', async () => {
    await expect(parsePdfDocument(input(Buffer.from('not a pdf')))).rejects.toMatchObject({
      code: DocumentParseErrorCode.Unreadable,
    });
  });
});
