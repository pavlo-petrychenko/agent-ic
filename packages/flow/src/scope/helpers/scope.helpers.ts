import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import { isTriggerNode } from '@flow/document/helpers/node.helpers';
import { nodePorts } from '@flow/document/helpers/port.helpers';
import type {
  FlowDocument,
  FlowEdge,
  FlowNode,
  ParallelNode,
  TriggerNode,
} from '@flow/document/typedefs/flow.typedefs';
import { CompletionRole, WaitFor } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { nodeOutputFields } from '@flow/outputs/helpers/output.helpers';
import {
  API_REQUEST_ALWAYS_SET_OUTPUT,
  API_REQUEST_OUTPUTS,
  EVENT_ROOT,
  OUTPUT_VARIABLE_TYPES,
  Presence,
  TODAY_VARIABLE,
  TRIGGER_VARIABLES,
  VariableSourceKind,
  VariableType,
} from '@flow/scope/constants/scope.constants';
import {
  branchNodes,
  branchStarts,
  buildFlowGraph,
  incomingEdges,
  outgoingEdges,
} from '@flow/scope/helpers/graph.helpers';
import type {
  FlowGraph,
  ResolvedVariable,
  ScopeLookup,
  StepPresence,
  TriggerVariable,
  VisibleVariable,
} from '@flow/scope/typedefs/scope.typedefs';
import { PATH_SEPARATOR, PathSegmentKind } from '@flow/templates/constants/template.constants';
import { parseVariablePath } from '@flow/templates/helpers/path.helpers';

const EMPTY_PRESENCE: StepPresence = new Map();

const mergePresence = (states: readonly StepPresence[]): StepPresence => {
  const [first, ...rest] = states;
  if (first === undefined) {
    return EMPTY_PRESENCE;
  }
  const merged = new Map<string, Presence>();
  for (const state of states) {
    for (const id of state.keys()) {
      const guaranteed = states.every((other) => other.get(id) === Presence.Guaranteed);
      merged.set(id, guaranteed ? Presence.Guaranteed : Presence.Possible);
    }
  }
  return rest.length === 0 ? first : merged;
};

const withStep = (state: StepPresence, nodeId: string): StepPresence =>
  new Map(state).set(nodeId, Presence.Guaranteed);

const isObserver = (node: FlowNode): boolean =>
  node.type === NodeType.Completion && node.config.role === CompletionRole.Observer;

const createPresenceAnalysis = (graph: FlowGraph): ((nodeId: string) => StepPresence) => {
  const memo = new Map<string, StepPresence>();
  const visiting = new Set<string>();

  const exitStates = (nodeIds: ReadonlySet<string>, nested: ReadonlySet<string>): StepPresence[] =>
    [...nodeIds]
      .filter((id) => !nested.has(id))
      .flatMap((id) => {
        const node = graph.nodes.get(id);
        if (node === undefined) {
          return [];
        }
        const ports = nodePorts(node);
        if (ports.length === 0) {
          return [withStep(stateBefore(id), id)];
        }
        return ports
          .filter((port) => port !== PortName.Error && port !== PortName.Branches)
          .filter((port) => outgoingEdges(graph, id, port).length === 0)
          .map((port) => stateAfter(node, port));
      });

  const nestedBranchNodes = (nodeIds: ReadonlySet<string>): ReadonlySet<string> => {
    const nested = new Set<string>();
    for (const id of nodeIds) {
      if (graph.nodes.get(id)?.type === NodeType.Parallel) {
        for (const start of branchStarts(graph, id)) {
          for (const inner of branchNodes(graph, start)) {
            nested.add(inner);
          }
        }
      }
    }
    return nested;
  };

  const joinState = (parallel: ParallelNode): StepPresence => {
    const joined = new Map(withStep(stateBefore(parallel.id), parallel.id));
    for (const start of branchStarts(graph, parallel.id)) {
      const nodeIds = branchNodes(graph, start);
      if (nodeIds.has(parallel.id)) {
        continue;
      }
      const end = mergePresence(exitStates(nodeIds, nestedBranchNodes(nodeIds)));
      const observerBranch = [...nodeIds].some((id) => {
        const node = graph.nodes.get(id);
        return node !== undefined && isObserver(node);
      });
      const weaken =
        parallel.config.waitFor === WaitFor.First ||
        (parallel.config.waitFor === WaitFor.Guards && observerBranch);
      for (const [id, presence] of end) {
        if (nodeIds.has(id)) {
          joined.set(id, weaken ? Presence.Possible : presence);
        }
      }
    }
    return joined;
  };

  const stateAfter = (node: FlowNode, port: string): StepPresence => {
    if (node.type === NodeType.Parallel && port === PortName.Next) {
      return joinState(node);
    }
    const before = stateBefore(node.id);
    return port === PortName.Error ? before : withStep(before, node.id);
  };

  const edgeState = (edge: FlowEdge): StepPresence => {
    const source = graph.nodes.get(edge.source);
    return source === undefined ? EMPTY_PRESENCE : stateAfter(source, edge.sourcePort);
  };

  const stateBefore = (nodeId: string): StepPresence => {
    const cached = memo.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(nodeId)) {
      return EMPTY_PRESENCE;
    }
    visiting.add(nodeId);
    const state = mergePresence(incomingEdges(graph, nodeId).map(edgeState));
    visiting.delete(nodeId);
    memo.set(nodeId, state);
    return state;
  };

  return stateBefore;
};

