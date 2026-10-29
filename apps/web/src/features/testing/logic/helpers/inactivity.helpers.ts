import type { FlowDocument } from '@agent-ic/flow';
import { InactivityAction } from '@/features/testing/constants/inactivity.constants';
import type { NextInactivity } from '@/features/testing/typedefs/inactivity.typedefs';

export const nextInactivity = (flow: FlowDocument | null): NextInactivity | null => {
  const autoClose = flow?.settings.autoClose ?? null;
  return autoClose === null
    ? null
    : { action: InactivityAction.AutoClose, afterMinutes: autoClose.afterMinutes };
};
