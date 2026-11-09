export interface ExamplePoint {
  readonly x: number;
  readonly y: number;
}

export interface ExampleSegment {
  readonly from: ExamplePoint;
  readonly to: ExamplePoint;
  readonly last: boolean;
}

export interface ExampleBox {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface ExampleEdgePath {
  readonly edgeId: string;
  readonly source: string;
  readonly sourcePort: string;
  readonly target: string;
  readonly segments: readonly ExampleSegment[];
}

export interface ExampleNodeHit {
  readonly edgeId: string;
  readonly nodeId: string;
}

export interface ExampleEdgeOverlap {
  readonly first: string;
  readonly second: string;
}
