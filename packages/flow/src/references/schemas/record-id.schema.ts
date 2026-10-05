import { z } from 'zod';

export const recordIdSchema = z.string().min(1);
