import type { RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import {
  KNOWLEDGE_CHUNK_MAX_TOKENS,
  KNOWLEDGE_CHUNK_OVERLAP_TOKENS,
  KNOWLEDGE_CHUNK_TARGET_TOKENS,
  KNOWLEDGE_SENTENCE_LOCALE,
  KNOWLEDGE_SMALL_DOCUMENT_MAX_TOKENS,
  KNOWLEDGE_TABLE_HEADER_LINE_COUNT,
  KNOWLEDGE_TABLE_MAX_TOKENS,
} from '@/modules/knowledge/constants/knowledge-chunking.constants';
import {
  splitTextToTokenPieces,
  textTokenCount,
} from '@/modules/knowledge/helpers/document-token.helpers';
import type {
  ChunkBlock,
  ChunkBlockKind,
  ChunkDraft,
  ChunkUnit,
  DocumentChunk,
  SectionChunk,
} from '@/modules/knowledge/typedefs/document-chunk.typedefs';
import type { DocumentSection } from '@/modules/knowledge/typedefs/document-section.typedefs';

const OUTER_BLANK_LINES_PATTERN = /^(?:[ \t]*\n)+|(?:[ \t]*\n)+$/g;
const WORD_SEPARATOR_PATTERN = /\s+/;
const SENTENCE_SEGMENTER = new Intl.Segmenter(KNOWLEDGE_SENTENCE_LOCALE, {
  granularity: 'sentence',
});
const GFM_EXTENSIONS = [gfm()];
const GFM_MDAST_EXTENSIONS = [gfmFromMarkdown()];

const stripOuterBlankLines = (text: string): string => text.replace(OUTER_BLANK_LINES_PATTERN, '');

const sentences = (text: string): string[] =>
  Array.from(SENTENCE_SEGMENTER.segment(text), ({ segment }) => segment.trim()).filter(
    (segment) => segment.length > 0,
  );

const splitWords = (text: string): string[] => {
  const pieces: string[] = [];
  let current = '';
  for (const word of text.split(WORD_SEPARATOR_PATTERN).filter((part) => part.length > 0)) {
    if (textTokenCount(word) > KNOWLEDGE_CHUNK_MAX_TOKENS) {
      if (current.length > 0) {
        pieces.push(current);
        current = '';
      }
      pieces.push(...splitTextToTokenPieces(word, KNOWLEDGE_CHUNK_MAX_TOKENS));
      continue;
    }
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (textTokenCount(candidate) > KNOWLEDGE_CHUNK_MAX_TOKENS && current.length > 0) {
      pieces.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  return current.length === 0 ? pieces : [...pieces, current];
};

const splitProse = (text: string): string[] =>
  sentences(text).flatMap((sentence) =>
    textTokenCount(sentence) <= KNOWLEDGE_CHUNK_MAX_TOKENS ? [sentence] : splitWords(sentence),
  );

const splitLines = (text: string): string[] => {
  const pieces: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    const candidate = current.length === 0 ? line : `${current}\n${line}`;
    if (textTokenCount(candidate) > KNOWLEDGE_CHUNK_MAX_TOKENS && current.length > 0) {
      pieces.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  return current.length === 0 ? pieces : [...pieces, current];
};

const splitOther = (text: string): string[] =>
  splitLines(text).flatMap((piece) =>
    textTokenCount(piece) <= KNOWLEDGE_CHUNK_MAX_TOKENS ? [piece] : splitWords(piece),
  );

const blockFromNode = (markdown: string, node: RootContent): ChunkBlock | null => {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) {
    return null;
  }
  const content = markdown.slice(start, end);
  if (content.trim().length === 0) {
    return null;
  }
  const kind: ChunkBlockKind =
    node.type === 'table' ? 'table' : node.type === 'paragraph' ? 'prose' : 'other';
  return { kind, content, tokenCount: textTokenCount(content) };
};

const sectionBlocks = (markdown: string): ChunkBlock[] => {
  if (markdown.trim().length === 0) {
    return [];
  }
  const blocks = fromMarkdown(markdown, {
    extensions: GFM_EXTENSIONS,
    mdastExtensions: GFM_MDAST_EXTENSIONS,
  }).children.flatMap((node) => {
    const block = blockFromNode(markdown, node);
    return block === null ? [] : [block];
  });
  if (blocks.length > 0) {
    return blocks;
  }
  const content = stripOuterBlankLines(markdown);
  return [{ kind: 'prose', content, tokenCount: textTokenCount(content) }];
};

const blockUnits = (block: ChunkBlock): ChunkUnit[] => {
  if (block.tokenCount <= KNOWLEDGE_CHUNK_MAX_TOKENS) {
    return [
      {
        content: block.content,
        separator: '\n\n',
        prose: block.kind === 'prose',
        tokenCount: block.tokenCount,
      },
    ];
  }
  if (block.kind === 'prose') {
    return splitProse(block.content).map((content, index) => ({
      content,
      separator: index === 0 ? '\n\n' : ' ',
      prose: true,
      tokenCount: textTokenCount(content),
    }));
  }
  return splitOther(block.content).map((content, index) => ({
    content,
    separator: index === 0 ? '\n\n' : '\n',
    prose: false,
    tokenCount: textTokenCount(content),
  }));
};

const tablePieces = (table: string): string[] => {
  const content = table.trim();
  if (textTokenCount(content) <= KNOWLEDGE_TABLE_MAX_TOKENS) {
    return [content];
  }
  const lines = content.split('\n');
  if (lines.length <= KNOWLEDGE_TABLE_HEADER_LINE_COUNT) {
    return [content];
  }
  const header = lines.slice(0, KNOWLEDGE_TABLE_HEADER_LINE_COUNT).join('\n');
  const rows = lines.slice(KNOWLEDGE_TABLE_HEADER_LINE_COUNT);
  const pieces: string[] = [];
  let current = header;
  let currentRows = 0;
  for (const row of rows) {
    const candidate = `${current}\n${row}`;
    if (textTokenCount(candidate) > KNOWLEDGE_CHUNK_MAX_TOKENS && currentRows > 0) {
      pieces.push(current);
      current = `${header}\n${row}`;
      currentRows = 1;
    } else {
      current = candidate;
      currentRows += 1;
    }
  }
  const built = currentRows === 0 ? [content] : [...pieces, current];
  return built.flatMap((piece) =>
    textTokenCount(piece) <= KNOWLEDGE_CHUNK_MAX_TOKENS ? [piece] : splitOther(piece),
  );
};

const overlapSuffix = (text: string): string => {
  const selected: string[] = [];
  const parts = sentences(text);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = [parts[index] ?? '', ...selected].join(' ');
    if (textTokenCount(candidate) > KNOWLEDGE_CHUNK_OVERLAP_TOKENS) {
      break;
    }
    selected.unshift(parts[index] ?? '');
  }
  return selected.join(' ');
};

const buildSectionChunks = (markdown: string): SectionChunk[] => {
  const chunks: SectionChunk[] = [];
  let current: ChunkDraft | null = null;
  let lastProseContent: string | null = null;

  const emit = (content: string, prose: boolean): void => {
    const normalized = stripOuterBlankLines(content);
    if (normalized.trim().length === 0) {
      return;
    }
    chunks.push({ content: normalized, prose, tokenCount: textTokenCount(normalized) });
    lastProseContent = prose ? normalized : null;
  };

  const flush = (): void => {
    if (current !== null) {
      emit(current.content, current.prose);
      current = null;
    }
  };

  const append = (unit: ChunkUnit): boolean => {
    if (current === null) {
      return false;
    }
    const content = `${current.content}${unit.separator}${unit.content}`;
    const tokenCount = textTokenCount(content);
    if (tokenCount > KNOWLEDGE_CHUNK_MAX_TOKENS) {
      return false;
    }
    current = {
      content,
      prose: current.prose && unit.prose,
      tokenCount,
    };
    return true;
  };

  const startWithOverlap = (unit: ChunkUnit): boolean => {
    if (!unit.prose || lastProseContent === null) {
      return false;
    }
    const overlap = overlapSuffix(lastProseContent);
    if (overlap.length === 0) {
      return false;
    }
    const content = `${overlap}${unit.separator}${unit.content}`;
    const tokenCount = textTokenCount(content);
    if (tokenCount > KNOWLEDGE_CHUNK_MAX_TOKENS) {
      return false;
    }
    current = { content, prose: true, tokenCount };
    return true;
  };

  for (const block of sectionBlocks(markdown)) {
    if (block.kind === 'table') {
      flush();
      for (const piece of tablePieces(block.content)) {
        emit(piece, false);
      }
      continue;
    }
    for (const unit of blockUnits(block)) {
      if (current !== null && current.tokenCount >= KNOWLEDGE_CHUNK_TARGET_TOKENS) {
        flush();
      }
      if (append(unit)) {
        if (current !== null && current.tokenCount >= KNOWLEDGE_CHUNK_TARGET_TOKENS) {
          flush();
        }
        continue;
      }
      flush();
      if (!startWithOverlap(unit)) {
        current = {
          content: unit.content,
          prose: unit.prose,
          tokenCount: unit.tokenCount,
        };
      }
      if (current !== null && current.tokenCount >= KNOWLEDGE_CHUNK_TARGET_TOKENS) {
        flush();
      }
    }
  }
  flush();
  return chunks;
};

const toDocumentChunk = (
  section: DocumentSection,
  chunk: SectionChunk,
  ordinal: number,
): DocumentChunk => ({
  sectionOrdinal: section.ordinal,
  ordinal,
  content: chunk.content,
  tokenCount: chunk.tokenCount,
});

export const buildDocumentChunks = (sections: readonly DocumentSection[]): DocumentChunk[] => {
  if (sections.length === 1) {
    const [section] = sections;
    if (
      section !== undefined &&
      section.tokenCount <= KNOWLEDGE_SMALL_DOCUMENT_MAX_TOKENS &&
      section.content.trim().length > 0
    ) {
      return [
        toDocumentChunk(
          section,
          {
            content: stripOuterBlankLines(section.content),
            prose: true,
            tokenCount: textTokenCount(stripOuterBlankLines(section.content)),
          },
          0,
        ),
      ];
    }
  }

  const chunks: DocumentChunk[] = [];
  for (const section of sections) {
    for (const chunk of buildSectionChunks(section.content)) {
      chunks.push(toDocumentChunk(section, chunk, chunks.length));
    }
  }
  return chunks;
};
