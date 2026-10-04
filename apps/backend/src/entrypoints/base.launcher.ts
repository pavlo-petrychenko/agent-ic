import { EOL } from 'node:os';
import { ExitCode } from '@/entrypoints/launcher.constants';
import { ConfigError } from '@/platform/config/config.error';

export abstract class BaseLauncher {
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

  protected abstract run(): Promise<void>;
}
