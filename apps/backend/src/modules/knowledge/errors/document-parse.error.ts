import {
  DOCUMENT_PARSE_ERROR_MESSAGE,
  DocumentParseErrorCode,
} from '@/modules/knowledge/constants/document-parser.constants';

export class DocumentParseError extends Error {
  constructor(
    readonly code: DocumentParseErrorCode,
    options: { readonly cause?: unknown } = {},
  ) {
    super(DOCUMENT_PARSE_ERROR_MESSAGE[code], { cause: options.cause });
    this.name = new.target.name;
  }
}
