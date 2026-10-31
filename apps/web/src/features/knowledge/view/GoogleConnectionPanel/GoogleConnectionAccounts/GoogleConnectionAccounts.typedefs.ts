import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export interface GoogleConnectionAccountsProps {
  readonly connections: readonly GoogleConnection[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly starting: boolean;
  readonly disconnectingId: string | null;
  readonly pickingConnectionId: string | null;
  readonly onConnect: () => void;
  readonly onDisconnect: (connection: GoogleConnection) => void;
  readonly onPick: (connection: GoogleConnection) => void;
  readonly onRetry: () => void;
}
