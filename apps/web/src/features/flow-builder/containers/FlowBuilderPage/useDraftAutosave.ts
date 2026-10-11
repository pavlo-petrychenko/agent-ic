import type { FlowDocument } from '@agent-ic/flow';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toDraftConflict } from '@/features/flow-builder/communication/helpers/draft.helpers';
import { useSaveAgentDraft } from '@/features/flow-builder/communication/hooks/useSaveAgentDraft';
import { AUTOSAVE_DEBOUNCE_MS } from '@/features/flow-builder/constants/autosave.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type {
  DraftAutosave,
  DraftConflict,
} from '@/features/flow-builder/typedefs/autosave.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export function useDraftAutosave(agentId: string): DraftAutosave {
  const saveDraft = useSaveAgentDraft(agentId);
  const document = useFlowBuilderStore((state) => state.document);
  const revision = useFlowBuilderStore((state) => state.revision);
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const setSaveState = useFlowBuilderStore((state) => state.setSaveState);
  const [conflict, setConflict] = useState<DraftConflict | null>(null);
  const saving = useRef(false);
  const mounted = useRef(true);
  const leftWith = useRef<FlowDocument | null>(null);

  const flush = useCallback(async () => {
    const state = useFlowBuilderStore.getState();
    if (saving.current || state.saveState !== SaveState.Pending) {
      return;
    }
    saving.current = true;
    const sent = state.document;
    state.setSaveState(SaveState.Saving);
    try {
      const saved = await saveDraft(sent, state.revision);
      const queued = leftWith.current;
      if (!mounted.current && saved !== null && queued !== null && queued !== sent) {
        leftWith.current = null;
        await saveDraft(queued, saved.revision);
      }
      if (mounted.current) {
        const store = useFlowBuilderStore.getState();
        if (saved === null) {
          store.setSaveState(SaveState.Error);
        } else {
          store.markSaved(saved.revision, saved.issues, sent);
        }
      }
    } catch (error) {
      const found = toDraftConflict(toAppError(error));
      if (mounted.current) {
        setConflict(found);
        setSaveState(found === null ? SaveState.Error : SaveState.Conflict);
      }
    } finally {
      saving.current = false;
    }
  }, [saveDraft, setSaveState]);

  useEffect(() => {
    if (saveState !== SaveState.Pending) {
      return;
    }
    const timer = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [document, revision, saveState, flush]);

  useEffect(() => {
    mounted.current = true;
    leftWith.current = null;
    const flushNow = () => void flush();
    window.addEventListener('beforeunload', flushNow);
    return () => {
      window.removeEventListener('beforeunload', flushNow);
      mounted.current = false;
      leftWith.current = useFlowBuilderStore.getState().document;
      flushNow();
    };
  }, [flush]);

  return {
    conflict: saveState === SaveState.Conflict ? conflict : null,
    retry: () => {
      setSaveState(SaveState.Pending);
      void flush();
    },
  };
}
