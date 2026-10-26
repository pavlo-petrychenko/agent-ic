const BYTE_ORDER_MARK = '\uFEFF';
const NULL_CHARACTER = '\u0000';
const WINDOWS_LINE_ENDING_PATTERN = /\r\n?/g;

export const canonicalizeMarkdown = (markdown: string): string => {
  const withoutBom = markdown.startsWith(BYTE_ORDER_MARK) ? markdown.slice(1) : markdown;
  const normalized = withoutBom
    .replace(WINDOWS_LINE_ENDING_PATTERN, '\n')
    .replaceAll(NULL_CHARACTER, '')
    .trimEnd();
  return normalized.length === 0 ? '' : `${normalized}\n`;
};
