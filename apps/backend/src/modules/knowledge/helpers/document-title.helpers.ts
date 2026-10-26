import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import {
  DOCUMENT_TITLE_TRUNCATED_MESSAGE,
  DOCUMENT_UNTITLED_TITLE,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';
import type { DocumentTitleResult } from '@/modules/knowledge/typedefs/document-parser.typedefs';

export const documentTitle = (fileName: string, explicitTitle?: string): DocumentTitleResult => {
  const candidate = (explicitTitle ?? documentFileName(fileName).stem).trim();
  const title = candidate.length === 0 ? DOCUMENT_UNTITLED_TITLE : candidate;
  const characters = Array.from(title);
  if (characters.length <= KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH) {
    return { title, warnings: [] };
  }
  return {
    title: characters.slice(0, KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH).join(''),
    warnings: [
      {
        code: DocumentParseWarningCode.TitleTruncated,
        message: DOCUMENT_TITLE_TRUNCATED_MESSAGE,
      },
    ],
  };
};
