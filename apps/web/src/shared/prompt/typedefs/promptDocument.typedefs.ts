import type {
  PromptNodeName,
  PromptSegmentKind,
} from '@/shared/prompt/constants/promptDocument.constants';

export interface PromptTextSegment {
  kind: PromptSegmentKind.Text;
  text: string;
}

export interface PromptVariableSegment {
  kind: PromptSegmentKind.Variable;
  path: string;
}

export type PromptSegment = PromptTextSegment | PromptVariableSegment;

export interface PromptTextNode {
  type: PromptNodeName.Text;
  text: string;
}

export interface PromptVariableNode {
  type: PromptNodeName.Variable;
  attrs: { path: string };
}

export interface PromptParagraphNode {
  type: PromptNodeName.Paragraph;
  content?: (PromptTextNode | PromptVariableNode)[];
}

export interface PromptDocumentJson {
  type: PromptNodeName.Doc;
  content: PromptParagraphNode[];
}

export interface PromptTriggerMatch {
  query: string;
  length: number;
}

export interface PromptNodeLike {
  type: { name: string };
  text?: string | null | undefined;
  attrs: Readonly<Record<string, unknown>>;
  forEach: (callback: (child: PromptNodeLike) => void) => void;
}
