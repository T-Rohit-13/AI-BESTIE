import { z } from 'zod';

export const updateDumpRemindersSchema = z.object({
  enabled: z.boolean({
    required_error: 'Field "enabled" is required and must be a boolean.',
    invalid_type_error: 'Field "enabled" must be a boolean.',
  }),
});

export const registerPushTokenSchema = z.object({
  token: z
    .string({
      required_error: 'Field "token" is required.',
      invalid_type_error: 'Field "token" must be a string.',
    })
    .trim()
    .min(5, 'Push token must be at least 5 characters long.')
    .max(1024, 'Push token exceeds maximum length of 1024 characters.'),
  platform: z
    .enum(['web', 'android', 'ios'], {
      invalid_type_error: 'Platform must be one of: web, android, ios.',
    })
    .optional()
    .default('web'),
});

export type UpdateDumpRemindersInput = z.infer<typeof updateDumpRemindersSchema>;
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
