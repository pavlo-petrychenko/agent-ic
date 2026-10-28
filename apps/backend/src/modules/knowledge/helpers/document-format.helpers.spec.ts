import { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { resolveDocumentFormat } from '@/modules/knowledge/helpers/document-format.helpers';

const failureOf = (action: () => unknown): unknown => {
  try {
    action();
    return null;
  } catch (error) {
    return error;
  }
};

describe('resolveDocumentFormat', () => {
  it('reads every supported extension', () => {
    expect(resolveDocumentFormat('guide.pdf', 'application/pdf')).toBe(KnowledgeDocumentFormat.Pdf);
    expect(resolveDocumentFormat('guide.docx', 'application/octet-stream')).toBe(
      KnowledgeDocumentFormat.Docx,
    );
    expect(resolveDocumentFormat('guide.txt', 'text/plain')).toBe(KnowledgeDocumentFormat.Txt);
    expect(resolveDocumentFormat('GUIDE.MD', 'text/plain')).toBe(KnowledgeDocumentFormat.Markdown);
  });

  it('falls back to the MIME type when the extension is unknown', () => {
    expect(
      resolveDocumentFormat(
        'guide',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(KnowledgeDocumentFormat.Docx);
  });

  it('takes the extension over a generic MIME type', () => {
    expect(resolveDocumentFormat('guide.md', 'text/plain')).toBe(KnowledgeDocumentFormat.Markdown);
  });

  it('reads a MIME type with parameters and spaces', () => {
    expect(resolveDocumentFormat('guide', ' application/pdf ; charset=binary')).toBe(
      KnowledgeDocumentFormat.Pdf,
    );
  });

  it('rejects a file that is neither a known extension nor a known MIME type', () => {
    const failure = failureOf(() => resolveDocumentFormat('guide.doc', 'application/msword'));

    expect(failure).toBeInstanceOf(DocumentParseError);
    expect(failure).toMatchObject({ code: DocumentParseErrorCode.UnsupportedType });
  });
});
