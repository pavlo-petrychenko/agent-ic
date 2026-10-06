import { Handle, Position, useConnection } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { FLOW_CANVAS_IN_PORT_ID } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type { CanvasNode as CanvasNodeType } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import { FlowPortDirection, FlowPortState } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import styles from '@/shared/ui/flow/FlowCanvas/CanvasNode/CanvasNode.module.scss';

export function CanvasNode({ id, data, selected }: NodeProps<CanvasNodeType>) {
  const { node, connectedPorts, keyboardConnection, canConnect, portKeyboard } = data;
  const pointerSource = useConnection((connection) =>
    connection.inProgress
      ? { node: connection.fromNode.id, port: connection.fromHandle.id ?? null }
      : null,
  );
  const source =
    pointerSource ??
    (keyboardConnection === null
      ? null
      : { node: keyboardConnection.source, port: keyboardConnection.sourcePort });
  const connecting = source !== null;
  const acceptsEdge = connecting && canConnect(source.node, id);
  const keyboardTarget =
    keyboardConnection !== null && keyboardConnection.targets[keyboardConnection.index] === id;

  const highlighted = keyboardConnection === null ? acceptsEdge : keyboardTarget;
  const inPortState = highlighted ? FlowPortState.Target : FlowPortState.Hidden;

  const inPort = node.hasInPort ? (
    <Handle
      type="target"
      position={Position.Top}
      id={FLOW_CANVAS_IN_PORT_ID}
      className={styles.handle}
    >
      <FlowPort
        direction={FlowPortDirection.In}
        state={inPortState}
        connected={connectedPorts.has(FLOW_CANVAS_IN_PORT_ID)}
      />
    </Handle>
  ) : null;

  const outPorts =
    node.outPorts.length > 0 ? (
      <>
        {node.outPorts.map((port) => (
          <Handle
            key={port.id}
            type="source"
            position={Position.Bottom}
            id={port.id}
            className={styles.handle}
          >
            <FlowPort
              direction={FlowPortDirection.Out}
              state={
                source?.node === id && source.port === port.id
                  ? FlowPortState.Source
                  : FlowPortState.Hidden
              }
              connected={connectedPorts.has(port.id)}
              ariaLabel={port.ariaLabel}
              label={port.label ?? null}
              labelActive={port.labelActive ?? false}
              keyboard={portKeyboard(port.id)}
            />
          </Handle>
        ))}
      </>
    ) : null;

  return node.render({
    inPort,
    outPorts,
    selected,
    faded: connecting && !acceptsEdge && !(source.node === id),
  });
}
