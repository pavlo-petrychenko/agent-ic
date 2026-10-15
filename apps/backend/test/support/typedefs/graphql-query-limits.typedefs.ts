import type { DocumentNode, OperationDefinitionNode } from 'graphql';

export interface WebOperation {
  readonly name: string;
  readonly document: DocumentNode;
  readonly operation: OperationDefinitionNode;
}
