import { Octokit } from '@octokit/rest';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	createCollectHistoryEntry,
	prependCollectHistoryEntry,
	type CategoryStats,
	type CollectHistoryEntry,
} from './collect-history.js';
import {
	normalizeResolvedFromFrontmatter,
	normalizeResolvedFromSkillsLock,
	parseProjectSkillsLock,
	resolveSkillLookupName,
	type ProjectSkillsLockEntry,
} from './resolved-from.js';

const PROJECT_ROOT = process.env.SKILL_HARBOR_ROOT || join(import.meta.dirname, '..', '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const SKILLS_YAML_PATH = join(DATA_DIR, 'skills.yaml');
const CONFIG_DIR = join(PROJECT_ROOT, 'config');
const SETTINGS_PATH = join(CONFIG_DIR, 'harbor.yaml');

interface SettingsConfig {
	collector?: {
		exclude_forks?: boolean;
		excluded_repos?: string[];
		include_origin_repos?: boolean;
		included_extra_repos?: string[];
		history_limit?: number;
	};
}

function loadSettings(): SettingsConfig {
	if (!existsSync(SETTINGS_PATH)) {
		return {};
	}
	try {
		const raw = yamlLoad(readFileSync(SETTINGS_PATH, 'utf-8'));
		if (!raw || typeof raw !== 'object') return {};
		return raw as SettingsConfig;
	} catch {
		return {};
	}
}

interface SkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	resolved_from?: string;
	drift_status?: 'drifted' | 'in_sync' | 'unknown';
}

interface RepositoryEntry {
	visibility: string;
	repo_sha?: string;
	fork?: boolean;
	skills: Record<string, SkillEntry>;
}

interface CatalogYaml {
	repositories: Record<string, RepositoryEntry>;
}

interface TreeEntry {
	path?: string;
	mode?: string;
	type?: string;
	sha?: string;
	size?: number;
}

interface DiscoveredSkill {
	skillPath: string;
	dirPath: string | null;
	treeSha: string | null;
	filePaths: string[];
}

interface RepoTarget {
	owner: string;
	repo: string;
	default_branch: string;
	html_url: string;
	visibility: string;
	fork: boolean;
	source: 'org' | 'from' | 'extra';
}

interface ParsedFromRef {
	owner: string;
	repo: string;
	repoKey: string;
	sha: string | null;
}

interface ParsedResolvedFrom {
	platform: string;
	owner: string;
	repo: string;
	repoKey: string;
	sha: string | null;
}

interface LoadedProjectSkillsLock {
	raw: string | null;
	entries: Map<string, ProjectSkillsLockEntry>;
}

function loadCatalog(): CatalogYaml {
	if (!existsSync(SKILLS_YAML_PATH)) {
		return { repositories: {} };
	}
	try {
		const raw = yamlLoad(readFileSync(SKILLS_YAML_PATH, 'utf-8')) as CatalogYaml;
		return raw?.repositories ? raw : { repositories: {} };
	} catch {
		return { repositories: {} };
	}
}

function saveCatalog(catalog: CatalogYaml & { meta?: unknown }): void {
	const { meta: _meta, ...rest } = catalog;
	writeFileSync(SKILLS_YAML_PATH, yamlDump(sanitizeCatalogForSave(rest), { lineWidth: 120, noRefs: true }));
}

export function sanitizeCatalogForSave(catalog: CatalogYaml): CatalogYaml {
	return {
		repositories: Object.fromEntries(
			Object.entries(catalog.repositories).map(([repoKey, repoEntry]) => [
				repoKey,
				{
					visibility: repoEntry.visibility,
					...(repoEntry.repo_sha ? { repo_sha: repoEntry.repo_sha } : {}),
					...(repoEntry.fork ? { fork: true } : {}),
					skills: Object.fromEntries(
						Object.entries(repoEntry.skills).map(([skillPath, skillEntry]) => [
							skillPath,
							{
								tree_sha: skillEntry.tree_sha,
								...(skillEntry.updated_at ? { updated_at: skillEntry.updated_at } : {}),
								...(skillEntry.registered_at ? { registered_at: skillEntry.registered_at } : {}),
								...(skillEntry.resolved_from ? { resolved_from: skillEntry.resolved_from } : {}),
								...(skillEntry.drift_status ? { drift_status: skillEntry.drift_status } : {}),
							},
						]),
					),
				},
			]),
		),
	};
}

