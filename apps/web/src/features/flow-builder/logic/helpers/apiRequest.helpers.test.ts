import { FailureMode, NodeType, PortName, RequestBodyKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import {
  bodyOfKind,
  replaceHeader,
  updateApiRequest,
} from '@/features/flow-builder/logic/helpers/apiRequest.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';

const ORIGIN = { x: 0, y: 0 };

describe('api request helpers', () => {
  it('drops the error connection when failures continue without data', () => {
    const steps = addNode(
      addNode(EMPTY_FLOW, NodeType.ApiRequest, ORIGIN, 'a'),
      NodeType.SendMessage,
      ORIGIN,
      's',
    );
    const withPort = updateApiRequest(steps, 'a', { onFailure: FailureMode.ErrorPort });
    const connected = {
      ...withPort,
      edges: [{ id: 'e', source: 'a', sourcePort: PortName.Error, target: 's' }],
    };

    expect(updateApiRequest(connected, 'a', { retries: 0 }).edges).toHaveLength(1);
    expect(updateApiRequest(connected, 'a', { onFailure: FailureMode.Continue }).edges).toEqual([]);
  });

  it('edits headers and keeps the body content across kinds', () => {
    const header = { name: 'Accept', value: 'text/plain' };

    expect(replaceHeader([header], 1, header)).toEqual([header, header]);
    expect(replaceHeader([header], 0, null)).toEqual([]);
    expect(bodyOfKind(RequestBodyKind.Text, { kind: RequestBodyKind.Json, content: '{}' })).toEqual(
      {
        kind: RequestBodyKind.Text,
        content: '{}',
      },
    );
    expect(bodyOfKind(RequestBodyKind.None, { kind: RequestBodyKind.Json, content: '{}' })).toEqual(
      {
        kind: RequestBodyKind.None,
      },
    );
  });
});
