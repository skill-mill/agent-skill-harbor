import { z } from 'zod';

export const usagePolicySchema = z.enum(['recommended', 'discouraged', 'prohibited', 'none']);

export const governancePolicySchema = z.object({
	usage_policy: usagePolicySchema,
	note: z.string().optional(),
});

export const governanceSchema = z.object({
	policies: z.record(z.string(), governancePolicySchema).default({}),
});

export type GovernanceConfig = z.infer<typeof governanceSchema>;
