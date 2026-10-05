import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { ChatBubble } from '@/shared/ui/chat/ChatBubble/ChatBubble';
import {
  ChatBubbleView,
  WIDGET_ACCENT_PROPERTY,
} from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import type { WidgetAccentStyle } from '@/shared/ui/chat/ChatBubble/ChatBubble.typedefs';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator/TypingIndicator';
import { WidgetComposer } from '@/shared/ui/chat/WidgetComposer/WidgetComposer';
import { WidgetLauncher } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher';
import { WIDGET_PREVIEW_BUBBLE_FROM } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.constants';
import type { WidgetPreviewProps } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.typedefs';
import { Avatar } from '@/shared/ui/display/Avatar/Avatar';
import { AvatarSize } from '@/shared/ui/display/Avatar/Avatar.constants';
import styles from '@/shared/ui/chat/WidgetPreview/WidgetPreview.module.scss';

export function WidgetPreview({
  stageLabel,
  name,
  subtitle,
  initials,
  accent,
  messages,
  typingLabel,
  open,
  onToggle,
  openLabel,
  closeLabel,
  composerPlaceholder,
  composerLabel,
  sendLabel,
  className,
  style,
  ...rest
}: WidgetPreviewProps) {
  const panelId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const body = bodyRef.current;
    if (body !== null) {
      body.scrollTop = body.scrollHeight;
    }
  }, [messages, typingLabel, open]);

  const accentStyle: WidgetAccentStyle = { ...style, [WIDGET_ACCENT_PROPERTY]: accent };

  return (
    <div {...rest} style={accentStyle} className={clsx(styles.root, className)}>
      <span className={styles.label}>{stageLabel}</span>
      {open && (
        <dialog open id={panelId} aria-label={name} className={styles.panel}>
          <div className={styles.header}>
            <Avatar initials={initials} size={AvatarSize.Md} className={styles.avatar} />
            <div className={styles.identity}>
              <span className={styles.name}>{name}</span>
              {subtitle !== null && <span className={styles.subtitle}>{subtitle}</span>}
            </div>
          </div>
          <div ref={bodyRef} className={styles.body}>
            {messages.map((message, index) => (
              <ChatBubble
                key={`${index}-${message.text}`}
                from={WIDGET_PREVIEW_BUBBLE_FROM[message.from]}
                author={null}
                time={null}
                view={ChatBubbleView.Widget}
              >
                {message.text}
              </ChatBubble>
            ))}
            {typingLabel !== null && (
              <TypingIndicator label={typingLabel} view={ChatBubbleView.Widget} />
            )}
          </div>
          <WidgetComposer
            value={draft}
            onChange={setDraft}
            onSend={() => {
              setDraft('');
            }}
            attach={null}
            placeholder={composerPlaceholder}
            messageLabel={composerLabel}
            sendLabel={sendLabel}
            accent={accent}
          />
        </dialog>
      )}
      <WidgetLauncher
        accent={accent}
        open={open}
        onToggle={onToggle}
        label={open ? closeLabel : openLabel}
        controls={open ? panelId : null}
        className={styles.launcher}
      />
    </div>
  );
}
