import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

export interface TestWorkspace {
  readonly workspaceId: string;
  readonly publicId: string;
  readonly ownerId: string;
}

export type WorkspaceTable = PgTable & { readonly workspaceId: AnyPgColumn };
