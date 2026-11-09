import {
  GUIDE_TEXT_CODE_PART_PARITY,
  GUIDE_TEXT_CODE_SPLIT,
} from '@/features/flow-builder/view/GuideDetail/GuideText/GuideText.constants';
import type { GuideTextProps } from '@/features/flow-builder/view/GuideDetail/GuideText/GuideText.typedefs';
import styles from '@/features/flow-builder/view/GuideDetail/GuideText/GuideText.module.scss';

export function GuideText({ text }: GuideTextProps) {
  return (
    <>
      {text.split(GUIDE_TEXT_CODE_SPLIT).map((part, index) =>
        index % 2 === GUIDE_TEXT_CODE_PART_PARITY ? (
          <code key={index} className={styles.code}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