function countFilesRecursive(dir: string): number {
	let count = 0;
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isFile()) count++;
		else if (stat.isDirectory()) count += countFilesRecursive(fullPath);
	}
	return count;
}

function computeStatistics(catalog: CatalogYaml, org: string): { org: CategoryStats; community: CategoryStats } {
	const stats = {
		org: { repos: 0, repos_with_skills: 0, skills: 0, files: 0 },
		community: { repos: 0, repos_with_skills: 0, skills: 0, files: 0 },
	};
	for (const [repoKey, repoEntry] of Object.entries(catalog.repositories)) {
		const owner = repoKey.split('/')[1];
		const category = owner === org ? 'org' : 'community';
		stats[category].repos++;
		const skillCount = Object.keys(repoEntry.skills).length;
		if (skillCount > 0) stats[category].repos_with_skills++;
		stats[category].skills += skillCount;
		const repoDir = join(SKILLS_DIR, repoKey);
		if (existsSync(repoDir)) {
			stats[category].files += countFilesRecursive(repoDir);
		}
	}
	return stats;
}

function saveFile(repoDir: string, filePath: string, content: string): void {
	const fullPath = join(repoDir, filePath);
	const dir = dirname(fullPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(fullPath, content);
}

function parseFrontmatter(content: string): Record<string, unknown> {
	if (!content.startsWith('---')) return {};
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return {};

	try {
		const parsed = yamlLoad(match[1]);
		if (!parsed || typeof parsed !== 'object') return {};
		const frontmatter = { ...(parsed as Record<string, unknown>) };
		delete frontmatter._excerpt;
		return frontmatter;
	} catch {
		return {};
	}
}

function readFrontmatterFromSavedSkill(repoDir: string, skillPath: string): Record<string, unknown> {
	const fullPath = join(repoDir, skillPath);
	if (!existsSync(fullPath)) return {};
	try {
		return parseFrontmatter(readFileSync(fullPath, 'utf-8'));
	} catch {
		return {};
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
	if (error && typeof error === 'object' && 'status' in error) {
		const status = (error as { status: number }).status;
		return status === 500 || status === 502 || status === 503;
	}
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('socket hang up');
	}
	return false;
}

function formatApiError(error: unknown): string {
	if (error && typeof error === 'object' && 'status' in error) {
		const status = (error as { status: number }).status;
		const msg =
			'message' in error && typeof (error as { message: unknown }).message === 'string'
				? (error as { message: string }).message
				: '';
		return `HTTP ${status}${msg ? `: ${msg}` : ''}`;
	}
	return error instanceof Error ? error.message : String(error);
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt < maxRetries && isRetryableError(error)) {
				const delaySec = 2 ** attempt; // 1s, 2s, 4s
				console.log(
					`  [retry] ${label}: ${formatApiError(error)} — retrying in ${delaySec}s (${attempt + 1}/${maxRetries})`,
				);
				await sleep(delaySec * 1000);
				continue;
			}
			throw error;
		}
	}
	throw new Error('unreachable');
}

async function checkRateLimit(octokit: Octokit): Promise<void> {
	try {
		const { data } = await octokit.rateLimit.get();
		const remaining = data.resources.core.remaining;
		const resetAt = data.resources.core.reset * 1000;

		if (remaining < 100) {
			const waitMs = resetAt - Date.now() + 1000;
			if (waitMs > 0) {
				console.log(`Rate limit low (${remaining} remaining). Waiting ${Math.ceil(waitMs / 1000)}s...`);
				await sleep(waitMs);
			}
		}
	} catch {
		// rate_limit API itself failed (e.g. 503) — continue without blocking
	}
}

