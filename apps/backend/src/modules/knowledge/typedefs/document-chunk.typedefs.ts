export type ChunkBlockKind = 'prose' | 'table' | 'other';

export interface ChunkBlock {
  readonly kind: ChunkBlockKind;
  readonly content: string;
  readonly tokenCount: number;
}

export interface ChunkUnit {
  readonly content: string;
  readonly separator: string;
  readonly prose: boolean;
  readonly tokenCount: number;
}

export interface SectionChunk {
  readonly content: string;
  readonly prose: boolean;
}

export interface ChunkDraft {
  readonly content: string;
  readonly prose: boolean;
  readonly tokenCount: number;
}

export interface DocumentChunk {
  readonly sectionOrdinal: number;
  readonly ordinal: number;
  readonly content: string;
  readonly tokenCount: number;
}
