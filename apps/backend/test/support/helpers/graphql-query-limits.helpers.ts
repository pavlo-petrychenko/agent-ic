import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  Kind,
  parse,
  typeFromAST,
} from 'graphql';
import type {
  DefinitionNode,
  FragmentDefinitionNode,
  GraphQLSchema,
  GraphQLType,
  OperationDefinitionNode,
} from 'graphql';
import { MAX_QUERY_COMPLEXITY } from '@/platform/graphql-server/constants/graphql-server.constants';
import type { QueryVariables } from '@/platform/graphql-server/typedefs/query-limits.typedefs';
import {
  PLACEHOLDER_SCALARS,
  PLACEHOLDER_TEXT,
  SERVER_STATUS_COST,
  SERVER_STATUS_SELECTION,
  WEB_OPERATION_ENCODING,
  WEB_OPERATIONS_GLOB,
  WEB_SOURCE_DIR,
} from '@test/support/constants/graphql-query-limits.constants';
import type { WebOperation } from '@test/support/typedefs/graphql-query-limits.typedefs';

const isFragment = (definition: DefinitionNode): definition is FragmentDefinitionNode =>
  definition.kind === Kind.FRAGMENT_DEFINITION;

const isOperation = (definition: DefinitionNode): definition is OperationDefinitionNode =>
  definition.kind === Kind.OPERATION_DEFINITION;

export const webOperations = (): WebOperation[] => {
  const files = globSync(WEB_OPERATIONS_GLOB, { cwd: WEB_SOURCE_DIR }).map((file) => ({
    file,
    definitions: parse(readFileSync(join(WEB_SOURCE_DIR, file), WEB_OPERATION_ENCODING))
      .definitions,
  }));
  const fragments = files.flatMap(({ definitions }) => definitions.filter(isFragment));
  return files.flatMap(({ file, definitions }) =>
    definitions.filter(isOperation).map((operation) => ({
      name: file,
      operation,
      document: { kind: Kind.DOCUMENT, definitions: [operation, ...fragments] },
    })),
  );
};

const placeholderValue = (type: GraphQLType | undefined): unknown => {
  if (isNonNullType(type)) {
    return placeholderValue(type.ofType);
  }
  if (isListType(type)) {
    return [];
  }
  if (isEnumType(type)) {
    return type.getValues()[0]?.value ?? null;
  }
  if (isInputObjectType(type)) {
    return Object.fromEntries(
      Object.values(type.getFields())
        .filter((field) => isNonNullType(field.type))
        .map((field) => [field.name, placeholderValue(field.type)]),
    );
  }
  return type === undefined ? null : (PLACEHOLDER_SCALARS[type.name] ?? PLACEHOLDER_TEXT);
};

export const placeholderVariables = (
  schema: GraphQLSchema,
  operation: OperationDefinitionNode,
): QueryVariables =>
  Object.fromEntries(
    (operation.variableDefinitions ?? []).map((definition) => [
      definition.variable.name.value,
      placeholderValue(typeFromAST(schema, definition.type)),
    ]),
  );

export const overComplexQuery = (): string => {
  const count = Math.floor(MAX_QUERY_COMPLEXITY / SERVER_STATUS_COST) + 1;
  const aliases = Array.from(
    { length: count },
    (_, index) => `status${index}: ${SERVER_STATUS_SELECTION}`,
  );
  return `{ ${aliases.join(' ')} }`;
};
