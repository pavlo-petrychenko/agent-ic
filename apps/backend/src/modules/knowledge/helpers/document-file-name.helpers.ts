import { basename, extname } from 'node:path';
import {
  DOCUMENT_PATH_SEPARATOR,
  DOCUMENT_WINDOWS_PATH_SEPARATOR,
} from '@/modules/knowledge/constants/document-parser.constants';
import type { DocumentFileName } from '@/modules/knowledge/typedefs/document-parser.typedefs';

export const documentFileName = (fileName: string): DocumentFileName => {
  const baseName = basename(
    fileName.replaceAll(DOCUMENT_WINDOWS_PATH_SEPARATOR, DOCUMENT_PATH_SEPARATOR),
  );
  const extension = extname(baseName);
  return {
    baseName,
    extension: extension.toLowerCase(),
    stem: extension.length === 0 ? baseName : baseName.slice(0, -extension.length),
  };
};
