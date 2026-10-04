import { EOL } from 'node:os';
import { ExitCode } from '@/app/constants/command.constants';
import { ConfigError } from '@/platform/config/errors/config.error';

export abstract class BaseCommand {
  async execute(): Promise<void> {
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
