import type { Notice } from 'postgres';

export interface DatabaseClientOptions {
  readonly url: string;
  readonly poolMax: number;
}

export type NoticeHandler = (notice: Notice) => void;
