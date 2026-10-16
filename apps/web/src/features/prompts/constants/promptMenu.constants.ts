export enum PromptMenuAction {
  Rename = 'rename',
  Move = 'move',
  Delete = 'delete',
}

export const PROMPT_MENU_ACTIONS: readonly PromptMenuAction[] = [
  PromptMenuAction.Rename,
  PromptMenuAction.Move,
  PromptMenuAction.Delete,
];
