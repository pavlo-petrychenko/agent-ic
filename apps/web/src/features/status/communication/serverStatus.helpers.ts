import type { ServerStatusQuery } from './serverStatus.generated';
import type { ServerStatus } from './serverStatus.typedefs';

export const toServerStatus = ({ serverStatus }: ServerStatusQuery): ServerStatus => ({
  version: serverStatus.version,
  uptimeSeconds: serverStatus.uptimeSeconds,
});
