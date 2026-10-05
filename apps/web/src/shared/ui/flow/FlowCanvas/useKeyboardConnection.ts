import { useState } from 'react';
import type {
  FlowCanvasConnection,
  FlowCanvasNode,
  KeyboardConnection,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import type { FlowPortStep } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import type { FlowPortKeyboard } from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';

interface UseKeyboardConnectionOptions {
  nodes: readonly FlowCanvasNode[];
  canConnect: (source: string, target: string) => boolean;
  onConnect: (connection: FlowCanvasConnection) => void;
}

export function useKeyboardConnection({
  nodes,
  canConnect,
  onConnect,
}: UseKeyboardConnectionOptions) {
  const [connection, setConnection] = useState<KeyboardConnection | null>(null);

  const start = (source: string, sourcePort: string) => {
    const targets = nodes
      .filter((node) => node.hasInPort && node.id !== source && canConnect(source, node.id))
      .map((node) => node.id);
    setConnection({ source, sourcePort, targets, index: 0 });
  };

  const cycle = (step: FlowPortStep) => {
    setConnection((current) => {
      if (current === null || current.targets.length === 0) {
        return current;
      }
      const count = current.targets.length;
      return { ...current, index: (current.index + step + count) % count };
    });
  };

  const confirm = () => {
    const target = connection?.targets[connection.index];
    if (connection !== null && target !== undefined) {
      onConnect({ source: connection.source, sourcePort: connection.sourcePort, target });
    }
    setConnection(null);
  };

  const cancel = () => setConnection(null);

  const keyboardFor =
    (nodeId: string) =>
    (portId: string): FlowPortKeyboard => ({
      onStart: () => start(nodeId, portId),
      onCycle: cycle,
      onConfirm: confirm,
      onCancel: cancel,
    });

  const targetId = connection?.targets[connection.index] ?? null;
  const targetLabel = nodes.find((node) => node.id === targetId)?.label ?? null;

  return { connection, keyboardFor, cancel, targetLabel };
}
