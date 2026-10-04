import { formatConfigIssues } from '@/platform/config/helpers/config-issue.helpers';
import type { ConfigIssue } from '@/platform/config/typedefs/config-issue.typedefs';

export class ConfigError extends Error {
  constructor(readonly issues: readonly ConfigIssue[]) {
    super(formatConfigIssues(issues));
  }
}
