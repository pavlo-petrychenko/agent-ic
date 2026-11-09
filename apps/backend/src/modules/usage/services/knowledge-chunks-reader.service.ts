export abstract class KnowledgeChunksReader {
  abstract workspaceChunkCount(workspaceId: string): Promise<number>;
}
