import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { GUIDE_GROUP_LABEL_KEYS } from '@/features/flow-builder/constants/guide.constants';
import { GUIDE_LIST_CHEVRON_SIZE } from '@/features/flow-builder/view/GuideList/GuideList.constants';
import type { GuideListProps } from '@/features/flow-builder/view/GuideList/GuideList.typedefs';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/flow-builder/view/GuideList/GuideList.module.scss';

const focusOnMount = (element: HTMLButtonElement | null) => {
  element?.focus({ preventScroll: true });
};

export function GuideList({
  sections,
  query,
  focusId,
  onQueryChange,
  onSelect,
  onClose,
}: GuideListProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const idPrefix = useId();

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading size={HeadingSize.H2} as={HeadingElement.H2}>
          {t('guide.title')}
        </Heading>
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          label={t('guide.close')}
          onClick={onClose}
        />
      </div>
      <div className={styles.body}>
        <SearchInput
          value={query}
          label={t('guide.search')}
          placeholder={t('guide.search')}
          clearLabel={t('guide.clearSearch')}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={() => onQueryChange('')}
        />
        {sections.length === 0 && (
          <output className={styles.empty}>{t('guide.nothingFound')}</output>
        )}
        {sections.map((section) => {
          const labelId = `${idPrefix}-${section.group}`;
          return (
            <section key={section.group} aria-labelledby={labelId} className={styles.section}>
              <h3 id={labelId} className={styles.sectionLabel}>
                {t(GUIDE_GROUP_LABEL_KEYS[section.group])}
              </h3>
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      ref={item.id === focusId ? focusOnMount : undefined}
                      className={styles.item}
                      onClick={() => onSelect(item.id)}
                    >
                      <NodeTile kind={item.kind} icon={item.icon} size={TileSize.Md} />
                      <span className={styles.text}>
                        <span className={styles.title}>{item.title}</span>
                        <span className={styles.summary}>{item.summary}</span>
                      </span>
                      <Icon
                        name={IconName.ChevronRight}
                        size={GUIDE_LIST_CHEVRON_SIZE}
                        className={styles.chevron}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
