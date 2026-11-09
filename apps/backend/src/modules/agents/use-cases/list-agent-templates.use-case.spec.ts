import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import {
  AgentTemplateKey,
  AgentTemplateKind,
  agentTemplate,
  agentTemplateNodeTypes,
  agentTemplates,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ListAgentTemplatesUseCase } from '@/modules/agents/use-cases/list-agent-templates.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';

const WORKSPACE_ID = '01960000-0000-7000-8000-0000000a91e7';
const TEMPLATE_KEYS = [AgentTemplateKey.CafeSupport, AgentTemplateKey.StoreSales];

const builderCtx = (locale: Locale = Locale.En) => ({
  ...workspaceCtx(TEST_EDITOR_ID, WORKSPACE_ID, WorkspaceRole.Builder),
  locale,
});

describe('ListAgentTemplatesUseCase', () => {
  const listTemplates = new ListAgentTemplatesUseCase();

  it('lists the two big templates for the template kind', () => {
    const listed = listTemplates.execute(builderCtx(), { kind: AgentTemplateKind.Template });

    expect(listed.map((template) => template.key)).toEqual(TEMPLATE_KEYS);
  });

  it('lists every entry in catalog order when no kind is given', () => {
    const listed = listTemplates.execute(builderCtx(), { kind: null });

    expect(listed.map((template) => template.key)).toEqual(
      agentTemplates.map((template) => template.key),
    );
    expect(listed.slice(0, TEMPLATE_KEYS.length).map((template) => template.key)).toEqual(
      TEMPLATE_KEYS,
    );
  });

  it('gives the texts in the request locale and the node types', () => {
    const [cafe] = listTemplates.execute(builderCtx(Locale.Uk), {
      kind: AgentTemplateKind.Template,
    });

    const expected = agentTemplate(AgentTemplateKey.CafeSupport);
    expect(cafe).toEqual({
      key: expected.key,
      kind: expected.kind,
      category: expected.category,
      level: expected.level,
      name: expected.name.uk,
      description: expected.description.uk,
      highlights: expected.highlights.map((highlight) => highlight.uk),
      usesKnowledge: true,
      nodeTypes: agentTemplateNodeTypes(AgentTemplateKey.CafeSupport),
    });
  });

  it('denies a member without access to agents', () => {
    const operator = workspaceCtx(TEST_EDITOR_ID, WORKSPACE_ID, WorkspaceRole.Operator);

    expect(() => listTemplates.execute(operator, {})).toThrow(PermissionDeniedError);
  });
});
