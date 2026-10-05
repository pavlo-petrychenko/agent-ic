export enum KeyValueLayout {
  Kv = 'kv',
  DefList = 'deflist',
  Props = 'props',
}

export const KEY_VALUE_COLUMNS_AFTER_LABEL: Readonly<Record<KeyValueLayout, string | null>> = {
  [KeyValueLayout.Kv]: null,
  [KeyValueLayout.DefList]: '1fr',
  [KeyValueLayout.Props]: '1fr auto',
};
