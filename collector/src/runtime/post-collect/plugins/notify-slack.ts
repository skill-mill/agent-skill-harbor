import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { BuiltinPostCollectPlugin, LabelIntent } from '../types.js';
import { type CollectEntry, type CategoryStats } from '../../collects.js';
import { loadYamlArray } from '../../shared/yaml.js';
import { isLabelIntent } from '../label-intent.js';

const DEFAULT_HIGHLIGHT_INTENTS = new Set<LabelIntent>(['warn', 'danger']);
// Keep this list narrow by default. Add or remove intents here if the built-in default should change.

interface SavedPluginEntry {
	collect_id?: string;
	summary?: string;
	label_intents?: Record<string, string>;
	results?: Record<string, { label?: string }>;
}

interface NotifySlackConfig {
	webhook_url?: string;
	disable_send?: boolean;
	use_debug_message?: boolean;
	highlight_intents?: LabelIntent[];
}

interface SlackTextObject {
	type: 'mrkdwn' | 'plain_text';
	text: string;
	emoji?: boolean;
}

interface SlackBlock {
	type: 'header' | 'section' | 'divider' | 'context';
	text?: SlackTextObject;
	elements?: SlackTextObject[];
}

function parseConfig(pluginConfig: Record<string, unknown> | undefined): NotifySlackConfig {
	const highlightIntents = Array.isArray(pluginConfig?.highlight_intents)
		? pluginConfig.highlight_intents.filter((intent): intent is LabelIntent => isLabelIntent(intent))
		: undefined;

	return {
		webhook_url: typeof pluginConfig?.webhook_url === 'string' ? pluginConfig.webhook_url : undefined,
		disable_send: pluginConfig?.disable_send === true,
		use_debug_message: pluginConfig?.use_debug_message === true,
		highlight_intents: highlightIntents && highlightIntents.length > 0 ? highlightIntents : undefined,
	};
}

function selectCollectEntry(entries: CollectEntry[], collectId: string | null): CollectEntry | undefined {
	if (collectId) {
		return entries.find((entry) => entry.collect_id === collectId);
	}
	return entries[0];
}

function selectPluginEntry(entries: SavedPluginEntry[], collectId: string | null): SavedPluginEntry | undefined {
	if (collectId) {
		return entries.find((entry) => entry.collect_id === collectId);
	}
	return entries[0];
}

function formatCategorySummary(name: string, stats: CategoryStats): string {
	return `${name}: ${stats.repos} repos (${stats.repos_with_skills} with skills), ${stats.skills} skills, ${stats.files} files`;
}

function collectPluginEntries(
	dataDir: string,
	collectId: string | null,
	currentPluginId: string,
): { pluginId: string; entry: SavedPluginEntry }[] {
	const pluginsDir = join(dataDir, 'plugins');
	if (!existsSync(pluginsDir)) return [];

	return readdirSync(pluginsDir)
		.filter((fileName) => fileName.endsWith('.yaml'))
		.map((fileName) => {
			const pluginId = fileName.slice(0, -'.yaml'.length);
			if (pluginId === currentPluginId) return null;
			const entry = selectPluginEntry(loadYamlArray<SavedPluginEntry>(join(pluginsDir, fileName)), collectId);
			return entry ? { pluginId, entry } : null;
		})
		.filter((value): value is { pluginId: string; entry: SavedPluginEntry } => value !== null);
}

