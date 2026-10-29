export interface BrokenDraftIssue {
  id: string;
  nodeId: string | null;
  step: string | null;
  message: string;
}

export interface BrokenDraftProps {
  draftName: string;
  issues: readonly BrokenDraftIssue[];
  onOpen: (nodeId: string | null) => void;
}
