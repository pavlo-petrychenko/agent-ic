import { useTranslation } from 'react-i18next';
import { useTeamMembers } from '@/features/settings/communication/hooks/useTeamMembers';
import { LAST_ACTIVE_FORMAT } from '@/features/settings/constants/member.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { formatDate } from '@/features/settings/logic/helpers/format.helpers';
import { MemberList } from '@/features/settings/view/MemberList';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function MembersPanel() {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { locale } = useLocale();
  const { members } = useTeamMembers();

  return (
    <MemberList
      rows={members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        initials: toInitials(member.name),
        roleLabel: tCommon(`roles.name.${member.role}`),
        lastActive:
          member.lastActiveAt === null
            ? t('team.members.never')
            : formatDate(member.lastActiveAt, locale, LAST_ACTIVE_FORMAT),
      }))}
    />
  );
}
