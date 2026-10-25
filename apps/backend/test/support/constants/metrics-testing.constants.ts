export const METRIC_TOTAL_SUFFIX = '_total';
export const METRIC_LINE_PATTERN = /^([a-z_:][a-z0-9_:]*)(?:\{(.*?)\})? (\S+)(?: # .*)?$/;
export const METRIC_LABEL_PATTERN = /([a-z_][a-z0-9_]*)="((?:[^"\\]|\\.)*)"/g;
