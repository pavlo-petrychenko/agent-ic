export interface KnowledgeBaseFieldProps {
  readonly selectedIds: readonly string[];
  readonly error: string | null;
  readonly onChange: (ids: readonly string[]) => void;
}
