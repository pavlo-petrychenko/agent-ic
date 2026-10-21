import { ApolloServerErrorCode } from '@apollo/server/errors';
import { HttpStatus } from '@nestjs/common';
import { SchemaMetaFieldDef, TypeMetaFieldDef } from 'graphql';

export const INTROSPECTION_FIELDS: ReadonlySet<string> = new Set([
  SchemaMetaFieldDef.name,
  TypeMetaFieldDef.name,
]);
export const FIELD_COST = 1;
export const INTROSPECTION_COST = 0;
export const LEAF_DEPTH = 1;
export const QUERY_LIMIT_ERROR_CODE = ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED;
export const QUERY_LIMIT_HTTP_STATUS = HttpStatus.BAD_REQUEST;

export enum QueryLimit {
  Depth = 'depth',
  Complexity = 'complexity',
}

export const QUERY_LIMIT_MESSAGE: Readonly<Record<QueryLimit, string>> = {
  [QueryLimit.Depth]: 'The query is nested deeper than the server allows.',
  [QueryLimit.Complexity]: 'The query selects more fields than the server allows.',
};
