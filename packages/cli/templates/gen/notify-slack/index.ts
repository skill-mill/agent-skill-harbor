import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const HIGHLIGHT_INTENTS = new Set(['danger']);
// Edit this set if you want to highlight other intents such as 'warn'.

interface CategoryStats {
	repos: number;
	repos_with_skills: number;
	skills: number;
	files: number;
}

interface CollectEntry {
	collect_id?: string;
	collecting: {
		collected_at: string;
		duration_sec: number;
	};
	statistics: {
		org: CategoryStats;
		community: CategoryStats;
	};
}

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

function loadYamlArray<T>(filePath: string): T[] {
	if (!existsSync(filePath)) return [];
	try {
		const raw = yamlLoad(readFileSync(filePath, 'utf-8'));
		return Array.isArray(raw) ? (raw as T[]) : [];
	} catch {
		return [];
	}
}

function parseConfig(pluginConfig: Record<string, unknown> | undefined): NotifySlackConfig {
	return {
		webhook_url: typeof pluginConfig?.webhook_url === 'string' ? pluginConfig.webhook_url : undefined,
		disable_send: pluginConfig?.disable_send === true,
		use_debug_message: pluginConfig?.use_debug_message === true,
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
	currentPluginId: string | undefined,
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

function summarizeWarnings(pluginId: string, entry: SavedPluginEntry): string | null {
	const labelIntents = entry.label_intents ?? {};
	const counts = new Map<string, number>();

	for (const result of Object.values(entry.results ?? {})) {
		const label = typeof result?.label === 'string' ? result.label : undefined;
		if (!label) continue;
		const intent = labelIntents[label];
		if (!intent || !HIGHLIGHT_INTENTS.has(intent)) continue;
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	if (counts.size === 0) return null;
	const details = Array.from(counts.entries())
		.map(([label, count]) => `${label}: ${count}`)
		.join(', ');
	return `${pluginId}: ${details}`;
}

function buildNotification(collectId: string | null, collectEntry: CollectEntry | undefined, pluginEntries: { pluginId: string; entry: SavedPluginEntry }[]) {
	const collectedAt = collectEntry?.collecting.collected_at ?? 'unknown';
	const collectSummaryLines = collectEntry
		? [
				formatCategorySummary('Org', collectEntry.statistics.org),
				formatCategorySummary('Community', collectEntry.statistics.community),
			]
		: ['Collect summary not found for this run.'];
	const pluginSummaryLines =
		pluginEntries.length > 0
			? pluginEntries.map(
					({ pluginId, entry }) => `- *${pluginId}*: ${entry.summary ?? 'No summary provided.'}`,
				)
			: ['- No plugin summaries available.'];
	const warningLines = pluginEntries
		.map(({ pluginId, entry }) => summarizeWarnings(pluginId, entry))
		.filter((line): line is string => line !== null);

	const textLines = [
		`Agent Skill Harbor post-collect summary (${collectedAt})`,
		...collectSummaryLines,
		'Plugin summaries:',
		...pluginSummaryLines.map((line) => line.replace(/^\- \*/, '- ').replace(/\*:/g, ':')),
		'Warnings:',
		...(warningLines.length > 0 ? warningLines : ['No highlighted warnings.']),
	];

	const blocks: SlackBlock[] = [
		{
			type: 'header',
			text: { type: 'plain_text', text: 'Agent Skill Harbor post-collect summary', emoji: true },
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
				text: `*Warnings*\n${warningLines.length > 0 ? warningLines.join('\n') : 'No highlighted warnings.'}`,
			},
		},
	];

	return {
		text: textLines.join('\n'),
		blocks,
		warningCount: warningLines.length,
		pluginSummaryCount: pluginEntries.length,
		collectedAt,
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

export async function run(context: {
	plugin_id?: string;
	collect_id: string | null;
	paths: {
		data_dir: string;
		collects_yaml: string;
	};
	plugin_config?: Record<string, unknown>;
}) {
	const config = parseConfig(context.plugin_config);
	const collectEntries = loadYamlArray<CollectEntry>(context.paths.collects_yaml);
	const collectEntry = selectCollectEntry(collectEntries, context.collect_id);
	const pluginEntries = collectPluginEntries(context.paths.data_dir, context.collect_id, context.plugin_id);
	const notification = config.use_debug_message
		? {
				text: `notify-slack debug message for collect ${context.collect_id ?? 'latest'}`,
				blocks: [
					{
						type: 'section' as const,
						text: {
							type: 'mrkdwn' as const,
							text: `*notify-slack debug message*\ncollect_id: ${context.collect_id ?? 'latest'}`,
						},
					},
				],
				warningCount: 0,
				pluginSummaryCount: pluginEntries.length,
				collectedAt: collectEntry?.collecting.collected_at ?? 'unknown',
			}
		: buildNotification(context.collect_id, collectEntry, pluginEntries);

	if (config.disable_send) {
		console.log('[notify-slack] Slack send disabled by config.disable_send=true');
		console.log(notification.text);
	} else if (!config.webhook_url) {
		console.log('[notify-slack] Slack webhook_url is not configured; skipping send');
		console.log(notification.text);
	} else {
		await postToSlack(config.webhook_url, {
			text: notification.text,
			blocks: notification.blocks,
		});
	}

	return {
		persist: false,
		summary: `Prepared Slack notification with ${notification.pluginSummaryCount} plugin summary section(s) and ${notification.warningCount} highlighted warning section(s).`,
	};
}
