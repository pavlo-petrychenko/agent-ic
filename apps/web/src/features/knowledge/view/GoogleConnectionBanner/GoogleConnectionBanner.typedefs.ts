import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export interface GoogleConnectionBannerProps {
  readonly connections: readonly GoogleConnection[];
  readonly reconnecting: boolean;
  readonly onReconnect: (() => void) | null;
}
