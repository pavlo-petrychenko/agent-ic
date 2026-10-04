import type { AppConfig } from '@/platform/config/config.typedefs';

export class ConfigService {
  constructor(readonly config: AppConfig) {}
}
