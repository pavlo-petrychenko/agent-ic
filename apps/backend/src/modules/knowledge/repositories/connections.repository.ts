import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { connections } from '@/modules/knowledge/db/connections.table';
import type {
  Connection,
  ConnectionChanges,
  NewConnection,
} from '@/modules/knowledge/typedefs/connection.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { storedRow } from '@/platform/database/helpers/stored-row.helpers';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ConnectionsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insert(connection: NewConnection): Promise<Connection> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(connections)
        .values({ ...connection, createdAt: now, updatedAt: now })
        .returning(),
    );
  }

  async findById(workspaceId: string, connectionId: string): Promise<Connection | null> {
    const [connection] = await this.txHost.tx
      .select()
      .from(connections)
      .where(and(eq(connections.workspaceId, workspaceId), eq(connections.id, connectionId)));
    return connection ?? null;
  }

  async findByIdForUpdate(workspaceId: string, connectionId: string): Promise<Connection | null> {
    const [connection] = await this.txHost.tx
      .select()
      .from(connections)
      .where(and(eq(connections.workspaceId, workspaceId), eq(connections.id, connectionId)))
      .for('update');
    return connection ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<Connection[]> {
    return this.txHost.tx
      .select()
      .from(connections)
      .where(eq(connections.workspaceId, workspaceId))
      .orderBy(desc(connections.createdAt));
  }

  async upsert(connection: NewConnection): Promise<Connection> {
    const now = this.clock.now();
    return storedRow(
      await this.txHost.tx
        .insert(connections)
        .values({ ...connection, createdAt: now, updatedAt: now })
        .onConflictDoUpdate({
          target: [connections.workspaceId, connections.provider, connections.accountSubject],
          set: {
            accountEmail: connection.accountEmail,
            sealedRefreshToken: connection.sealedRefreshToken,
            scopes: connection.scopes,
            status: connection.status,
            lastErrorCode: null,
            lastErrorMessage: null,
            updatedAt: now,
          },
        })
        .returning(),
    );
  }

  async update(
    workspaceId: string,
    connectionId: string,
    changes: ConnectionChanges,
  ): Promise<Connection | null> {
    const [connection] = await this.txHost.tx
      .update(connections)
      .set({ ...changes, updatedAt: this.clock.now() })
      .where(and(eq(connections.workspaceId, workspaceId), eq(connections.id, connectionId)))
      .returning();
    return connection ?? null;
  }

  async deleteById(workspaceId: string, connectionId: string): Promise<boolean> {
    const deleted = await this.txHost.tx
      .delete(connections)
      .where(and(eq(connections.workspaceId, workspaceId), eq(connections.id, connectionId)))
      .returning({ id: connections.id });
    return deleted.length > 0;
  }
}
