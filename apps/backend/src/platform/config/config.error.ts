import { formatConfigIssues } from './config.helpers';
import type { ConfigIssue } from './config.typedefs';

export class ConfigError extends Error {
  constructor(readonly issues: readonly ConfigIssue[]) {
    super(formatConfigIssues(issues));
  }
}
