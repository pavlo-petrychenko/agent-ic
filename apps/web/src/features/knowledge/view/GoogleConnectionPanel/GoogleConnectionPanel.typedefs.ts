import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export interface GoogleConnectionPanelProps {
  readonly connections: readonly GoogleConnection[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly errorMessage: string | null;
  readonly starting: boolean;
  readonly disconnectingId: string | null;
  readonly onConnect: () => void;
  readonly onDisconnect: (connection: GoogleConnection) => void;
  readonly onRetry: () => void;
}
