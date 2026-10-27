export interface KnowledgeSourcesSectionProps {
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly canAddSource: boolean;
  readonly canManageSources: boolean;
  readonly onCountsChanged: () => void;
}
