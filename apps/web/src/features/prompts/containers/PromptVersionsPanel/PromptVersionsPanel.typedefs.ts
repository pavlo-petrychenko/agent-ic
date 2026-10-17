export interface PromptVersionsPanelProps {
  readonly promptId: string;
  readonly activeVersionId: string | null;
  readonly onSelect: ((versionId: string) => void) | null;
}
