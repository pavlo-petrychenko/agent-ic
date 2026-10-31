import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { GoogleConnectionAccountStatusProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccountStatus/GoogleConnectionAccountStatus.typedefs';
import {
  GOOGLE_CONNECTION_STATUS_LABEL_KEYS,
  GOOGLE_CONNECTION_STATUS_TONES,
} from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.constants';
import { Badge } from '@/shared/ui/display/Badge';

export function GoogleConnectionAccountStatus({ status }: GoogleConnectionAccountStatusProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  return (
    <Badge tone={GOOGLE_CONNECTION_STATUS_TONES[status]} dot>
      {t(GOOGLE_CONNECTION_STATUS_LABEL_KEYS[status])}
    </Badge>
  );
}