const typeOfExample = (value: unknown): VariableType => {
  if (typeof value === 'string') {
    return VariableType.String;
  }
  if (typeof value === 'number') {
    return VariableType.Number;
  }
  if (typeof value === 'boolean') {
    return VariableType.Boolean;
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => typeof item === 'string')
      ? VariableType.StringList
      : VariableType.List;
  }
  return VariableType.Unknown;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exampleVariables = (prefix: string, value: unknown): TriggerVariable[] =>
  isPlainObject(value)
    ? Object.entries(value).flatMap(([name, child]) => {
        const path = `${prefix}${PATH_SEPARATOR}${name}`;
        const type = typeOfExample(child);
        return [
          { path, type, open: type === VariableType.Unknown },
          ...exampleVariables(path, child),
        ];
      })
    : [];

const triggerVariables = (trigger: TriggerNode): readonly TriggerVariable[] =>
  trigger.type === NodeType.TriggerExternalEvent
    ? [
        ...TRIGGER_VARIABLES[trigger.type],
        ...exampleVariables(EVENT_ROOT, trigger.config.examplePayload),
      ]
    : TRIGGER_VARIABLES[trigger.type];

interface TriggerVariableTally {
  readonly variable: TriggerVariable;
  readonly providers: Set<string>;
  readonly fromExample: boolean;
}

const triggerScope = (triggers: readonly TriggerNode[]): VisibleVariable[] => {
  const tallies = new Map<string, TriggerVariableTally>();
  for (const trigger of triggers) {
    const declared = new Set(TRIGGER_VARIABLES[trigger.type].map((variable) => variable.path));
    for (const variable of triggerVariables(trigger)) {
      const existing = tallies.get(variable.path);
      if (existing === undefined) {
        tallies.set(variable.path, {
          variable,
          providers: new Set([trigger.id]),
          fromExample: !declared.has(variable.path),
        });
        continue;
      }
      existing.providers.add(trigger.id);
      if (existing.variable.type !== variable.type) {
        tallies.set(variable.path, {
          ...existing,
          variable: { path: variable.path, type: VariableType.Unknown, open: true },
        });
      }
    }
  }
  return [...tallies.values()].map(({ variable, providers, fromExample }) => ({
    path: variable.path,
    type: variable.type,
    open: variable.open,
    nullable: fromExample || providers.size < triggers.length,
    values: null,
    source: VariableSourceKind.Trigger,
    nodeId: null,
  }));
};

