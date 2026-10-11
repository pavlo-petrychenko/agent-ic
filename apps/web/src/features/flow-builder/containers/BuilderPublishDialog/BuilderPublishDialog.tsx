import type { BuilderPublishDialogProps } from '@/features/flow-builder/containers/BuilderPublishDialog/BuilderPublishDialog.typedefs';
import { PublishDialog } from '@/features/flow-builder/containers/PublishDialog';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';

export function BuilderPublishDialog(props: BuilderPublishDialogProps) {
  const document = useFlowBuilderStore((state) => state.document);
  const revision = useFlowBuilderStore((state) => state.revision);
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const select = useFlowBuilderStore((state) => state.select);

  return (
    <PublishDialog
      {...props}
      document={document}
      revision={revision}
      saveState={saveState}
      onFix={(nodeId) => select({ nodeIds: [nodeId], edgeIds: [] })}
    />
  );
}
