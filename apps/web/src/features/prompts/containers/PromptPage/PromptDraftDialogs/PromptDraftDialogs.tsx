import type { PromptDraftDialogsProps } from '@/features/prompts/containers/PromptPage/PromptDraftDialogs/PromptDraftDialogs.typedefs';
import { SavePromptVersionDialog } from '@/features/prompts/containers/SavePromptVersionDialog';
import { DiscardPromptDraftModal } from '@/features/prompts/view/DiscardPromptDraftModal';

export function PromptDraftDialogs({
  promptId,
  promptName,
  latestVersionNumber,
  session,
}: PromptDraftDialogsProps) {
  return (
    <>
      {session.draft !== null && session.discarding && (
        <DiscardPromptDraftModal
          versionNumber={session.draftNumber}
          baseVersionNumber={session.draft.baseVersionNumber}
          latestVersionNumber={latestVersionNumber}
          onDiscard={session.finishDiscarding}
          onClose={session.closeDiscardDialog}
        />
      )}
      {session.draft !== null && session.saving && (
        <SavePromptVersionDialog
          promptId={promptId}
          promptName={promptName}
          text={session.draft.text}
          versionNumber={session.draftNumber}
          onSaved={session.finishSaving}
          onClose={session.closeSaveDialog}
        />
      )}
    </>
  );
}
