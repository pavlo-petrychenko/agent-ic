export interface KnowledgeSourcesSectionProps {
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly canAddSource: boolean;
  readonly canDeleteSource: boolean;
  readonly onCountsChanged: () => void;
}
