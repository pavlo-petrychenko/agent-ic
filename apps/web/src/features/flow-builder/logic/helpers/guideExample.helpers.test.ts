import { Locale } from '@agent-ic/contracts';
import { AgentTemplateKey, AgentTemplateKind, NodeType, agentTemplate } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { GUIDES, GuideType } from '@/features/flow-builder/constants/guide.constants';
import { buildGuideExample } from '@/features/flow-builder/logic/helpers/guideExample.helpers';

const NODE_TYPES = GUIDES.flatMap((guide) =>
  guide.type === GuideType.Component ? [guide.nodeType] : [],
);

describe('buildGuideExample', () => {
  it.each(NODE_TYPES)('gives %s a snippet that shows the step', (nodeType) => {
    const example = buildGuideExample(nodeType, Locale.En);

    expect(example).not.toBeNull();
    expect(example && agentTemplate(example.key).kind).toBe(AgentTemplateKind.Snippet);
    expect(example?.graph.nodes.some((node) => node.highlighted)).toBe(true);
  });

  it('has no example for a step that no snippet uses', () => {
    expect(buildGuideExample(NodeType.TriggerExternalEvent, Locale.En)).toBeNull();
  });

  it('picks the snippet with the fewest steps', () => {
    const example = buildGuideExample(NodeType.Parallel, Locale.En);

    expect(example?.key).toBe(AgentTemplateKey.BackgroundReview);
    expect(example?.graph.nodes).toHaveLength(7);
  });

  it('highlights only the nodes of the step', () => {
    const example = buildGuideExample(NodeType.Escalation, Locale.En);

    const highlighted = example?.graph.nodes.filter((node) => node.highlighted) ?? [];
    expect(highlighted.length).toBeGreaterThan(0);
    expect(highlighted.length).toBeLessThan(example?.graph.nodes.length ?? 0);
  });

  it('lists the big templates that use the step', () => {
    const example = buildGuideExample(NodeType.Parallel, Locale.En);

    expect(example?.alsoIn).toEqual([
      { key: AgentTemplateKey.StoreSales, name: 'Online store sales assistant' },
    ]);
  });

  it('writes the names and labels in the given locale', () => {
    const en = buildGuideExample(NodeType.Escalation, Locale.En);
    const uk = buildGuideExample(NodeType.Escalation, Locale.Uk);

    expect(uk?.name).not.toBe(en?.name);
    expect(uk?.graph.nodes.map((node) => node.label)).not.toEqual(
      en?.graph.nodes.map((node) => node.label),
    );
  });
});
