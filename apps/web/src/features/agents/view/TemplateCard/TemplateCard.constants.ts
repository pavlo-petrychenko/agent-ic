export enum TemplateCardSize {
  Featured = 'featured',
  Compact = 'compact',
}

export const TEMPLATE_CARD_THUMBNAIL_HEIGHT: Readonly<Record<TemplateCardSize, number>> = {
  [TemplateCardSize.Featured]: 176,
  [TemplateCardSize.Compact]: 112,
};

export const TEMPLATE_CARD_NAME_SUFFIX = '-name';
export const TEMPLATE_CARD_DESCRIPTION_SUFFIX = '-description';