function discoverSkillsFromTree(treeEntries: TreeEntry[]): DiscoveredSkill[] {
	const skillMdEntries = treeEntries.filter((e) => e.type === 'blob' && e.path?.endsWith('/SKILL.md'));
	const rootSkillMd = treeEntries.find((e) => e.type === 'blob' && e.path === 'SKILL.md');
	const skills: DiscoveredSkill[] = [];

	if (rootSkillMd) {
		skills.push({
			skillPath: 'SKILL.md',
			dirPath: null,
			treeSha: null,
			filePaths: ['SKILL.md'],
		});
	}

	for (const entry of skillMdEntries) {
		const skillPath = entry.path!;
		const dirPath = skillPath.replace(/\/SKILL\.md$/, '');
		const dirTreeEntry = treeEntries.find((e) => e.type === 'tree' && e.path === dirPath);
		const treeSha = dirTreeEntry?.sha ?? null;
		const filePaths = treeEntries
			.filter((e) => e.type === 'blob' && e.path?.startsWith(`${dirPath}/`))
			.map((e) => e.path!)
			.sort();

		skills.push({
			skillPath,
			dirPath,
			treeSha,
			filePaths,
		});
	}

	return skills;
}

async function findSkillFilesFallback(octokit: Octokit, owner: string, repo: string): Promise<DiscoveredSkill[]> {
	const skills: DiscoveredSkill[] = [];

	try {
		const { data } = await octokit.repos.getContent({ owner, repo, path: 'SKILL.md' });
		if (!Array.isArray(data) && data.type === 'file') {
			skills.push({
				skillPath: 'SKILL.md',
				dirPath: null,
				treeSha: null,
				filePaths: ['SKILL.md'],
			});
		}
	} catch {
		// Not found at root
	}

	try {
		const { data } = await octokit.repos.getContent({ owner, repo, path: '.claude/skills' });
		if (Array.isArray(data)) {
			for (const item of data) {
				if (item.type === 'dir') {
					try {
						const { data: skillFile } = await octokit.repos.getContent({
							owner,
							repo,
							path: `${item.path}/SKILL.md`,
						});
						if (!Array.isArray(skillFile) && skillFile.type === 'file') {
							skills.push({
								skillPath: `${item.path}/SKILL.md`,
								dirPath: item.path,
								treeSha: null,
								filePaths: [`${item.path}/SKILL.md`],
							});
						}
					} catch {
						// No SKILL.md in this skill directory
					}
				}
			}
		}
	} catch {
		// No .claude/skills directory
	}

	return skills;
}

async function fetchFileContent(octokit: Octokit, owner: string, repo: string, path: string): Promise<string> {
	const { data } = await withRetry(() => octokit.repos.getContent({ owner, repo, path }), `${owner}/${repo}/${path}`);
	if (Array.isArray(data) || data.type !== 'file' || !data.content) {
		throw new Error(`Unexpected response for ${path}`);
	}
	return Buffer.from(data.content, 'base64').toString('utf-8');
}

async function fetchOptionalFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
): Promise<string | null> {
	try {
		return await fetchFileContent(octokit, owner, repo, path);
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
			return null;
		}
		throw error;
	}
}

function normalizeRepoKey(platform: string, owner: string, repo: string): string {
	return `${platform}/${owner}/${repo}`;
}

function parseFromRepoRef(platform: string, from: unknown): ParsedFromRef | null {
	if (typeof from !== 'string') return null;
	const trimmed = from.trim();
	const match = trimmed.match(/^([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return {
		owner: match[1],
		repo: match[2],
		repoKey: normalizeRepoKey(platform, match[1], match[2]),
		sha: match[3] ?? null,
	};
}

function parseResolvedFromRef(from: string): ParsedResolvedFrom | null {
	const trimmed = from.trim();
	const match = trimmed.match(/^([^/\s]+)\/([^/\s]+)\/([^@\s]+)(?:@(.+))?$/);
	if (!match) return null;
	return {
		platform: match[1],
		owner: match[2],
		repo: match[3],
		repoKey: normalizeRepoKey(match[1], match[2], match[3]),
		sha: match[4] ?? null,
	};
}

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
	const match = url.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/.]+)\/?$/);
	if (!match) return null;
	return { owner: match[1], repo: match[2] };
}

