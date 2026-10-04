import { argv } from 'node:process';
import { runCommand } from './dev/commands.helpers.ts';

process.exitCode = await runCommand(argv.slice(2));
