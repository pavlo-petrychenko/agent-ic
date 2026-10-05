export enum BarTone {
  Rest = 'rest',
  Active = 'active',
  Dimmed = 'dimmed',
}

export const BAR_CHART_DEFAULT_HEIGHT = 200;
export const BAR_CHART_FALLBACK_WIDTH = 520;
export const BAR_CHART_BAR_SIZE = 44;
export const BAR_CHART_BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
export const BAR_CHART_Y_AXIS_WIDTH = 36;
export const BAR_CHART_X_AXIS_HEIGHT = 24;
export const BAR_CHART_TICK_MARGIN = 8;
export const BAR_CHART_MARGIN = { top: 8, right: 0, bottom: 0, left: 0 } as const;
export const BAR_CHART_VALUE_KEY = 'value';
export const BAR_CHART_CATEGORY_KEY = 'category';
export const BAR_CHART_SUMMARY_SEPARATOR = ': ';
export const BAR_CHART_TOOLTIP_ROW_ID = 'value';