export function collectFromResolvedFrom(
	platform: string,
	resolvedFrom: string | undefined,
	seenRepoKeys: Set<string>,
	queuedRepoKeys: Set<string>,
): ParsedFromRef[] {
	if (!resolvedFrom) return [];
	const parsed = parseResolvedFromRef(resolvedFrom);
	if (!parsed || parsed.platform !== platform) return [];
	if (seenRepoKeys.has(parsed.repoKey) || queuedRepoKeys.has(parsed.repoKey)) return [];
	queuedRepoKeys.add(parsed.repoKey);
	return [
		{
			owner: parsed.owner,
			repo: parsed.repo,
			repoKey: parsed.repoKey,
			sha: parsed.sha,
		},
	];
}

function resolveSkillResolvedFrom(
	frontmatter: Record<string, unknown>,
	skillPath: string,
	lockEntries: Map<string, ProjectSkillsLockEntry>,
	platform: string,
): string | null {
	return (
		normalizeResolvedFromFrontmatter(frontmatter._from, platform) ??
		normalizeResolvedFromSkillsLock(resolveSkillLookupName(frontmatter, skillPath), lockEntries, platform)
	);
}

function resolveSkillIdentity(frontmatter: Record<string, unknown>, skillPath: string): string | null {
	return resolveSkillLookupName(frontmatter, skillPath);
}

export function updateDriftStatus(
	catalog: CatalogYaml,
	readFrontmatter: (repoKey: string, skillPath: string) => Record<string, unknown>,
): void {
	const skillIdentityCache = new Map<string, string | null>();

	function getSkillIdentity(repoKey: string, skillPath: string): string | null {
		const cacheKey = `${repoKey}:${skillPath}`;
		if (skillIdentityCache.has(cacheKey)) {
			return skillIdentityCache.get(cacheKey) ?? null;
		}
		const identity = resolveSkillIdentity(readFrontmatter(repoKey, skillPath), skillPath);
		skillIdentityCache.set(cacheKey, identity);
		return identity;
	}

	for (const [repoKey, repoEntry] of Object.entries(catalog.repositories)) {
		for (const [skillPath, skillEntry] of Object.entries(repoEntry.skills)) {
			if (!skillEntry.resolved_from) {
				delete skillEntry.drift_status;
				continue;
			}

			const parsed = parseResolvedFromRef(skillEntry.resolved_from);
			if (!parsed?.sha) {
				skillEntry.drift_status = 'unknown';
				continue;
			}

			const originRepo = catalog.repositories[parsed.repoKey];
			if (!originRepo) {
				skillEntry.drift_status = 'unknown';
				continue;
			}

			const identity = getSkillIdentity(repoKey, skillPath);
			if (!identity) {
				skillEntry.drift_status = 'unknown';
				continue;
			}

			const originMatch = Object.entries(originRepo.skills).find(([originSkillPath]) => {
				return getSkillIdentity(parsed.repoKey, originSkillPath) === identity;
			});
			if (!originMatch) {
				skillEntry.drift_status = 'unknown';
				continue;
			}

			const [, originSkillEntry] = originMatch;
			if (!originSkillEntry.tree_sha) {
				skillEntry.drift_status = 'unknown';
				continue;
			}

			skillEntry.drift_status = originSkillEntry.tree_sha.startsWith(parsed.sha) ? 'in_sync' : 'drifted';
		}
	}
}

