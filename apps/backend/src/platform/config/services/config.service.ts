import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';

export class ConfigService {
  constructor(readonly config: AppConfig) {}
}
