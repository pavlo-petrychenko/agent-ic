import { AgentTemplateKey } from '@agent-ic/flow';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTemplateSetup } from '@/features/agents/logic/hooks/useTemplateSetup';

describe('useTemplateSetup', () => {
  it('starts with the default name and no knowledge bases', () => {
    const { result } = renderHook(() => useTemplateSetup(AgentTemplateKey.CafeSupport, 'Café'));

    expect(result.current.name).toBe('Café');
    expect(result.current.knowledgeBaseIds).toEqual([]);
  });

  it('keeps what the user typed and picked', () => {
    const { result } = renderHook(() => useTemplateSetup(AgentTemplateKey.CafeSupport, 'Café'));

    act(() => result.current.setName('My café'));
    act(() => result.current.setKnowledgeBaseIds(['kbs_1']));

    expect(result.current.name).toBe('My café');
    expect(result.current.knowledgeBaseIds).toEqual(['kbs_1']);
  });

  it('starts again when another template is picked', () => {
    const { result, rerender } = renderHook(({ key, name }) => useTemplateSetup(key, name), {
      initialProps: { key: AgentTemplateKey.CafeSupport, name: 'Café' },
    });

    act(() => result.current.setName('My café'));
    act(() => result.current.setKnowledgeBaseIds(['kbs_1']));
    rerender({ key: AgentTemplateKey.StoreSales, name: 'Store' });

    expect(result.current.name).toBe('Store');
    expect(result.current.knowledgeBaseIds).toEqual([]);
  });

  it('follows the default name while the user has not typed', () => {
    const { result, rerender } = renderHook(
      ({ name }) => useTemplateSetup(AgentTemplateKey.CafeSupport, name),
      { initialProps: { name: 'Café' } },
    );

    rerender({ name: 'Кафе' });

    expect(result.current.name).toBe('Кафе');
  });

  it('ignores changes while no template is picked', () => {
    const { result } = renderHook(() => useTemplateSetup(null, ''));

    act(() => result.current.setName('Nothing'));

    expect(result.current.name).toBe('');
  });
});
