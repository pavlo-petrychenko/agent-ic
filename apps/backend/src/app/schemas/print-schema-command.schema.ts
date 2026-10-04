import { z } from 'zod';

export const printSchemaCommandSchema = z.object({ output: z.string().min(1) });
