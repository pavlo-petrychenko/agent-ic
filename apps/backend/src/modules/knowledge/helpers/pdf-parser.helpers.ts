import { extractText } from 'unpdf';
import {
  PDF_PAGE_SEPARATOR,
  PDF_PAGES_WITHOUT_TEXT_MESSAGE,
  DocumentParseErrorCode,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import type {
  DocumentParseInput,
  RawDocumentParseResult,
} from '@/modules/knowledge/typedefs/document-parser.typedefs';

export const parsePdfDocument = async (
  input: DocumentParseInput,
): Promise<RawDocumentParseResult> => {
  let pages: readonly string[];
  try {
    const extracted = await extractText(new Uint8Array(input.bytes), { mergePages: false });
    pages = extracted.text;
  } catch (error) {
    throw DocumentParseError.unreadable(error);
  }

  const textPages = pages.map((page) => page.trim()).filter((page) => page.length > 0);
  if (textPages.length === 0) {
    throw new DocumentParseError(DocumentParseErrorCode.PdfHasNoText);
  }

  const emptyPages = pages.length - textPages.length;
  return {
    markdown: textPages.join(PDF_PAGE_SEPARATOR),
    warnings:
      emptyPages === 0
        ? []
        : [
            {
              code: DocumentParseWarningCode.PdfPagesWithoutText,
              message: PDF_PAGES_WITHOUT_TEXT_MESSAGE,
            },
          ],
  };
};
