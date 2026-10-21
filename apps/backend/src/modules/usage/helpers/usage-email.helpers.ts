import type { ReactElement } from 'react';
import { actionEmailElement } from '@/modules/notifications';
import type { ActionEmailCopy } from '@/modules/notifications';
import {
  USAGE_SETTINGS_PATH_PREFIX,
  USAGE_SETTINGS_PATH_SUFFIX,
  USAGE_THRESHOLD_EMAIL_COPY,
  WORKSPACE_PLACEHOLDER,
} from '@/modules/usage/constants/usage-email.constants';
import type { UsageThresholdEmailProps } from '@/modules/usage/typedefs/usage-email.typedefs';

export const usageSettingsLink = (publicUrl: string, publicWorkspaceId: string): string =>
  new URL(
    `${USAGE_SETTINGS_PATH_PREFIX}${publicWorkspaceId}${USAGE_SETTINGS_PATH_SUFFIX}`,
    publicUrl,
  ).toString();

export const usageThresholdEmailCopy = (props: UsageThresholdEmailProps): ActionEmailCopy => {
  const copy = USAGE_THRESHOLD_EMAIL_COPY[props.recipient.locale][props.threshold];
  const workspace = props.recipient.workspaceName;
  return {
    ...copy,
    subject: copy.subject.replaceAll(WORKSPACE_PLACEHOLDER, workspace),
    body: copy.body.replaceAll(WORKSPACE_PLACEHOLDER, workspace),
  };
};

export const usageThresholdEmailElement = (
  props: UsageThresholdEmailProps,
  copy: ActionEmailCopy,
): ReactElement =>
  actionEmailElement(copy, {
    locale: props.recipient.locale,
    name: props.recipient.name,
    link: props.link,
  });
