import { useState } from 'react';
import type { InspectedNode, NodeInspection } from '@/features/testing/typedefs/trace.typedefs';

export const useNodeInspection = (runId: string | null): NodeInspection => {
  const [inspected, setInspected] = useState<InspectedNode | null>(null);

  return {
    selectedNodeId: inspected !== null && inspected.runId === runId ? inspected.nodeId : null,
    selectNode: (nodeId) =>
      setInspected(nodeId === null || runId === null ? null : { runId, nodeId }),
  };
};
