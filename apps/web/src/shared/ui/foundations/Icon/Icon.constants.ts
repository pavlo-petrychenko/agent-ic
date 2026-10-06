import type { IconShape } from '@/shared/ui/foundations/Icon/Icon.typedefs';

export enum IconName {
  Agent = 'agent',
  Alert = 'alert',
  Api = 'api',
  ArrowDown = 'arrow-down',
  ArrowUp = 'arrow-up',
  Bolt = 'bolt',
  Box = 'box',
  Cal = 'cal',
  Channels = 'channels',
  Chart = 'chart',
  Check = 'check',
  ChevronDown = 'chevron-down',
  ChevronRight = 'chevron-right',
  Code = 'code',
  Compl = 'compl',
  Copy = 'copy',
  Drag = 'drag',
  Esc = 'esc',
  Filter = 'filter',
  Flask = 'flask',
  Gear = 'gear',
  Hand = 'hand',
  Home = 'home',
  Hour = 'hour',
  Image = 'image',
  Inbox = 'inbox',
  Info = 'info',
  Kb = 'kb',
  Key = 'key',
  Keyboard = 'keyboard',
  Link = 'link',
  Lock = 'lock',
  Logo = 'logo',
  Minus = 'minus',
  Monitor = 'monitor',
  Moon = 'moon',
  More = 'more',
  Msg = 'msg',
  Note = 'note',
  Panel = 'panel',
  Par = 'par',
  Pause = 'pause',
  Play = 'play',
  Plus = 'plus',
  Refresh = 'refresh',
  Router = 'router',
  Search = 'search',
  Send = 'send',
  Sort = 'sort',
  Sparkle = 'sparkle',
  Spinner = 'spinner',
  Star = 'star',
  Sun = 'sun',
  Tool = 'tool',
  ToolEvent = 'tool-event',
  Traces = 'traces',
  Upload = 'upload',
  User = 'user',
  Var = 'var',
  Wait = 'wait',
  X = 'x',
}

export enum IconShapeKind {
  Path = 'path',
  Rect = 'rect',
  Circle = 'circle',
}

export const ICON_VIEW_BOX = '0 0 16 16';
export const ICON_DEFAULT_SIZE = 16;
export const ICON_DEFAULT_STROKE_WIDTH = 1.5;

