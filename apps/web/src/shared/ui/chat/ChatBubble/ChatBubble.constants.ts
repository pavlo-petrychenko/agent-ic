export enum ChatBubbleFrom {
  Customer = 'customer',
  Agent = 'agent',
  Operator = 'operator',
}

export enum ChatBubbleView {
  Thread = 'thread',
  Widget = 'widget',
}

export enum ChatBubbleSide {
  Start = 'start',
  End = 'end',
}

export enum ChatBubbleSurface {
  Card = 'card',
  Violet = 'violet',
  AccentLight = 'accentLight',
  WidgetAccent = 'widgetAccent',
}

export interface ChatBubbleLook {
  readonly side: ChatBubbleSide;
  readonly surface: ChatBubbleSurface;
}

export const CHAT_BUBBLE_LOOKS: Readonly<
  Record<ChatBubbleView, Readonly<Record<ChatBubbleFrom, ChatBubbleLook>>>
> = {
  [ChatBubbleView.Thread]: {
    [ChatBubbleFrom.Customer]: { side: ChatBubbleSide.Start, surface: ChatBubbleSurface.Card },
    [ChatBubbleFrom.Agent]: { side: ChatBubbleSide.End, surface: ChatBubbleSurface.Violet },
    [ChatBubbleFrom.Operator]: {
      side: ChatBubbleSide.End,
      surface: ChatBubbleSurface.AccentLight,
    },
  },
  [ChatBubbleView.Widget]: {
    [ChatBubbleFrom.Customer]: {
      side: ChatBubbleSide.End,
      surface: ChatBubbleSurface.WidgetAccent,
    },
    [ChatBubbleFrom.Agent]: { side: ChatBubbleSide.Start, surface: ChatBubbleSurface.Card },
    [ChatBubbleFrom.Operator]: { side: ChatBubbleSide.Start, surface: ChatBubbleSurface.Card },
  },
};

export const CHAT_BUBBLE_META_SEPARATOR = ' · ';
export const CHAT_BUBBLE_AGENT_ICON_SIZE = 12;
export const WIDGET_ACCENT_PROPERTY = '--widget-accent';
