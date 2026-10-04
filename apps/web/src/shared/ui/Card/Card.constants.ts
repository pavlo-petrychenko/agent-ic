export enum CardTone {
  Default = 'default',
  Panel = 'panel',
  Sunken = 'sunken',
}

export enum CardPad {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum CardGap {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum CardElement {
  Section = 'section',
  Div = 'div',
  Li = 'li',
}

export const CARD_DEFAULT_PAD: Readonly<Record<CardTone, CardPad>> = {
  [CardTone.Default]: CardPad.Md,
  [CardTone.Panel]: CardPad.Md,
  [CardTone.Sunken]: CardPad.Sm,
};

export const CARD_DEFAULT_GAP: Readonly<Record<CardTone, CardGap>> = {
  [CardTone.Default]: CardGap.Md,
  [CardTone.Panel]: CardGap.Md,
  [CardTone.Sunken]: CardGap.Xs,
};
