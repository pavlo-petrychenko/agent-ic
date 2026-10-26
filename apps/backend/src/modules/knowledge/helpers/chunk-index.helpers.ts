import {
  KNOWLEDGE_CHUNK_INDEX_MISSING_SECTION_MESSAGE,
  KNOWLEDGE_CHUNK_INDEX_SEPARATOR,
} from '@/modules/knowledge/constants/knowledge-chunk-index.constants';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import type {
  ChunkIndexInput,
  IndexedDocumentChunk,
} from '@/modules/knowledge/typedefs/chunk-index.typedefs';

const indexText = (
  title: string,
  sectionPath: string,
  summary: string | null,
  content: string,
): string =>
  [title.trim(), sectionPath.trim(), summary?.trim() ?? '', content]
    .filter((part) => part.length > 0)
    .join(KNOWLEDGE_CHUNK_INDEX_SEPARATOR);

export const buildIndexedChunks = (input: ChunkIndexInput): IndexedDocumentChunk[] => {
  const sections = new Map(input.sections.map((section) => [section.ordinal, section]));
  return input.chunks.map((chunk) => {
    const section = sections.get(chunk.sectionOrdinal);
    if (section === undefined) {
      throw new Error(KNOWLEDGE_CHUNK_INDEX_MISSING_SECTION_MESSAGE);
    }
    const indexTextValue = indexText(
      input.title,
      section.path,
      input.summary ?? null,
      chunk.content,
    );
    return {
      ...chunk,
      indexText: indexTextValue,
      contentHash: contentHash(indexTextValue),
    };
  });
};
