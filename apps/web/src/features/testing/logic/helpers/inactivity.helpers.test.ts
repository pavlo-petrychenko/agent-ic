import { FLOW_SCHEMA_VERSION, NO_FLOW_SETTINGS } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { InactivityAction } from '@/features/testing/constants/inactivity.constants';
import { nextInactivity } from '@/features/testing/logic/helpers/inactivity.helpers';

const flow = (settings: FlowDocument['settings']): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings,
  nodes: [],
  edges: [],
});

describe('nextInactivity', () => {
  it('closes the chat when the flow closes inactive conversations', () => {
    expect(
      nextInactivity(flow({ ...NO_FLOW_SETTINGS, autoClose: { afterMinutes: 1440 } })),
    ).toEqual({ action: InactivityAction.AutoClose, afterMinutes: 1440 });
  });

  it('has nothing to simulate without auto-close or a flow', () => {
    expect(nextInactivity(flow(NO_FLOW_SETTINGS))).toBeNull();
    expect(nextInactivity(null)).toBeNull();
  });
});
