import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export enum NodeKind {
  Trig = 'trig',
  Agent = 'agent',
  Compl = 'compl',
  Router = 'router',
  Par = 'par',
  Wait = 'wait',
  Send = 'send',
  Api = 'api',
  Kb = 'kb',
  Tool = 'tool',
  Var = 'var',
  Esc = 'esc',
  Gen = 'gen',
  Neutral = 'neutral',
  Info = 'info',
  Ok = 'ok',
  Warn = 'warn',
  Err = 'err',
  Accent = 'accent',
}

export enum TileSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export const TILE_ICON_SIZES: Readonly<Record<TileSize, number>> = {
  [TileSize.Xs]: 11,
  [TileSize.Sm]: 13,
  [TileSize.Md]: 15,
  [TileSize.Lg]: 17,
};

export const NODE_KIND_DEFAULT_ICONS: Readonly<Record<NodeKind, IconName>> = {
  [NodeKind.Trig]: IconName.Msg,
  [NodeKind.Agent]: IconName.Agent,
  [NodeKind.Compl]: IconName.Compl,
  [NodeKind.Router]: IconName.Router,
  [NodeKind.Par]: IconName.Par,
  [NodeKind.Wait]: IconName.Wait,
  [NodeKind.Send]: IconName.Send,
  [NodeKind.Api]: IconName.Api,
  [NodeKind.Kb]: IconName.Kb,
  [NodeKind.Tool]: IconName.Tool,
  [NodeKind.Var]: IconName.Var,
  [NodeKind.Esc]: IconName.Esc,
  [NodeKind.Gen]: IconName.Sparkle,
  [NodeKind.Neutral]: IconName.Box,
  [NodeKind.Info]: IconName.Info,
  [NodeKind.Ok]: IconName.Check,
  [NodeKind.Warn]: IconName.Alert,
  [NodeKind.Err]: IconName.Alert,
  [NodeKind.Accent]: IconName.Logo,
};
