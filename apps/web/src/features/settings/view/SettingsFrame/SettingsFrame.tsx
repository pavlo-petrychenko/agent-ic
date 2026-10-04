import type { SettingsFrameProps } from '@/features/settings/view/SettingsFrame/SettingsFrame.typedefs';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import styles from '@/features/settings/view/SettingsFrame/SettingsFrame.module.scss';

export function SettingsFrame({ title, nav, children }: SettingsFrameProps) {
  return (
    <div className="flex min-h-full">
      <section aria-label={title} className={styles.column}>
        <div className={styles.title}>
          <Heading size={HeadingSize.H1} as={HeadingElement.H2}>
            {title}
          </Heading>
        </div>
        <nav aria-label={title} className="flex flex-col gap-3.5">
          {nav}
        </nav>
      </section>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
