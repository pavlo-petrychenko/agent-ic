import { z } from 'zod';

export const googleDriveErrorSchema = z.object({
  error: z.object({
    errors: z.array(z.object({ reason: z.string().optional() })).optional(),
  }),
});

export const googleDriveFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  webViewLink: z.string().nullable().optional(),
  modifiedTime: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  trashed: z.boolean().optional(),
});
