import { basename, extname } from 'node:path';
import { KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import {
  DOCUMENT_PATH_SEPARATOR,
  DOCUMENT_TITLE_TRUNCATED_MESSAGE,
  DOCUMENT_UNTITLED_TITLE,
  DOCUMENT_WINDOWS_PATH_SEPARATOR,
  DocumentParseWarningCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import type { DocumentTitleResult } from '@/modules/knowledge/typedefs/document-parser.typedefs';

const fileBaseName = (fileName: string): string =>
  basename(fileName.replaceAll(DOCUMENT_WINDOWS_PATH_SEPARATOR, DOCUMENT_PATH_SEPARATOR));

const titleFromFileName = (fileName: string): string => {
  const base = fileBaseName(fileName);
  const extension = extname(base);
  return extension.length === 0 ? base : base.slice(0, -extension.length);
};

export const documentTitle = (fileName: string, explicitTitle?: string): DocumentTitleResult => {
  const candidate = (explicitTitle ?? titleFromFileName(fileName)).trim();
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
