import type { ServerStatusQuery } from '@/features/status/communication/serverStatus.generated';
import type { ServerStatus } from '@/features/status/communication/serverStatus.typedefs';

export const toServerStatus = ({ serverStatus }: ServerStatusQuery): ServerStatus => ({
  version: serverStatus.version,
  uptimeSeconds: serverStatus.uptimeSeconds,
});
