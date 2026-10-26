export interface DocumentSection {
  readonly ordinal: number;
  readonly level: number;
  readonly path: string;
  readonly heading: string | null;
  readonly content: string;
  readonly tokenCount: number;
  readonly contentHash: string;
}
