import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import type {
  DocumentParseInput,
  RawDocumentParseResult,
} from '@/modules/knowledge/typedefs/document-parser.typedefs';

const decodeUtf8 = (bytes: Buffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    throw new DocumentParseError(DocumentParseErrorCode.Unreadable, { cause: error });
  }
};

export const parseTextDocument = async (
  input: DocumentParseInput,
): Promise<RawDocumentParseResult> => {
  const markdown = decodeUtf8(input.bytes);
  if (markdown.trim().length === 0) {
    throw new DocumentParseError(DocumentParseErrorCode.Empty);
  }
  return { markdown, warnings: [] };
};
