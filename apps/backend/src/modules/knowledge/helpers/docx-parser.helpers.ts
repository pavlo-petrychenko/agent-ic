import mammoth from 'mammoth';
import {
  DOCX_EMPTY_IMAGE_PATTERN,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import type {
  DocumentParseInput,
  RawDocumentParseResult,
} from '@/modules/knowledge/typedefs/document-parser.typedefs';

interface MammothMarkdownConverter {
  readonly convertToMarkdown: (
    input: Parameters<typeof mammoth.convertToHtml>[0],
    options?: Parameters<typeof mammoth.convertToHtml>[1],
  ) => ReturnType<typeof mammoth.convertToHtml>;
}

const converter = mammoth as typeof mammoth & MammothMarkdownConverter;
const emptyImage = mammoth.images.imgElement(async () => ({ src: '' }));

export const parseDocxDocument = async (
  input: DocumentParseInput,
): Promise<RawDocumentParseResult> => {
  let result: Awaited<ReturnType<typeof converter.convertToMarkdown>>;
  try {
    result = await converter.convertToMarkdown(
      { buffer: input.bytes },
      { convertImage: emptyImage },
    );
  } catch (error) {
    throw DocumentParseError.unreadable(error);
  }

  return {
    markdown: result.value.replace(DOCX_EMPTY_IMAGE_PATTERN, ''),
    warnings: result.messages
      .filter((message) => message.type === 'warning')
      .map((message) => ({
        code: DocumentParseWarningCode.DocxConversion,
        message: message.message,
      })),
  };
};
