import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import type {
  Connection,
  KnowledgeConnectionView,
} from '@/modules/knowledge/typedefs/connection.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeConnectionViewsService {
  constructor(private readonly ids: IdService) {}

  view(connection: Connection): KnowledgeConnectionView {
    return {
      id: this.ids.toPublic(IdPrefix.KnowledgeConnection, connection.id),
      provider: connection.provider,
      accountEmail: connection.accountEmail,
      status: connection.status,
      scopes: connection.scopes ?? [],
      lastErrorCode: connection.lastErrorCode,
      lastErrorMessage: connection.lastErrorMessage,
      lastUsedAt: connection.lastUsedAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  views(connections: readonly Connection[]): KnowledgeConnectionView[] {
    return connections.map((connection) => this.view(connection));
  }
}
