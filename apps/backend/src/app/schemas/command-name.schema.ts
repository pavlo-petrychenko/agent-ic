import { z } from 'zod';
import { CommandName } from '@/app/constants/command.constants';

export const commandNameSchema = z.enum(CommandName);