async function loadProjectSkillsLock(
	octokit: Octokit,
	target: RepoTarget,
	repoDir: string,
	fetchRemote: boolean,
): Promise<LoadedProjectSkillsLock> {
	const localPath = join(repoDir, 'skills-lock.json');
	if (!fetchRemote) {
		if (!existsSync(localPath)) return { raw: null, entries: new Map() };
		const raw = readFileSync(localPath, 'utf-8');
		return { raw, entries: parseProjectSkillsLock(raw) };
	}

	const raw = await fetchOptionalFileContent(octokit, target.owner, target.repo, 'skills-lock.json');
	if (raw == null) {
		if (existsSync(localPath)) unlinkSync(localPath);
		return { raw: null, entries: new Map() };
	}
	saveFile(repoDir, 'skills-lock.json', raw);
	return { raw, entries: parseProjectSkillsLock(raw) };
}

async function fetchRepoTarget(
	octokit: Octokit,
	platform: string,
	owner: string,
	repo: string,
	source: 'from' | 'extra' = 'from',
): Promise<RepoTarget | null> {
	const label = source === 'extra' ? 'included_extra_repos' : 'resolved_from';
	try {
		await checkRateLimit(octokit);
		const { data } = await withRetry(() => octokit.repos.get({ owner, repo }), `${owner}/${repo}`);
		if (data.private) {
			console.log(`  [skip] ${owner}/${repo} (via ${label}, not public)`);
			return null;
		}
		return {
			owner,
			repo,
			default_branch: data.default_branch ?? 'main',
			html_url: data.html_url,
			visibility: 'public',
			fork: data.fork,
			source,
		};
	} catch (error) {
		console.log(`  [skip] ${owner}/${repo} (via ${label}, unavailable: ${formatApiError(error)})`);
		return null;
	}
}

