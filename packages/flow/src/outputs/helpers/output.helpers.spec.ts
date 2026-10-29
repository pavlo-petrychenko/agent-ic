import { describe, expect, it } from 'vitest';
import { AgentExitKind } from '@flow/nodes/constants/step.constants';
import {
  AGENT_MESSAGES_FIELD_NAME,
  AGENT_OUTCOME_CONTINUE,
  AGENT_OUTCOME_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  OutputFieldType,
} from '@flow/outputs/constants/output.constants';
import {
  nodeOutputFields,
  outputFieldTypes,
  outputToZod,
} from '@flow/outputs/helpers/output.helpers';
import {
  agent,
  completion,
  field,
  router,
  withExits,
} from '@test/support/fixtures/flow-builder.fixture';

describe('nodeOutputFields', () => {
  it('puts the built-in messages field first on an agent', () => {
    const names = nodeOutputFields(agent('answer', [field('intent')])).map((output) => output.name);
    expect(names).toEqual([AGENT_MESSAGES_FIELD_NAME, 'intent']);
  });

  it('adds the outcome and its reason next to messages while an exit is on', () => {
    const node = withExits(agent('answer', [field('intent')]), { end: { when: 'Done' } });

    expect(nodeOutputFields(node)).toEqual([
      expect.objectContaining({ name: AGENT_MESSAGES_FIELD_NAME }),
      {
        name: AGENT_OUTCOME_FIELD_NAME,
        type: OutputFieldType.Enum,
        description: '',
        required: true,
        values: [AGENT_OUTCOME_CONTINUE, AgentExitKind.End],
      },
      expect.objectContaining({
        name: AGENT_OUTCOME_REASON_FIELD_NAME,
        type: OutputFieldType.String,
        required: true,
      }),
      expect.objectContaining({ name: 'intent' }),
    ]);
  });

  it('lists every exit that is on as an outcome value', () => {
    const node = withExits(agent('answer'), {
      end: { when: 'Done' },
      handoff: { when: 'Asks for a person' },
    });

    expect(
      outputToZod(nodeOutputFields(node)).shape[AGENT_OUTCOME_FIELD_NAME]?.safeParse(
        AgentExitKind.Handoff,
      ).success,
    ).toBe(true);
    expect(nodeOutputFields(node)[1]).toMatchObject({
      values: [AGENT_OUTCOME_CONTINUE, AgentExitKind.End, AgentExitKind.Handoff],
    });
  });

  it('gives a completion its own fields and a router none', () => {
    expect(nodeOutputFields(completion('guard'))).toHaveLength(1);
    expect(nodeOutputFields(router('route', []))).toEqual([]);
  });
});

describe('outputFieldTypes', () => {
  it('maps each field name to its type', () => {
    const node = agent('answer', [
      field('score', OutputFieldType.Number),
      field('intent', OutputFieldType.Enum),
    ]);
    expect(outputFieldTypes(node)).toEqual({
      messages: OutputFieldType.StringList,
      score: OutputFieldType.Number,
      intent: OutputFieldType.Enum,
    });
  });
});

describe('outputToZod', () => {
  const schema = outputToZod([
    field('needs_human', OutputFieldType.Boolean),
    field('reason', OutputFieldType.String, false),
    field('score', OutputFieldType.Number),
    field('intent', OutputFieldType.Enum),
    field('tags', OutputFieldType.StringList),
  ]);

  it('accepts a reply that fits the fields', () => {
    expect(
      schema.safeParse({ needs_human: true, score: 3, intent: 'a', tags: ['x'] }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ needs_human: false, reason: 'ok', score: 1, intent: 'b', tags: [] })
        .success,
    ).toBe(true);
  });

  it('rejects a missing required field, a wrong type and an unknown enum value', () => {
    expect(schema.safeParse({ score: 3, intent: 'a', tags: [] }).success).toBe(false);
    expect(schema.safeParse({ needs_human: 'yes', score: 3, intent: 'a', tags: [] }).success).toBe(
      false,
    );
    expect(schema.safeParse({ needs_human: true, score: 3, intent: 'c', tags: [] }).success).toBe(
      false,
    );
  });

  it('carries the field description for the model', () => {
    const described = outputToZod([
      { name: 'reason', type: OutputFieldType.String, description: 'Why', required: true },
    ]);
    expect(described.shape['reason']?.description).toBe('Why');
  });
});
