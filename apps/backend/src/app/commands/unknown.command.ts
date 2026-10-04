import { BaseCommand } from '@/app/commands/base.command';
import { ConfigError } from '@/platform/config/errors/config.error';
import type { ConfigIssue } from '@/platform/config/typedefs/config-issue.typedefs';

export class UnknownCommand extends BaseCommand {
  constructor(private readonly issues: readonly ConfigIssue[]) {
    super();
  }

  protected run(): Promise<void> {
    return Promise.reject(new ConfigError(this.issues));
  }
}
