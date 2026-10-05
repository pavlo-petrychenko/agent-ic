export const RenameError = {
  UnknownKey: 'renameNodeKey: no node has the key to rename',
  InvalidKey: 'renameNodeKey: the new key is not a valid node key',
  KeyTaken: 'renameNodeKey: another node already uses the new key',
} as const;
