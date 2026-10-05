export enum TagKind {
  Kb = 'kb',
  Tool = 'tool',
  Api = 'api',
  Var = 'var',
  Neutral = 'neutral',
}

export const TAG_MONO_BY_DEFAULT: Readonly<Record<TagKind, boolean>> = {
  [TagKind.Kb]: false,
  [TagKind.Tool]: true,
  [TagKind.Api]: false,
  [TagKind.Var]: true,
  [TagKind.Neutral]: false,
};
