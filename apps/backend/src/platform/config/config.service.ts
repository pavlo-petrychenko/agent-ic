import type { AppConfig } from './config.typedefs';

export class ConfigService {
  constructor(readonly config: AppConfig) {}
}