function summarizeWarnings(
	pluginId: string,
	entry: SavedPluginEntry,
	highlightIntents: ReadonlySet<LabelIntent>,
): string | null {
	const labelIntents = entry.label_intents ?? {};
	const counts = new Map<string, number>();

	for (const result of Object.values(entry.results ?? {})) {
		const label = typeof result?.label === 'string' ? result.label : undefined;
		if (!label) continue;
		const intent = labelIntents[label];
		if (
			intent !== 'neutral' &&
			intent !== 'info' &&
			intent !== 'success' &&
			intent !== 'warn' &&
			intent !== 'danger'
		)
			continue;
		if (!highlightIntents.has(intent)) continue;
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	if (counts.size === 0) return null;
	const details = Array.from(counts.entries())
		.map(([label, count]) => `${label}: ${count}`)
		.join(', ');
	return `${pluginId}: ${details}`;
}

function buildNotification(
	collectId: string | null,
	collectEntry: CollectEntry | undefined,
	pluginEntries: { pluginId: string; entry: SavedPluginEntry }[],
	highlightIntents: ReadonlySet<LabelIntent>,
) {
	const collectedAt = collectEntry?.collecting.collected_at ?? 'unknown';
	const collectSummaryLines = collectEntry
		? [
				formatCategorySummary('Org', collectEntry.statistics.org),
				formatCategorySummary('Community', collectEntry.statistics.community),
			]
		: ['Collect summary not found for this run.'];
	const pluginSummaryLines =
		pluginEntries.length > 0
			? pluginEntries.map(({ pluginId, entry }) => `- *${pluginId}*: ${entry.summary ?? 'No summary provided.'}`)
			: ['- No plugin summaries available.'];
	const warningLines = pluginEntries
		.map(({ pluginId, entry }) => summarizeWarnings(pluginId, entry, highlightIntents))
		.filter((line): line is string => line !== null);

	const textLines = [
		`Agent Skill Harbor collected summary (${collectedAt})`,
		...collectSummaryLines,
		'Plugin summaries:',
		...pluginSummaryLines.map((line) => line.replace(/^\- \*/, '- ').replace(/\*:/g, ':')),
		'Highlights:',
		...(warningLines.length > 0 ? warningLines : ['No highlights.']),
	];

	const blocks: SlackBlock[] = [
		{
			type: 'header',
			text: { type: 'plain_text', text: 'Agent Skill Harbor collected summary', emoji: true },
		},
		{
			type: 'context',
			elements: [
				{ type: 'mrkdwn', text: `collect_id: ${collectId ?? 'latest'}` },
				{ type: 'mrkdwn', text: `collected_at: ${collectedAt}` },
			],
		},
		{ type: 'divider' },
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Collect summary*\n${collectSummaryLines.join('\n')}`,
			},
		},
		{ type: 'divider' },
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Plugin summaries*\n${pluginSummaryLines.join('\n')}`,
			},
		},
		{ type: 'divider' },
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Highlights*\n${warningLines.length > 0 ? warningLines.join('\n') : 'No highlights.'}`,
			},
		},
	];

	return {
		text: textLines.join('\n'),
		blocks,
		warningCount: warningLines.length,
		pluginSummaryCount: pluginEntries.length,
	};
}

async function postToSlack(webhookUrl: string, payload: { text: string; blocks: SlackBlock[] }): Promise<void> {
	const response = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		throw new Error(`Slack webhook request failed: ${response.status} ${response.statusText}`);
	}
}

export const notifySlackPlugin: BuiltinPostCollectPlugin = {
	id: 'builtin.notify-slack',
	async run(context) {
		const config = parseConfig(context.plugin_config);
		const highlightIntents = new Set(config.highlight_intents ?? DEFAULT_HIGHLIGHT_INTENTS);
		const collectEntries = loadYamlArray<CollectEntry>(context.paths.collects_yaml);
		const collectEntry = selectCollectEntry(collectEntries, context.collect_id);
		const pluginEntries = collectPluginEntries(context.paths.data_dir, context.collect_id, context.plugin_id);
		const notification = config.use_debug_message
			? {
					text: `DEBUG notify-slack message for collect ${context.collect_id ?? 'latest'}`,
					blocks: [
						{
							type: 'section' as const,
							text: {
								type: 'mrkdwn' as const,
								text: `*DEBUG notify-slack message*\ncollect_id: ${context.collect_id ?? 'latest'}`,
							},
						},
					],
					warningCount: 0,
					pluginSummaryCount: pluginEntries.length,
				}
			: buildNotification(context.collect_id, collectEntry, pluginEntries, highlightIntents);

		if (config.disable_send) {
			console.log('[builtin.notify-slack] Slack send disabled by config.disable_send=true');
			console.log(notification.text);
		} else if (!config.webhook_url) {
			console.log('[builtin.notify-slack] Slack webhook_url is not configured; skipping send');
			console.log(notification.text);
		} else {
			await postToSlack(config.webhook_url, {
				text: notification.text,
				blocks: notification.blocks,
			});
		}

		return {
			persist: false,
			summary: `Prepared Slack notification with ${notification.pluginSummaryCount} plugin summary section(s) and ${notification.warningCount} highlighted section(s).`,
		};
	},
};
