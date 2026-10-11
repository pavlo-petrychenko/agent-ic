import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNodeInspection } from '@/features/testing/logic/hooks/useNodeInspection';

describe('useNodeInspection', () => {
  it('inspects a node of the selected turn and lets it go', () => {
    const { result } = renderHook(() => useNodeInspection('run_1'));

    act(() => result.current.selectNode('node_reply'));
    expect(result.current.selectedNodeId).toBe('node_reply');

    act(() => result.current.selectNode(null));
    expect(result.current.selectedNodeId).toBeNull();
  });

  it('forgets the node when another turn is selected', () => {
    const { result, rerender } = renderHook(({ runId }) => useNodeInspection(runId), {
      initialProps: { runId: 'run_1' },
    });

    act(() => result.current.selectNode('node_reply'));
    rerender({ runId: 'run_2' });

    expect(result.current.selectedNodeId).toBeNull();
  });
});
