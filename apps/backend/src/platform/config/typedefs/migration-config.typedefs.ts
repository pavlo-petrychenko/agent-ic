import type { LogLevel } from '@/platform/config/constants/log-level.constants';

export interface MigrationConfig {
  readonly logLevel: LogLevel;
  readonly ownerUrl: string;
}
