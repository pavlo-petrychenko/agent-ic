import { EOL } from 'node:os';

import { ConfigError } from '@/platform/config/config.error';
import { ConfigLoader } from '@/platform/config/config.loader';
import { TracingService } from '@/platform/observability/tracing/tracing.service';

import { ExitCode } from './launcher.constants';

export class ApplicationLauncher {
  constructor(
    private readonly argv: readonly string[],
    private readonly configLoader: ConfigLoader = new ConfigLoader(),
  ) {}

  async launch(): Promise<void> {
    try {
      await this.run();
    } catch (error) {
      if (!(error instanceof ConfigError)) {
        throw error;
      }
      process.stderr.write(`${error.message}${EOL}`);
      process.exitCode = ExitCode.InvalidConfig;
    }
  }

  private async run(): Promise<void> {
    const config = this.configLoader.load(this.argv);
    const tracing = new TracingService(config.telemetry);
    tracing.start();

    const { ApplicationFactory } = await import('./application.factory');
    await new ApplicationFactory(config, tracing).start();
  }
}
