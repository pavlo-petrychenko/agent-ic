import { useCallback, useState } from 'react';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import type { UsePromptOptionsResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';

export function usePromptOptions(): UsePromptOptionsResult {
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onSelect = useCallback((action: PromptMenuAction) => {
    switch (action) {
      case PromptMenuAction.Rename:
        return setRenaming(true);
      case PromptMenuAction.Move:
        return setMoving(true);
      case PromptMenuAction.Delete:
        return setDeleting(true);
    }
  }, []);

  return {
    onSelect,
    renaming,
    moving,
    deleting,
    closeRename: () => setRenaming(false),
    closeMove: () => setMoving(false),
    closeDelete: () => setDeleting(false),
  };
}
