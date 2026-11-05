import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { GoogleConnectionBannerProps } from '@/features/knowledge/view/GoogleConnectionBanner/GoogleConnectionBanner.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';

export function GoogleConnectionBanner({
  connections,
  reconnecting,
  onReconnect,
}: GoogleConnectionBannerProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {connections.map((connection) => (
        <Callout
          key={connection.id}
          tone={CalloutTone.Err}
          icon={IconName.Alert}
          action={
            onReconnect === null ? null : (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Sm}
                loading={reconnecting}
                onClick={onReconnect}
              >
                {t('sources.reconnect.action')}
              </Button>
            )
          }
        >
          {t('sources.reconnect.message', { email: connection.accountEmail })}
        </Callout>
      ))}
    </div>
  );
}