export const ICON_SHAPES: Readonly<Record<IconName, readonly IconShape[]>> = {
  [IconName.Agent]: [
    { kind: IconShapeKind.Rect, x: 2.5, y: 4.5, width: 11, height: 9, rx: 2.5 },
    { kind: IconShapeKind.Path, d: 'M8 1.5v3M6 9h.01M10 9h.01' },
  ],
  [IconName.Alert]: [
    { kind: IconShapeKind.Path, d: 'M8 2l6.5 11.5h-13z' },
    { kind: IconShapeKind.Path, d: 'M8 6.5v3M8 11.5h.01' },
  ],
  [IconName.Api]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 6 },
    {
      kind: IconShapeKind.Path,
      d: 'M2 8h12M8 2c1.8 1.8 2.6 3.8 2.6 6S9.8 12.2 8 14M8 2C6.2 3.8 5.4 5.8 5.4 8s.8 4.2 2.6 6',
    },
  ],
  [IconName.ArrowDown]: [{ kind: IconShapeKind.Path, d: 'M8 3v10M4 9l4 4 4-4' }],
  [IconName.ArrowUp]: [{ kind: IconShapeKind.Path, d: 'M8 13V3M4 7l4-4 4 4' }],
  [IconName.Bolt]: [{ kind: IconShapeKind.Path, d: 'M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z' }],
  [IconName.Box]: [
    { kind: IconShapeKind.Path, d: 'M2.5 5L8 2l5.5 3v6L8 14l-5.5-3zM2.5 5L8 8l5.5-3M8 8v6' },
  ],
  [IconName.Cal]: [
    { kind: IconShapeKind.Rect, x: 2.5, y: 3.5, width: 11, height: 10, rx: 1.5 },
    { kind: IconShapeKind.Path, d: 'M2.5 6.5h11M5.5 2v3M10.5 2v3' },
  ],
  [IconName.Channels]: [
    {
      kind: IconShapeKind.Path,
      d: 'M2 5.5a3.5 3.5 0 0 1 3.5-3.5h5A3.5 3.5 0 0 1 14 5.5v2A3.5 3.5 0 0 1 10.5 11H7l-3 3v-3.3A3.5 3.5 0 0 1 2 7.5z',
    },
  ],
  [IconName.Chart]: [{ kind: IconShapeKind.Path, d: 'M3 13V8M8 13V3M13 13V6' }],
  [IconName.Check]: [{ kind: IconShapeKind.Path, d: 'M3 8.5l3 3 7-7' }],
  [IconName.ChevronDown]: [{ kind: IconShapeKind.Path, d: 'M4 6l4 4 4-4' }],
  [IconName.ChevronRight]: [{ kind: IconShapeKind.Path, d: 'M6 4l4 4-4 4' }],
  [IconName.Code]: [{ kind: IconShapeKind.Path, d: 'M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5' }],
  [IconName.Compl]: [{ kind: IconShapeKind.Path, d: 'M3 4h10M3 8h10M3 12h6' }],
  [IconName.Copy]: [
    { kind: IconShapeKind.Rect, x: 5.5, y: 5.5, width: 8, height: 8, rx: 1.5 },
    { kind: IconShapeKind.Path, d: 'M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5' },
  ],
  [IconName.Drag]: [
    { kind: IconShapeKind.Circle, cx: 6, cy: 4, r: 0.8 },
    { kind: IconShapeKind.Circle, cx: 10, cy: 4, r: 0.8 },
    { kind: IconShapeKind.Circle, cx: 6, cy: 8, r: 0.8 },
    { kind: IconShapeKind.Circle, cx: 10, cy: 8, r: 0.8 },
    { kind: IconShapeKind.Circle, cx: 6, cy: 12, r: 0.8 },
    { kind: IconShapeKind.Circle, cx: 10, cy: 12, r: 0.8 },
  ],
  [IconName.Esc]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 5, r: 2.5 },
    { kind: IconShapeKind.Path, d: 'M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5' },
  ],
  [IconName.Filter]: [{ kind: IconShapeKind.Path, d: 'M2 3.5h12L9.5 9v4l-3-1.5V9z' }],
  [IconName.Flask]: [{ kind: IconShapeKind.Path, d: 'M6 2h4M7 2v4l-4 7.5h10L9 6V2' }],
  [IconName.Gear]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 2.2 },
    {
      kind: IconShapeKind.Path,
      d: 'M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4',
    },
  ],
  [IconName.Hand]: [
    {
      kind: IconShapeKind.Path,
      d: 'M6 8V3.5a1 1 0 0 1 2 0V7M8 7V2.5a1 1 0 0 1 2 0V7M10 7V3.5a1 1 0 0 1 2 0v5.5a5 5 0 0 1-5 5 4.5 4.5 0 0 1-3.8-2.1L2 9.8a1 1 0 0 1 1.6-1.2L6 10',
    },
  ],
  [IconName.Home]: [{ kind: IconShapeKind.Path, d: 'M2.5 7.5L8 3l5.5 4.5V13H2.5z' }],
  [IconName.Hour]: [
    {
      kind: IconShapeKind.Path,
      d: 'M4 2h8M4 14h8M5 2c0 3 6 3 6 6s-6 3-6 6M11 2c0 3-6 3-6 6s6 3 6 6',
    },
  ],
  [IconName.Image]: [
    { kind: IconShapeKind.Rect, x: 2, y: 2.5, width: 12, height: 11, rx: 1.5 },
    { kind: IconShapeKind.Circle, cx: 6, cy: 6.5, r: 1.3 },
    { kind: IconShapeKind.Path, d: 'M14 11l-3.5-3.5L4 13.5' },
  ],
  [IconName.Inbox]: [
    { kind: IconShapeKind.Path, d: 'M2 9l2-6h8l2 6v4H2zM2 9h3.5l1 1.5h3l1-1.5H14' },
  ],
  [IconName.Info]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 6 },
    { kind: IconShapeKind.Path, d: 'M8 7v4M8 5h.01' },
  ],
  [IconName.Kb]: [
    {
      kind: IconShapeKind.Path,
      d: 'M3 2.5h7.5a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2zM3 11.5a2 2 0 0 1 2-2h7.5',
    },
  ],
  [IconName.Key]: [
    { kind: IconShapeKind.Circle, cx: 5.5, cy: 10.5, r: 3 },
    { kind: IconShapeKind.Path, d: 'M7.7 8.3L13.5 2.5M11 5l1.5 1.5' },
  ],
  [IconName.Keyboard]: [
    { kind: IconShapeKind.Rect, x: 1.5, y: 4, width: 13, height: 8.5, rx: 1.5 },
    { kind: IconShapeKind.Path, d: 'M4 7h.01M6.5 7h.01M9 7h.01M11.5 7h.01M5 10h6' },
  ],
  [IconName.Link]: [
    {
      kind: IconShapeKind.Path,
      d: 'M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1',
    },
  ],
  [IconName.Lock]: [
    { kind: IconShapeKind.Rect, x: 3.5, y: 7, width: 9, height: 6.5, rx: 1.5 },
    { kind: IconShapeKind.Path, d: 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2' },
  ],
  [IconName.Logo]: [
    { kind: IconShapeKind.Circle, cx: 4, cy: 4, r: 2 },
    { kind: IconShapeKind.Circle, cx: 12, cy: 12, r: 2 },
    { kind: IconShapeKind.Path, d: 'M6 4h2a2 2 0 0 1 2 2v4' },
  ],
  [IconName.Minus]: [{ kind: IconShapeKind.Path, d: 'M3 8h10' }],
  [IconName.Monitor]: [
    { kind: IconShapeKind.Rect, x: 1.5, y: 2.5, width: 13, height: 9, rx: 1.5 },
    { kind: IconShapeKind.Path, d: 'M5.5 14h5M8 11.5V14' },
  ],
  [IconName.Moon]: [
    { kind: IconShapeKind.Path, d: 'M13.5 9.8A5.8 5.8 0 0 1 6.2 2.5 5.8 5.8 0 1 0 13.5 9.8z' },
  ],
  [IconName.More]: [
    { kind: IconShapeKind.Circle, cx: 3.5, cy: 8, r: 0.9 },
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 0.9 },
    { kind: IconShapeKind.Circle, cx: 12.5, cy: 8, r: 0.9 },
  ],
  [IconName.Msg]: [{ kind: IconShapeKind.Path, d: 'M2.5 3h11v8h-6l-3 2.5V11h-2z' }],
  [IconName.Note]: [
    { kind: IconShapeKind.Path, d: 'M3 2.5h10v11H3zM5.5 5.5h5M5.5 8h5M5.5 10.5h3' },
  ],
  [IconName.Panel]: [
    { kind: IconShapeKind.Rect, x: 2, y: 2.5, width: 12, height: 11, rx: 2 },
    { kind: IconShapeKind.Path, d: 'M6 2.5v11' },
  ],
  [IconName.Par]: [
    { kind: IconShapeKind.Path, d: 'M2 5h12M2 11h12M11 2.5l3 2.5-3 2.5M11 8.5l3 2.5-3 2.5' },
  ],
  [IconName.Pause]: [{ kind: IconShapeKind.Path, d: 'M6 3.5v9M10 3.5v9' }],
  [IconName.Play]: [{ kind: IconShapeKind.Path, d: 'M4.5 2.5l9 5.5-9 5.5z' }],
  [IconName.Plus]: [{ kind: IconShapeKind.Path, d: 'M8 3v10M3 8h10' }],
  [IconName.Refresh]: [{ kind: IconShapeKind.Path, d: 'M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3' }],
  [IconName.Router]: [{ kind: IconShapeKind.Path, d: 'M2 8h4M6 8l4-4h4M6 8l4 4h4' }],
  [IconName.Search]: [
    { kind: IconShapeKind.Circle, cx: 7, cy: 7, r: 4.5 },
    { kind: IconShapeKind.Path, d: 'M10.5 10.5L14 14' },
  ],
  [IconName.Send]: [{ kind: IconShapeKind.Path, d: 'M14 2L7 9M14 2l-4.5 12L7 9 2 6.5z' }],
  [IconName.Sort]: [{ kind: IconShapeKind.Path, d: 'M5 6.5L8 3.5l3 3M5 9.5l3 3 3-3' }],
  [IconName.Sparkle]: [
    {
      kind: IconShapeKind.Path,
      d: 'M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2',
    },
  ],
  [IconName.Spinner]: [{ kind: IconShapeKind.Path, d: 'M8 1.75a6.25 6.25 0 1 1-6.25 6.25' }],
  [IconName.Star]: [
    {
      kind: IconShapeKind.Path,
      d: 'M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5z',
    },
  ],
  [IconName.Sun]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 3 },
    {
      kind: IconShapeKind.Path,
      d: 'M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1',
    },
  ],
  [IconName.Tool]: [
    {
      kind: IconShapeKind.Path,
      d: 'M13.5 4.5l-2.2 2.2-2-2 2.2-2.2A3.5 3.5 0 0 0 7 7.2L2.5 11.7a1.4 1.4 0 0 0 2 2L9 9.1a3.5 3.5 0 0 0 4.5-4.6z',
    },
  ],
  [IconName.ToolEvent]: [
    {
      kind: IconShapeKind.Path,
      d: 'M12.5 3.5l-1.8 1.8-1.6-1.6 1.8-1.8A3 3 0 0 0 7 5.8L2.8 10a1.2 1.2 0 0 0 1.7 1.7L8.7 7.5',
    },
    { kind: IconShapeKind.Path, d: 'M11.5 8.5L9.5 12h2.5l-1 3 3-4h-2.5l1-2.5' },
  ],
  [IconName.Traces]: [{ kind: IconShapeKind.Path, d: 'M1.5 8h3l2-5 3 10 2-5h3' }],
  [IconName.Upload]: [{ kind: IconShapeKind.Path, d: 'M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10' }],
  [IconName.User]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 5.5, r: 2.8 },
    { kind: IconShapeKind.Path, d: 'M2.5 14c.5-2.8 2.8-4.3 5.5-4.3s5 1.5 5.5 4.3' },
  ],
  [IconName.Var]: [
    {
      kind: IconShapeKind.Path,
      d: 'M6 2.5C4.5 2.5 4.5 3.5 4.5 5S4 7.5 2.5 8c1.5.5 2 1.5 2 3s0 2.5 1.5 2.5M10 2.5c1.5 0 1.5 1 1.5 2.5s.5 2.5 2 3c-1.5.5-2 1.5-2 3s0 2.5-1.5 2.5',
    },
  ],
  [IconName.Wait]: [
    { kind: IconShapeKind.Circle, cx: 8, cy: 8, r: 6 },
    { kind: IconShapeKind.Path, d: 'M8 4.5V8l2.5 1.5' },
  ],
  [IconName.X]: [{ kind: IconShapeKind.Path, d: 'M4 4l8 8M12 4l-8 8' }],
};
