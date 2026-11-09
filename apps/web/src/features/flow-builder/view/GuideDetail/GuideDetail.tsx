import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  GUIDE_LINK_TARGETS,
  GUIDE_TOKENS,
  GuideType,
} from '@/features/flow-builder/constants/guide.constants';
import type { GuideDetailProps } from '@/features/flow-builder/view/GuideDetail/GuideDetail.typedefs';
import { GuideText } from '@/features/flow-builder/view/GuideDetail/GuideText';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { TextLink } from '@/shared/ui/actions/TextLink';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Card, CardTone } from '@/shared/ui/display/Card';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { FlowThumbnail } from '@/shared/ui/flow/FlowThumbnail';
import { IconName } from '@/shared/ui/foundations/Icon';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/GuideDetail/GuideDetail.module.scss';

export function GuideDetail({
  guide,
  title,
  example,
  workspaceId,
  agentId,
  focusTitle,
  onBack,
  onClose,
  onUseTemplate,
}: GuideDetailProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bullets = (texts: readonly string[]) => (
    <BulletList
      items={texts.map((text) => (
        <GuideText key={text} text={text} />
      ))}
    />
  );

  useEffect(() => {
    if (focusTitle) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [focusTitle]);

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Button variant={ButtonVariant.Ghost} size={ButtonSize.Sm} onClick={onBack}>
          {t('guide.back')}
        </Button>
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          label={t('guide.close')}
          onClick={onClose}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.hero}>
          <span className={styles.kicker}>{t(`guide.kind.${guide.type}`)}</span>
          <div className={styles.titleRow}>
            <NodeTile kind={guide.kind} icon={guide.icon} size={TileSize.Lg} />
            <Heading
              ref={headingRef}
              tabIndex={-1}
              size={HeadingSize.H2}
              as={HeadingElement.H2}
              className={styles.heading}
            >
              {title}
            </Heading>
          </div>
          <Text kind={TextKind.Lead} color={TextColor.Ink2}>
            {t(`guide.items.${guide.id}.summary`)}
          </Text>
        </div>
        {guide.type === GuideType.Component && (
          <>
            <InspectorSection title={t('guide.section.does')}>
              <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
                {t(`guide.items.${guide.id}.does`)}
              </Text>
            </InspectorSection>
            <InspectorSection title={t('guide.section.when')}>
              {bullets(t(`guide.items.${guide.id}.when`, { ...GUIDE_TOKENS, returnObjects: true }))}
            </InspectorSection>
            <InspectorSection title={t('guide.section.tips')}>
              {bullets(t(`guide.items.${guide.id}.tips`, { ...GUIDE_TOKENS, returnObjects: true }))}
            </InspectorSection>
            {example !== null && (
              <InspectorSection title={t('guide.section.example')}>
                <Card tone={CardTone.Sunken} className={styles.example}>
                  <FlowThumbnail
                    nodes={example.graph.nodes}
                    edges={example.graph.edges}
                    ariaLabel={t('guide.example.ariaLabel', { name: example.name, step: title })}
                  />
                  <div className={styles.exampleText}>
                    <Heading size={HeadingSize.H3} as={HeadingElement.H4}>
                      {example.name}
                    </Heading>
                    <Text kind={TextKind.Caption} color={TextColor.Mute}>
                      {example.description}
                    </Text>
                  </div>
                  <div>
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Sm}
                      icon={IconName.Plus}
                      onClick={() => onUseTemplate(example.key)}
                    >
                      {t('guide.example.use')}
                    </Button>
                  </div>
                </Card>
                {example.alsoIn.length > 0 && (
                  <div className={styles.alsoIn}>
                    <Text kind={TextKind.Caption} color={TextColor.Mute}>
                      {t('guide.example.alsoIn')}
                    </Text>
                    <ul className={styles.chips}>
                      {example.alsoIn.map((template) => (
                        <li key={template.key}>
                          <Button
                            variant={ButtonVariant.Secondary}
                            size={ButtonSize.Sm}
                            aria-label={t('guide.example.alsoInOpen', { name: template.name })}
                            onClick={() => onUseTemplate(template.key)}
                          >
                            {template.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </InspectorSection>
            )}
          </>
        )}
        {guide.type === GuideType.Concept && (
          <>
            <InspectorSection title={t('guide.section.points')}>
              {bullets(
                t(`guide.items.${guide.id}.points`, { ...GUIDE_TOKENS, returnObjects: true }),
              )}
            </InspectorSection>
            {guide.links.length > 0 && (
              <InspectorSection title={t('guide.section.links')}>
                <ul className={styles.links}>
                  {guide.links.map((link) => {
                    const target = GUIDE_LINK_TARGETS[link];
                    return (
                      <li key={link}>
                        <TextLink
                          to={target.to}
                          params={{ workspaceId }}
                          {...(target.withAgent ? { search: { agent: agentId } } : {})}
                        >
                          {t(`guide.link.${link}`)}
                        </TextLink>
                      </li>
                    );
                  })}
                </ul>
              </InspectorSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
