import type { z } from 'zod';
import {
  CONFIG_ERROR_HEADER,
  CONFIG_ISSUE_LINE_PREFIX,
  CONFIG_ISSUE_LINE_SEPARATOR,
  CONFIG_ISSUE_PATH_SEPARATOR,
  CONFIG_ISSUE_VALUE_SEPARATOR,
} from '@/platform/config/constants/config-issue.constants';
import type { ConfigIssue } from '@/platform/config/typedefs/config-issue.typedefs';

export const toConfigIssues = (error: z.ZodError, prefix = ''): ConfigIssue[] =>
  error.issues.map((issue) => ({
    variable: `${prefix}${issue.path.join(CONFIG_ISSUE_PATH_SEPARATOR)}`,
    message: issue.message,
  }));

export const formatConfigIssues = (issues: readonly ConfigIssue[]): string =>
  [
    CONFIG_ERROR_HEADER,
    ...issues.map(
      (issue) =>
        `${CONFIG_ISSUE_LINE_PREFIX}${issue.variable}${CONFIG_ISSUE_VALUE_SEPARATOR}${issue.message}`,
    ),
  ].join(CONFIG_ISSUE_LINE_SEPARATOR);
