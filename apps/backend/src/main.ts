import { resolveCommand } from '@/app/helpers/command.helpers';

const command = await resolveCommand(process.argv);
await command.execute();
