import { KnowledgeChunksReader } from '@/modules/usage';

export class FakeKnowledgeChunksReader extends KnowledgeChunksReader {
  private readonly counts = new Map<string, number>();

  setWorkspaceChunks(workspaceId: string, count: number): void {
    this.counts.set(workspaceId, count);
  }

  async workspaceChunkCount(workspaceId: string): Promise<number> {
    return this.counts.get(workspaceId) ?? 0;
  }
}
