import { z } from 'zod';
import { createDefaultPostCollectPlugins, DEFAULT_HISTORY_LIMIT } from '../../../shared/settings-defaults.js';

const collectorSchema = z.object({
	exclude_forks: z.boolean().default(true),
	excluded_repos: z.array(z.string()).default([]),
	include_origin_repos: z.boolean().default(true),
	included_extra_repos: z.array(z.string()).default([]),
	history_limit: z.number().default(DEFAULT_HISTORY_LIMIT),
});

const skillSchema = z.object({
	fresh_period_days: z.number().default(7),
});

const catalogSchema = z.object({
	skill: skillSchema.default(() => skillSchema.parse({})),
});

const uiSchema = z.object({
	title: z.string().default('Agent Skill Harbor'),
});

const postCollectPluginSchema = z.object({
	id: z.string(),
	short_label: z.string().optional(),
	config: z.record(z.string(), z.unknown()).optional(),
});

const postCollectSchema = z.object({
	plugins: z.array(postCollectPluginSchema).default(() => createDefaultPostCollectPlugins()),
});

export const settingsSchema = z.object({
	collector: collectorSchema.default(() => collectorSchema.parse({})),
	catalog: catalogSchema.default(() => catalogSchema.parse({})),
	post_collect: postCollectSchema.default(() => postCollectSchema.parse({})),
	ui: uiSchema.default(() => uiSchema.parse({})),
});

export type SettingsConfig = z.infer<typeof settingsSchema>;
