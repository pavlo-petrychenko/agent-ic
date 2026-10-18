export interface PromptVersionsPanelProps {
  readonly promptId: string;
  readonly activeVersionId: string | null;
  readonly onSelect: ((versionId: string) => void) | null;
  readonly onCompare: ((fromId: string, toId: string) => void) | null;
}
