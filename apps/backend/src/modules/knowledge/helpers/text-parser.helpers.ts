import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import type {
  DocumentParseInput,
  RawDocumentParseResult,
} from '@/modules/knowledge/typedefs/document-parser.typedefs';

const decodeUtf8 = (bytes: Buffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    throw DocumentParseError.unreadable(error);
  }
};

export const parseTextDocument = async (
  input: DocumentParseInput,
): Promise<RawDocumentParseResult> => ({
  markdown: decodeUtf8(input.bytes),
  warnings: [],
});
