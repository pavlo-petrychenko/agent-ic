export interface MigrationJournalEntry {
  readonly tag: string;
}

export interface MigrationJournal {
  readonly entries: readonly MigrationJournalEntry[];
}

export interface MigrationFileMismatch {
  readonly orphanFiles: readonly string[];
  readonly missingFiles: readonly string[];
}

export interface SeededOrphans {
  readonly userId: string;
  readonly workspaceId: string;
  readonly keptAgentId: string;
  readonly keptConversationId: string;
  readonly deletedAgentId: string;
  readonly deletedVersionId: string;
  readonly deletedConversationId: string;
  readonly deletedMessageId: string;
  readonly deletedRunId: string;
  readonly deletedFolderId: string;
  readonly deletedPromptId: string;
}