async function collectRepoSkills(
	octokit: Octokit,
	platform: string,
	target: RepoTarget,
	catalog: CatalogYaml,
	fromRefs: ParsedFromRef[],
	seenRepoKeys: Set<string>,
	queuedRepoKeys: Set<string>,
	counts: {
		collectedRepoCount: number;
		collectedCount: number;
		collectedFileCount: number;
		skippedRepoCount: number;
		skippedSkillCount: number;
	},
	collectFromRefs: boolean,
): Promise<void> {
	const repoKey = normalizeRepoKey(platform, target.owner, target.repo);
	const existingRepo = catalog.repositories[repoKey];

	await checkRateLimit(octokit);
	const repoLabel = `${target.owner}/${target.repo}`;
	const { data: branchData } = await withRetry(
		() =>
			octokit.repos.getBranch({
				owner: target.owner,
				repo: target.repo,
				branch: target.default_branch,
			}),
		repoLabel,
	);
	const headSha = branchData.commit.sha;

	const repoDir = join(SKILLS_DIR, platform, target.owner, target.repo);
	if (existingRepo?.repo_sha === headSha) {
		const needsResolvedFromBackfill = Object.values(existingRepo.skills).some((skill) => !skill.resolved_from);
		const { entries: cachedLockEntries } = await loadProjectSkillsLock(
			octokit,
			target,
			repoDir,
			needsResolvedFromBackfill && !existsSync(join(repoDir, 'skills-lock.json')),
		);
		if (needsResolvedFromBackfill) {
			for (const [skillPath, skillEntry] of Object.entries(existingRepo.skills)) {
				if (skillEntry.resolved_from) continue;
				const frontmatter = readFrontmatterFromSavedSkill(repoDir, skillPath);
				skillEntry.resolved_from =
					resolveSkillResolvedFrom(frontmatter, skillPath, cachedLockEntries, platform) ?? undefined;
			}
		}
		counts.skippedRepoCount++;
		console.log(`  [skip] ${target.owner}/${target.repo} (repo unchanged)`);
		if (collectFromRefs) {
			for (const skillEntry of Object.values(existingRepo.skills)) {
				fromRefs.push(...collectFromResolvedFrom(platform, skillEntry.resolved_from, seenRepoKeys, queuedRepoKeys));
			}
		}
		return;
	}

	await checkRateLimit(octokit);
	const { data: treeData } = await withRetry(
		() =>
			octokit.git.getTree({
				owner: target.owner,
				repo: target.repo,
				tree_sha: headSha,
				recursive: 'true',
			}),
		repoLabel,
	);

	let discoveredSkills: DiscoveredSkill[];
	if (treeData.truncated) {
		console.log(`  [warn] ${target.owner}/${target.repo}: tree truncated, falling back to getContent`);
		discoveredSkills = await findSkillFilesFallback(octokit, target.owner, target.repo);
	} else {
		discoveredSkills = discoverSkillsFromTree(treeData.tree as TreeEntry[]);
	}

	const { entries: lockEntries } = await loadProjectSkillsLock(octokit, target, repoDir, true);

	if (discoveredSkills.length === 0) {
		console.log(`  [skip] ${target.owner}/${target.repo} (no skills found)`);
		counts.collectedRepoCount++;
		catalog.repositories[repoKey] = {
			visibility: target.visibility,
			repo_sha: headSha,
			...(target.fork ? { fork: true } : {}),
			skills: {},
		};
		return;
	}

	const newSkills: Record<string, SkillEntry> = {};

	for (const skill of discoveredSkills) {
		const existingSkill = existingRepo?.skills?.[skill.skillPath];
		if (skill.treeSha && existingSkill?.tree_sha === skill.treeSha) {
			const frontmatter = readFrontmatterFromSavedSkill(repoDir, skill.skillPath);
			const resolvedFrom = resolveSkillResolvedFrom(frontmatter, skill.skillPath, lockEntries, platform);
			newSkills[skill.skillPath] = existingSkill;
			if (resolvedFrom) {
				newSkills[skill.skillPath].resolved_from = resolvedFrom;
			}
			counts.skippedSkillCount++;
			console.log(`  [skip] ${target.owner}/${target.repo} -> ${skill.skillPath} (tree_sha unchanged)`);
			if (collectFromRefs) {
				fromRefs.push(...collectFromResolvedFrom(platform, resolvedFrom ?? undefined, seenRepoKeys, queuedRepoKeys));
			}
			continue;
		}

		let collectedFrontmatter: Record<string, unknown> = {};
		for (const filePath of skill.filePaths) {
			try {
				const content = await fetchFileContent(octokit, target.owner, target.repo, filePath);
				saveFile(repoDir, filePath, content);
				counts.collectedFileCount++;
				console.log(`  [collected:${target.source}] ${target.owner}/${target.repo} -> ${filePath}`);
				if (filePath === skill.skillPath) {
					collectedFrontmatter = parseFrontmatter(content);
				}
			} catch (error) {
				console.error(`  [error] ${target.owner}/${target.repo} -> ${filePath}: ${formatApiError(error)}`);
			}
		}

		counts.collectedCount++;
		const now = new Date().toISOString();
		const resolvedFrom = resolveSkillResolvedFrom(collectedFrontmatter, skill.skillPath, lockEntries, platform);
		if (collectFromRefs) {
			fromRefs.push(...collectFromResolvedFrom(platform, resolvedFrom ?? undefined, seenRepoKeys, queuedRepoKeys));
		}
		newSkills[skill.skillPath] = {
			tree_sha: skill.treeSha,
			updated_at: now,
			registered_at: existingSkill?.registered_at ?? now,
			...(resolvedFrom ? { resolved_from: resolvedFrom } : {}),
		};
	}

	if (Object.keys(newSkills).length > 0) {
		counts.collectedRepoCount++;
	}
	catalog.repositories[repoKey] = {
		visibility: target.visibility,
		repo_sha: headSha,
		...(target.fork ? { fork: true } : {}),
		skills: {
			...existingRepo?.skills,
			...newSkills,
		},
	};
}

