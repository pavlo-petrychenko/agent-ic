import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export interface GoogleConnectionAccountProps {
  readonly connection: GoogleConnection;
  readonly starting: boolean;
  readonly disconnecting: boolean;
  readonly disconnectDisabled: boolean;
  readonly onConnect: () => void;
  readonly onDisconnect: (connection: GoogleConnection) => void;
}
