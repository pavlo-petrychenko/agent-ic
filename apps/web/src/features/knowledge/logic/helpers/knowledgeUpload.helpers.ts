import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import {
  KNOWLEDGE_FILE_BYTES_PER_KILOBYTE,
  KNOWLEDGE_FILE_BYTES_PER_MEGABYTE,
  KNOWLEDGE_FILE_ID_SEPARATOR,
  KNOWLEDGE_FILE_SIZE_DECIMAL_PLACES,
  KNOWLEDGE_UPLOAD_EXTENSIONS,
  KNOWLEDGE_UPLOAD_MIME_TYPES,
  KNOWLEDGE_UPLOAD_UNKNOWN_MIME_TYPE,
  KnowledgeFileSkipReason,
} from '@/features/knowledge/constants/knowledgeUpload.constants';

const FILE_EXTENSION_SEPARATOR = '.';

export const knowledgeFileExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf(FILE_EXTENSION_SEPARATOR);
  return index <= 0 ? '' : fileName.slice(index).toLowerCase();
};

export const knowledgeFileTypeLabel = (fileName: string): string =>
  knowledgeFileExtension(fileName).slice(FILE_EXTENSION_SEPARATOR.length).toUpperCase();

export const knowledgeFileMimeType = (fileName: string): string =>
  KNOWLEDGE_UPLOAD_MIME_TYPES[knowledgeFileExtension(fileName)] ??
  KNOWLEDGE_UPLOAD_UNKNOWN_MIME_TYPE;

export const knowledgeFileId = (file: File): string =>
  [file.name, file.size, file.lastModified].join(KNOWLEDGE_FILE_ID_SEPARATOR);

export const knowledgeFileSkipReason = (file: File): KnowledgeFileSkipReason | null => {
  if (!KNOWLEDGE_UPLOAD_EXTENSIONS.includes(knowledgeFileExtension(file.name))) {
    return KnowledgeFileSkipReason.Unsupported;
  }
  if (file.size <= 0) {
    return KnowledgeFileSkipReason.Empty;
  }
  if (file.size > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
    return KnowledgeFileSkipReason.TooLarge;
  }
  return null;
};

const formatFileSizeValue = (value: number): string =>
  value.toFixed(KNOWLEDGE_FILE_SIZE_DECIMAL_PLACES).replace(/\.0$/, '');

export const formatKnowledgeFileSize = (bytes: number): string => {
  if (bytes < KNOWLEDGE_FILE_BYTES_PER_KILOBYTE) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / KNOWLEDGE_FILE_BYTES_PER_KILOBYTE;
  if (kilobytes < KNOWLEDGE_FILE_BYTES_PER_KILOBYTE) {
    return `${formatFileSizeValue(kilobytes)} KB`;
  }
  return `${formatFileSizeValue(bytes / KNOWLEDGE_FILE_BYTES_PER_MEGABYTE)} MB`;
};