function detectOrgRepo(): { org: string | null; repo: string | null } {
	let org = process.env.GH_ORG || null;
	let repo = process.env.GH_REPO || null;
	if (org && repo) return { org, repo };
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: PROJECT_ROOT,
		}).trim();
		const sshMatch = remoteUrl.match(/^git@[^:]+:([^/]+)\/([^/.]+)/);
		if (sshMatch) {
			org = org ?? sshMatch[1];
			repo = repo ?? sshMatch[2];
			return { org, repo };
		}
		const httpsMatch = remoteUrl.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/.]+)/);
		if (httpsMatch) {
			org = org ?? httpsMatch[1];
			repo = repo ?? httpsMatch[2];
			return { org, repo };
		}
	} catch {
		// git command failed
	}
	return { org, repo };
}

export async function runCollectOrgSkills(): Promise<void> {
	const token = process.env.GH_TOKEN;
	const { org, repo: selfRepo } = detectOrgRepo();

	if (!token) {
		throw new Error('GH_TOKEN environment variable is required.');
	}
	if (!org) {
		throw new Error('GH_ORG environment variable is not set and could not be detected from git remote URL.');
	}

	const startTime = Date.now();
	const octokit = new Octokit({ auth: token });
	const platform = 'github.com';
	const catalog = loadCatalog();

	console.log(`Collecting skills from organization: ${org}`);
	if (selfRepo) {
		console.log(`Excluding self repository: ${org}/${selfRepo}`);
	}

	const settings = loadSettings();
	const excludeForks = settings.collector?.exclude_forks ?? false;
	const excludeRepos = new Set(settings.collector?.excluded_repos ?? []);
	const includeOriginRepos = settings.collector?.include_origin_repos ?? true;
	const includedExtraRepos = settings.collector?.included_extra_repos ?? [];

	const repos: RepoTarget[] = [];
	let page = 1;

	while (true) {
		await checkRateLimit(octokit);
		const { data } = await withRetry(
			() =>
				octokit.repos.listForOrg({
					org,
					type: 'all',
					per_page: 100,
					page,
				}),
			`listForOrg(${org}, page=${page})`,
		);

		if (data.length === 0) break;

		for (const repo of data) {
			if (selfRepo && repo.name === selfRepo) continue;
			if (excludeForks && repo.fork) continue;
			if (excludeRepos.has(repo.name)) continue;
			repos.push({
				owner: org,
				repo: repo.name,
				default_branch: repo.default_branch ?? 'main',
				html_url: repo.html_url,
				visibility: repo.visibility ?? 'private',
				fork: repo.fork,
				source: 'org',
			});
		}

		page++;
	}

	const filters = [
		excludeForks && 'forks excluded',
		excludeRepos.size > 0 && `${excludeRepos.size} repo(s) excluded`,
	].filter(Boolean);
	join(', ');
	console.log(`Found ${repos.length} repositories${filters ? ` (${filters})` : ''}`);
	if (includeOriginRepos) {
		console.log(`Following public origin repositories: enabled`);
	}

	const counts = {
		collectedRepoCount: 0,
		collectedCount: 0,
		collectedFileCount: 0,
		skippedRepoCount: 0,
		skippedSkillCount: 0,
	};
	const seenRepoKeys = new Set<string>();
	const queuedExternalRepoKeys = new Set<string>();
	const fromRefs: ParsedFromRef[] = [];

	for (const repo of repos) {
		try {
			const repoKey = normalizeRepoKey(platform, repo.owner, repo.repo);
			seenRepoKeys.add(repoKey);
			await collectRepoSkills(
				octokit,
				platform,
				repo,
				catalog,
				fromRefs,
				seenRepoKeys,
				queuedExternalRepoKeys,
				counts,
				includeOriginRepos,
			);
		} catch (error) {
			console.error(`  [error] ${repo.owner}/${repo.repo}: ${formatApiError(error)}`);
		}
	}

	let extraRepoCount = 0;
	for (const url of includedExtraRepos) {
		const parsed = parseGitHubRepoUrl(url);
		if (!parsed) {
			console.log(`  [skip] ${url} (invalid GitHub URL)`);
			continue;
		}
		const repoKey = normalizeRepoKey(platform, parsed.owner, parsed.repo);
		if (seenRepoKeys.has(repoKey)) {
			console.log(`  [skip] ${parsed.owner}/${parsed.repo} (already collected)`);
			continue;
		}
		seenRepoKeys.add(repoKey);
		extraRepoCount++;
		const target = await fetchRepoTarget(octokit, platform, parsed.owner, parsed.repo, 'extra');
		if (!target) continue;
		try {
			await collectRepoSkills(
				octokit,
				platform,
				target,
				catalog,
				fromRefs,
				seenRepoKeys,
				queuedExternalRepoKeys,
				counts,
				includeOriginRepos,
			);
		} catch (error) {
			console.error(`  [error] ${target.owner}/${target.repo}: ${formatApiError(error)}`);
		}
	}

	let fromRepoCount = 0;
	if (includeOriginRepos) {
		for (const fromRef of fromRefs) {
			if (seenRepoKeys.has(fromRef.repoKey)) continue;
			seenRepoKeys.add(fromRef.repoKey);
			fromRepoCount++;
			const target = await fetchRepoTarget(octokit, platform, fromRef.owner, fromRef.repo);
			if (!target) continue;
			try {
				await collectRepoSkills(
					octokit,
					platform,
					target,
					catalog,
					[],
					seenRepoKeys,
					queuedExternalRepoKeys,
					counts,
					false,
				);
			} catch (error) {
				console.error(`  [error] ${target.owner}/${target.repo}: ${formatApiError(error)}`);
			}
		}
	}

	const durationSec = Math.round((Date.now() - startTime) / 1000);
	const totalRepos = repos.length + extraRepoCount + fromRepoCount;
	const totalSkills = counts.collectedCount + counts.skippedSkillCount;

	updateDriftStatus(catalog, (repoKey, skillPath) => {
		const repoDir = join(SKILLS_DIR, repoKey);
		return readFrontmatterFromSavedSkill(repoDir, skillPath);
	});

	saveCatalog(catalog);

	const statistics = computeStatistics(catalog, org);
	const historyEntry: CollectHistoryEntry = createCollectHistoryEntry({
		collecting: {
			collected_at: new Date().toISOString(),
			duration_sec: durationSec,
		},
		statistics,
	});
	const historyLimit = settings.collector?.history_limit ?? 50;
	prependCollectHistoryEntry(PROJECT_ROOT, historyEntry, historyLimit);
	console.log(`  history_id: ${historyEntry.id}`);
	if (process.env.GITHUB_OUTPUT && historyEntry.id) {
		writeFileSync(process.env.GITHUB_OUTPUT, `history_id=${historyEntry.id}\n`, { flag: 'a' });
	}

	console.log(`\n--- Summary ---`);
	console.log(
		`  Repos:  ${totalRepos} total, ${counts.collectedRepoCount} collected, ${counts.skippedRepoCount} unchanged` +
			(extraRepoCount > 0 ? `, ${extraRepoCount} via included_extra_repos` : '') +
			(fromRepoCount > 0 ? `, ${fromRepoCount} via _from` : ''),
	);
	console.log(
		`  Skills: ${totalSkills} total, ${counts.collectedCount} collected, ${counts.skippedSkillCount} unchanged`,
	);
	console.log(`  Files:  ${counts.collectedFileCount} collected`);
	console.log(`  Time:   ${durationSec}s`);

	console.log(`\n--- Statistics ---`);
	console.log(
		`  Org:       ${statistics.org.repos} repos (${statistics.org.repos_with_skills} with skills), ${statistics.org.skills} skills, ${statistics.org.files} files`,
	);
	console.log(
		`  Community: ${statistics.community.repos} repos (${statistics.community.repos_with_skills} with skills), ${statistics.community.skills} skills, ${statistics.community.files} files`,
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		await runCollectOrgSkills();
	} catch (error) {
		console.error(`Error: ${formatApiError(error)}`);
		process.exit(1);
	}
}
