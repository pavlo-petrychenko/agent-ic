import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import {
  CATEGORY_FILTER_ALL,
  FEATURED_GALLERY_TABS,
  GALLERY_TABS,
  GalleryTab,
} from '@/features/agents/constants/agentTemplate.constants';
import { TemplateCard, TemplateCardSize } from '@/features/agents/view/TemplateCard';
import type { TemplateGalleryProps } from '@/features/agents/view/TemplateGallery/TemplateGallery.typedefs';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Tabs } from '@/shared/ui/navigation/Tabs';
import styles from '@/features/agents/view/TemplateGallery/TemplateGallery.module.scss';

export function TemplateGallery({
  tab,
  tabCounts,
  category,
  categories,
  cards,
  focusKey,
  blankCreating,
  onTabChange,
  onCategoryChange,
  onSelect,
  onCreateBlank,
}: TemplateGalleryProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const rootRef = useRef<HTMLDivElement>(null);
  const featured = FEATURED_GALLERY_TABS.includes(tab);

  useEffect(() => {
    if (focusKey !== null) {
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-template="${focusKey}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [focusKey]);

  return (
    <div ref={rootRef} className={styles.root}>
      <Tabs
        ariaLabel={t('gallery.tabs.label')}
        value={tab}
        onValueChange={onTabChange}
        tabs={GALLERY_TABS.map((value) => ({
          value,
          label: t(`gallery.tabs.${value}`),
          count: tabCounts[value],
        }))}
      />
      <div role="tabpanel" aria-label={t(`gallery.tabs.${tab}`)} className={styles.panel}>
        <p className={styles.intro}>{t(`gallery.intro.${tab}`)}</p>
        {tab === GalleryTab.Snippets && categories.length > 1 && (
          <div className={styles.filters}>
            <SegmentedControl
              ariaLabel={t('gallery.categories.label')}
              value={category}
              onValueChange={onCategoryChange}
              options={[
                { value: CATEGORY_FILTER_ALL, label: t('gallery.categories.all') },
                ...categories.map((value) => ({
                  value,
                  label: t(`gallery.categories.${value}`),
                })),
              ]}
            />
          </div>
        )}
        {tab === GalleryTab.Blank ? (
          <button
            type="button"
            className={styles.blank}
            aria-busy={blankCreating || undefined}
            disabled={blankCreating}
            onClick={onCreateBlank}
          >
            <NodeTile kind={NodeKind.Neutral} icon={IconName.Plus} size={TileSize.Md} />
            <span className={styles.blankText}>
              <span className={styles.blankTitle}>{t('gallery.blank.title')}</span>
              <span className={styles.blankDescription}>{t('gallery.blank.description')}</span>
            </span>
            <Icon name={IconName.ChevronRight} size={14} />
          </button>
        ) : (
          <ul className={clsx(styles.grid, featured ? styles.featured : styles.compact)}>
            {cards.map((card) => (
              <li key={card.key} className={styles.item}>
                <TemplateCard
                  card={card}
                  size={featured ? TemplateCardSize.Featured : TemplateCardSize.Compact}
                  actionLabel={null}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
