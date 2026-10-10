import { describe, expect, it } from 'vitest';
import { agentsHref, workspaceHref } from '@/features/flow-builder/logic/helpers/route.helpers';

describe('route helpers', () => {
  it('links to the workspace and its agents, encoding the id', () => {
    expect(workspaceHref('ws 1')).toBe('/w/ws%201');
    expect(agentsHref('ws_demo')).toBe('/w/ws_demo/agents');
  });
});
