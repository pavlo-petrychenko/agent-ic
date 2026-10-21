import {
  PromptDiffLineKind,
  PromptDiffSegmentKind,
} from '@/features/prompts/constants/promptCompare.constants';
import type {
  PromptDiff,
  PromptDiffLine,
  PromptDiffRow,
} from '@/features/prompts/typedefs/promptCompare.typedefs';
import {
  PROMPT_LINE_SEPARATOR,
  PromptSegmentKind,
} from '@/shared/prompt/constants/promptDocument.constants';
import { parsePromptLine } from '@/shared/prompt/helpers/promptDocument.helpers';

const buildCommonLengths = (
  fromLines: readonly string[],
  toLines: readonly string[],
): readonly (readonly number[])[] => {
  const table = Array.from({ length: fromLines.length + 1 }, () =>
    Array.from<number>({ length: toLines.length + 1 }).fill(0),
  );
  for (let fromIndex = fromLines.length - 1; fromIndex >= 0; fromIndex -= 1) {
    for (let toIndex = toLines.length - 1; toIndex >= 0; toIndex -= 1) {
      const fromLine = fromLines[fromIndex];
      const toLine = toLines[toIndex];
      const row = table[fromIndex];
      if (fromLine === undefined || toLine === undefined || row === undefined) {
        continue;
      }
      const down = table[fromIndex + 1]?.[toIndex] ?? 0;
      const right = row[toIndex + 1] ?? 0;
      row[toIndex] = fromLine === toLine ? down + 1 : Math.max(down, right);
    }
  }
  return table;
};

export const diffPromptLines = (from: string, to: string): PromptDiff => {
  const fromLines = from.split(PROMPT_LINE_SEPARATOR);
  const toLines = to.split(PROMPT_LINE_SEPARATOR);
  const commonLengths = buildCommonLengths(fromLines, toLines);
  const lines: PromptDiffLine[] = [];
  let fromIndex = 0;
  let toIndex = 0;

  while (fromIndex < fromLines.length && toIndex < toLines.length) {
    const fromLine = fromLines[fromIndex];
    const toLine = toLines[toIndex];
    if (fromLine === undefined || toLine === undefined) {
      break;
    }
    if (fromLine === toLine) {
      lines.push({ kind: PromptDiffLineKind.Context, text: fromLine });
      fromIndex += 1;
      toIndex += 1;
      continue;
    }
    const down = commonLengths[fromIndex + 1]?.[toIndex] ?? 0;
    const right = commonLengths[fromIndex]?.[toIndex + 1] ?? 0;
    if (down >= right) {
      lines.push({ kind: PromptDiffLineKind.Removed, text: fromLine });
      fromIndex += 1;
    } else {
      lines.push({ kind: PromptDiffLineKind.Added, text: toLine });
      toIndex += 1;
    }
  }
  for (; fromIndex < fromLines.length; fromIndex += 1) {
    const fromLine = fromLines[fromIndex];
    if (fromLine !== undefined) {
      lines.push({ kind: PromptDiffLineKind.Removed, text: fromLine });
    }
  }
  for (; toIndex < toLines.length; toIndex += 1) {
    const toLine = toLines[toIndex];
    if (toLine !== undefined) {
      lines.push({ kind: PromptDiffLineKind.Added, text: toLine });
    }
  }

  return {
    lines,
    removed: lines.filter((line) => line.kind === PromptDiffLineKind.Removed).length,
    added: lines.filter((line) => line.kind === PromptDiffLineKind.Added).length,
  };
};

export const toPromptDiffRows = (lines: readonly PromptDiffLine[]): PromptDiffRow[] =>
  lines.map((line) => ({
    kind: line.kind,
    segments: parsePromptLine(line.text).map((segment) =>
      segment.kind === PromptSegmentKind.Variable
        ? { kind: PromptDiffSegmentKind.Variable, path: segment.path }
        : { kind: PromptDiffSegmentKind.Text, text: segment.text },
    ),
  }));
