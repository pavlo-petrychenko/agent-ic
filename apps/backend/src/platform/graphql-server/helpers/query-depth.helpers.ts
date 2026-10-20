import { Kind } from 'graphql';
import type { SelectionSetNode, ValidationContext, ValidationRule } from 'graphql';
import {
  INTROSPECTION_FIELDS,
  LEAF_DEPTH,
  QueryLimit,
} from '@/platform/graphql-server/constants/query-limits.constants';
import { QueryLimitError } from '@/platform/graphql-server/errors/query-limit.error';

const selectionDepth = (
  context: ValidationContext,
  selectionSet: SelectionSetNode,
  visited: ReadonlySet<string>,
): number =>
  Math.max(
    0,
    ...selectionSet.selections.map((selection) => {
      if (selection.kind === Kind.FIELD) {
        if (INTROSPECTION_FIELDS.has(selection.name.value)) {
          return 0;
        }
        return selection.selectionSet === undefined
          ? LEAF_DEPTH
          : LEAF_DEPTH + selectionDepth(context, selection.selectionSet, visited);
      }
      if (selection.kind === Kind.INLINE_FRAGMENT) {
        return selectionDepth(context, selection.selectionSet, visited);
      }
      const name = selection.name.value;
      const fragment = context.getFragment(name) ?? null;
      return fragment === null || visited.has(name)
        ? 0
        : selectionDepth(context, fragment.selectionSet, new Set([...visited, name]));
    }),
  );

export const maxDepthRule =
  (max: number): ValidationRule =>
  (context) => ({
    OperationDefinition: (operation) => {
      const depth = selectionDepth(context, operation.selectionSet, new Set());
      if (depth > max) {
        context.reportError(new QueryLimitError(QueryLimit.Depth, max, depth));
      }
    },
  });