const stepScope = (node: FlowNode, presence: Presence): VisibleVariable[] => {
  const guaranteed = presence === Presence.Guaranteed;
  const step = { source: VariableSourceKind.Step, nodeId: node.id };
  if (node.type === NodeType.ApiRequest) {
    return API_REQUEST_OUTPUTS.map((output) => ({
      ...step,
      path: `${node.key}${PATH_SEPARATOR}${output.path}`,
      type: output.type,
      open: output.open,
      nullable: !guaranteed || output.path !== API_REQUEST_ALWAYS_SET_OUTPUT,
      values: null,
    }));
  }
  if (isObserver(node)) {
    return [];
  }
  return nodeOutputFields(node).map((field) => ({
    ...step,
    path: `${node.key}${PATH_SEPARATOR}${field.name}`,
    type: OUTPUT_VARIABLE_TYPES[field.type],
    open: false,
    nullable: !guaranteed || !field.required,
    values: field.type === OutputFieldType.Enum ? field.values : null,
  }));
};

const TODAY: VisibleVariable = {
  path: TODAY_VARIABLE,
  type: VariableType.String,
  open: false,
  nullable: false,
  values: null,
  source: VariableSourceKind.System,
  nodeId: null,
};

export const createScopeLookup = (flow: FlowDocument): ScopeLookup => {
  const graph = buildFlowGraph(flow);
  const stateBefore = createPresenceAnalysis(graph);
  const memo = new Map<string, readonly VisibleVariable[]>();
  return (nodeId) => {
    const cached = memo.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }
    const state = stateBefore(nodeId);
    const triggers: TriggerNode[] = [];
    const steps: VisibleVariable[] = [];
    for (const node of flow.nodes) {
      const presence = state.get(node.id);
      if (presence === undefined || node.id === nodeId) {
        continue;
      }
      if (isTriggerNode(node)) {
        triggers.push(node);
      } else {
        steps.push(...stepScope(node, presence));
      }
    }
    const variables = [...triggerScope(triggers), TODAY, ...steps];
    memo.set(nodeId, variables);
    return variables;
  };
};

export const visibleVariables = (flow: FlowDocument, nodeId: string): readonly VisibleVariable[] =>
  createScopeLookup(flow)(nodeId);

const UNKNOWN_VALUE: ResolvedVariable = {
  type: VariableType.Unknown,
  nullable: true,
  values: null,
};
const LIST_ITEM: ResolvedVariable = { type: VariableType.String, nullable: true, values: null };

export const resolveVariable = (
  variables: readonly VisibleVariable[],
  path: string,
): ResolvedVariable | null => {
  const segments = parseVariablePath(path);
  if (segments === null) {
    return null;
  }
  const byPath = new Map(variables.map((variable) => [variable.path, variable]));
  let current: ResolvedVariable | null = null;
  let open = false;
  let exactPath: string | null = '';
  for (const segment of segments) {
    if (segment.kind === PathSegmentKind.Index) {
      exactPath = null;
      if (open || current?.type === VariableType.List || current?.type === VariableType.Unknown) {
        current = UNKNOWN_VALUE;
        open = true;
      } else if (current?.type === VariableType.StringList) {
        current = LIST_ITEM;
      } else {
        return null;
      }
      continue;
    }
    const nextPath: string | null =
      exactPath === null
        ? null
        : exactPath === ''
          ? segment.name
          : `${exactPath}${PATH_SEPARATOR}${segment.name}`;
    const exact = nextPath === null ? undefined : byPath.get(nextPath);
    exactPath = nextPath;
    if (exact !== undefined) {
      current = exact;
      open = exact.open;
    } else if (open) {
      current = UNKNOWN_VALUE;
    } else if (current === null && exactPath !== null) {
      continue;
    } else {
      return null;
    }
  }
  if (current === null) {
    return null;
  }
  return { type: current.type, nullable: current.nullable, values: current.values };
};
