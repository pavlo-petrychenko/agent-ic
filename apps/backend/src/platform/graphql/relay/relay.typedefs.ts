export interface ConnectionArgs {
  readonly first?: number | null;
  readonly after?: string | null;
}

export interface PageRequest {
  readonly first: number;
  readonly afterId: string | null;
  readonly fetchSize: number;
}

export interface Edge<TNode> {
  readonly cursor: string;
  readonly node: TNode;
}

export interface PageInfo {
  readonly endCursor: string | null;
  readonly hasNextPage: boolean;
}

export interface Connection<TNode> {
  readonly edges: readonly Edge<TNode>[];
  readonly pageInfo: PageInfo;
}
