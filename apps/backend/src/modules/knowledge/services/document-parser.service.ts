import { KNOWLEDGE_DOCUMENT_MAX_BYTES, KnowledgeDocumentFormat } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { canonicalizeMarkdown } from '@/modules/knowledge/helpers/canonical-markdown.helpers';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import {
  documentBytesMatchFormat,
  resolveDocumentFormat,
} from '@/modules/knowledge/helpers/document-format.helpers';
import { documentTitle } from '@/modules/knowledge/helpers/document-title.helpers';
import { documentTokenCount } from '@/modules/knowledge/helpers/document-token.helpers';
import { parseDocxDocument } from '@/modules/knowledge/helpers/docx-parser.helpers';
import { parsePdfDocument } from '@/modules/knowledge/helpers/pdf-parser.helpers';
import { parseTextDocument } from '@/modules/knowledge/helpers/text-parser.helpers';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '@/modules/knowledge/typedefs/document-parser.typedefs';

const PARSERS: Readonly<Record<KnowledgeDocumentFormat, DocumentParser>> = {
  [KnowledgeDocumentFormat.Pdf]: parsePdfDocument,
  [KnowledgeDocumentFormat.Docx]: parseDocxDocument,
  [KnowledgeDocumentFormat.Txt]: parseTextDocument,
  [KnowledgeDocumentFormat.Markdown]: parseTextDocument,
};

@Injectable()
export class DocumentParserService {
  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    if (input.bytes.byteLength > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
      throw new DocumentParseError(DocumentParseErrorCode.TooLarge);
    }
    const format = resolveDocumentFormat(input.fileName, input.mimeType);
    if (!documentBytesMatchFormat(format, input.bytes)) {
      throw new DocumentParseError(DocumentParseErrorCode.SignatureMismatch);
    }
    const parsed = await PARSERS[format](input);
    const markdown = canonicalizeMarkdown(parsed.markdown);
    if (markdown.length === 0) {
      throw new DocumentParseError(DocumentParseErrorCode.Empty);
    }
    const title = documentTitle(input.fileName, input.title);
    return {
      title: title.title,
      markdown,
      contentHash: contentHash(markdown),
      tokenCount: documentTokenCount(markdown),
      warnings: [...title.warnings, ...parsed.warnings],
    };
  }
}
