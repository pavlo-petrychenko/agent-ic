import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { parseDocxDocument } from '@/modules/knowledge/helpers/docx-parser.helpers';

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const PACKAGE_RELATIONSHIPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELATIONSHIPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
</w:styles>`;

const buildDocx = async (body: string): Promise<Buffer> => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', PACKAGE_RELATIONSHIPS);
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr/></w:body>
</w:document>`,
  );
  zip.file('word/styles.xml', STYLES);
  zip.file('word/_rels/document.xml.rels', DOCUMENT_RELATIONSHIPS);
  return zip.generateAsync({ type: 'nodebuffer' });
};

const input = (bytes: Buffer) => ({
  bytes,
  fileName: 'guide.docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

describe('parseDocxDocument', () => {
  it('converts headings and paragraphs to Markdown', async () => {
    const bytes = await buildDocx(
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Pricing</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t>Gift cards are available.</w:t></w:r></w:p>',
    );

    const result = await parseDocxDocument(input(bytes));

    expect(result.markdown).toContain('# Pricing');
    expect(result.markdown).toContain('Gift cards are available');
    expect(result.warnings).toEqual([]);
  });

  it('rejects an empty document', async () => {
    await expect(parseDocxDocument(input(await buildDocx('')))).rejects.toMatchObject({
      code: DocumentParseErrorCode.Empty,
    });
  });

  it('fails a file that is not a DOCX archive', async () => {
    await expect(parseDocxDocument(input(Buffer.from('not a docx')))).rejects.toMatchObject({
      code: DocumentParseErrorCode.Unreadable,
    });
  });
});
