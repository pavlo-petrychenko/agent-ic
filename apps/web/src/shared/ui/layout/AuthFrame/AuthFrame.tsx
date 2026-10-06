import clsx from 'clsx';
import { Card, CardElement, CardGap, CardPad } from '@/shared/ui/display/Card';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { AuthCardSize } from '@/shared/ui/layout/AuthFrame/AuthFrame.constants';
import type { AuthFrameProps } from '@/shared/ui/layout/AuthFrame/AuthFrame.typedefs';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/shared/ui/layout/AuthFrame/AuthFrame.module.scss';

export function AuthFrame({
  brandName,
  size = AuthCardSize.Md,
  title = null,
  subtitle = null,
  footer = null,
  className,
  children,
  ...rest
}: AuthFrameProps) {
  return (
    <div {...rest} className={clsx(styles.root, className)}>
      <div className={styles.brand}>
        <NodeTile kind={NodeKind.Accent} size={TileSize.Md} aria-hidden="true" />
        <span className={styles.brandName}>{brandName}</span>
      </div>
      <main className={clsx(styles.main, styles[size])}>
        <Card as={CardElement.Div} pad={CardPad.Xl} gap={CardGap.Xl}>
          {(title !== null || subtitle !== null) && (
            <div className={styles.heading}>
              {title !== null && (
                <Heading size={HeadingSize.H2} as={HeadingElement.H1}>
                  {title}
                </Heading>
              )}
              {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          )}
          {children}
        </Card>
      </main>
      {footer !== null && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}
