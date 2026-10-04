import { resolveCommand } from '@/app/helpers/command.helpers';

await resolveCommand(process.argv).execute();
