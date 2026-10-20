import {
  FlowIssueCode,
  collectPromptVariables,
  createIssue,
  resolveVariable,
  visibleVariables,
} from '@agent-ic/flow';
import type { FlowDocument, FlowIssue, PromptReference } from '@agent-ic/flow';
import type { PromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';

const promptBindingPath = (name: string): readonly string[] => ['prompt', 'bindings', name];

const bindingMap = (reference: PromptReference): ReadonlyMap<string, string> =>
  new Map(Object.entries(reference.bindings).map(([name, target]) => [name.toLowerCase(), target]));

export const promptBindingIssues = (
  flow: FlowDocument,
  reference: PromptReference,
  version: PromptVersion,
): readonly FlowIssue[] => {
  const declared = collectPromptVariables(version.text);
  const variables = visibleVariables(flow, reference.nodeId);
  const bindings = bindingMap(reference);

  return declared.flatMap((name): readonly FlowIssue[] => {
    const target = bindings.get(name);
    if (target === undefined) {
      return [
        createIssue(FlowIssueCode.PromptVariableUnmapped, {
          nodeId: reference.nodeId,
          path: promptBindingPath(name),
          params: { variable: name },
        }),
      ];
    }
    return resolveVariable(variables, target) === null
      ? [
          createIssue(FlowIssueCode.UnknownVariable, {
            nodeId: reference.nodeId,
            path: promptBindingPath(name),
            params: { variable: target },
          }),
        ]
      : [];
  });
};
