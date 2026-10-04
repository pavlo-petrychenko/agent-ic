import { formatConfigIssues } from '@/platform/config/config.helpers';
import type { ConfigIssue } from '@/platform/config/config.typedefs';

export class ConfigError extends Error {
  constructor(readonly issues: readonly ConfigIssue[]) {
    super(formatConfigIssues(issues));
  }
}
