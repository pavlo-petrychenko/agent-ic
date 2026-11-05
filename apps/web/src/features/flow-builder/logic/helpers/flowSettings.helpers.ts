import { UnhandledFailureAction } from '@agent-ic/flow';
import type { FlowDocument, FlowSettings, HandoffSettings } from '@agent-ic/flow';
import { DEFAULT_HANDOFF } from '@/features/flow-builder/constants/nodeTemplate.constants';

export const updateSettings = (
  document: FlowDocument,
  patch: Partial<FlowSettings>,
): FlowDocument => ({ ...document, settings: { ...document.settings, ...patch } });

export const handoffOf = (settings: FlowSettings): HandoffSettings =>
  settings.handoff ?? DEFAULT_HANDOFF;

export const updateHandoff = (
  document: FlowDocument,
  update: (handoff: HandoffSettings) => HandoffSettings,
): FlowDocument => updateSettings(document, { handoff: update(handoffOf(document.settings)) });

export const setUnhandledFailure = (
  document: FlowDocument,
  customerMessage: string | null,
): FlowDocument =>
  updateSettings(document, {
    onUnhandledFailure:
      customerMessage === null ? null : { action: UnhandledFailureAction.Handoff, customerMessage },
  });

export const setAutoClose = (document: FlowDocument, afterMinutes: number | null): FlowDocument =>
  updateSettings(document, { autoClose: afterMinutes === null ? null : { afterMinutes } });
