export interface LayoutPoint {
  readonly x: number;
  readonly y: number;
}

export interface LayoutSegment {
  readonly from: LayoutPoint;
  readonly to: LayoutPoint;
  readonly last: boolean;
}

export interface LayoutBox {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface LayoutEdgePath {
  readonly edgeId: string;
  readonly source: string;
  readonly sourcePort: string;
  readonly target: string;
  readonly segments: readonly LayoutSegment[];
}

export interface LayoutNodeHit {
  readonly edgeId: string;
  readonly nodeId: string;
}

export interface LayoutEdgeOverlap {
  readonly first: string;
  readonly second: string;
}

export interface LayoutTerminal {
  readonly nodeId: string;
  readonly exit: string;
  readonly box: LayoutBox;
}

export interface LayoutTerminalHit {
  readonly nodeId: string;
  readonly exit: string;
  readonly hitId: string;
}
