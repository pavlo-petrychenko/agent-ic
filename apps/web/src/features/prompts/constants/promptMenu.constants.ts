export enum PromptMenuAction {
  Rename = 'rename',
  Move = 'move',
  Duplicate = 'duplicate',
  Delete = 'delete',
}

export const PROMPT_MENU_ACTIONS: readonly PromptMenuAction[] = [
  PromptMenuAction.Rename,
  PromptMenuAction.Move,
  PromptMenuAction.Duplicate,
  PromptMenuAction.Delete,
];
