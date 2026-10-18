import { Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class WorkspaceDirectoryRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  async listIds(): Promise<string[]> {
    const rows = await this.systemDb.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .orderBy(asc(workspaces.createdAt), asc(workspaces.id));
    return rows.map(({ id }) => id);
  }
}
