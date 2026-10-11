import type { FieldChange, FlowIssue, KeyRename } from '@agent-ic/flow';
import type {
  ChangeKind,
  ChangeSentence,
  CheckTone,
} from '@/features/flow-builder/constants/publish.constants';

export interface DiffNode {
  id: string;
  key: string;
  label: string;
}

export interface DiffEdge {
  source: string;
  target: string;
}

export interface DiffNodeChange {
  nodeId: string;
  key: string;
  fields: readonly FieldChange[];
}

export interface PublishDiff {
  addedNodes: readonly DiffNode[];
  removedNodes: readonly DiffNode[];
  changedNodes: readonly DiffNodeChange[];
  renamedKeys: readonly KeyRename[];
  addedEdges: readonly DiffEdge[];
  removedEdges: readonly DiffEdge[];
  changeCount: number;
}

export interface PublishPreview {
  draftNumber: number;
  liveVersion: number | null;
  diff: PublishDiff;
  errors: readonly FlowIssue[];
  errorCount: number;
  warnings: readonly FlowIssue[];
  testedAt: string | null;
}

export interface ChangeLine {
  id: string;
  kind: ChangeKind;
  sentence: ChangeSentence;
  step: string;
  field: string | null;
  before: string | null;
  after: string | null;
}

export interface PublishCheck {
  id: string;
  tone: CheckTone;
  label: string;
  meta: string | null;
  nodeId: string | null;
}

export interface UsePublishPreviewResult {
  preview: PublishPreview | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface UsePublishAgentResult {
  publish: (note: string) => Promise<number | null>;
  publishing: boolean;
}
