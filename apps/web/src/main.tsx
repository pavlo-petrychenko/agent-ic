import { bootstrap } from '@/app/bootstrap';
import { getThemeClient } from '@/shared/theme/clients/theme.client';
import '@/shared/styles';

getThemeClient();
void bootstrap();
