export interface KnowledgeSourcesSectionProps {
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly canAddSource: boolean;
  readonly onCountsChanged: () => void;
}
