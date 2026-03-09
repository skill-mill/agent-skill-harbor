import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PROJECT_ROOT = process.env.SKILL_HARBOR_ROOT || join(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const CATALOG_YAML_PATH = join(DATA_DIR, 'catalog.yaml');
const CONFIG_DIR = join(PROJECT_ROOT, 'config');
const ADMIN_PATH = join(CONFIG_DIR, 'admin.yaml');

interface AdminConfig {
	collector?: {
		exclude_forks?: boolean;
		exclude_repos?: string[];
		collect_public_origin_repos?: boolean;
	};
}

function loadAdmin(): AdminConfig {
	if (!existsSync(ADMIN_PATH)) {
		return {};
	}
	try {
		const raw = yamlLoad(readFileSync(ADMIN_PATH, 'utf-8'));
		if (!raw || typeof raw !== 'object') return {};
		return raw as AdminConfig;
	} catch {
		return {};
	}
}

interface SkillEntry {
	tree_sha: string | null;
	updated_at?: string;
	registered_at?: string;
	frontmatter: Record<string, unknown>;
	files: string[];
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
	dirPath: string | null; // null for root-level SKILL.md
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
	source: 'org' | 'from';
}

interface ParsedFromRef {
	owner: string;
	repo: string;
	repoKey: string;
	sha: string | null;
}

function loadCatalog(): CatalogYaml {
	if (!existsSync(CATALOG_YAML_PATH)) {
		return { repositories: {} };
	}
	try {
		const raw = yamlLoad(readFileSync(CATALOG_YAML_PATH, 'utf-8')) as CatalogYaml;
		return raw?.repositories ? raw : { repositories: {} };
	} catch {
		return { repositories: {} };
	}
}

function saveCatalog(catalog: CatalogYaml): void {
	writeFileSync(CATALOG_YAML_PATH, yamlDump(catalog, { lineWidth: 120, noRefs: true }));
}

function saveFile(repoDir: string, filePath: string, content: string): void {
	const fullPath = join(repoDir, filePath);
	const dir = dirname(fullPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(fullPath, content);
}

function readFrontmatterFromSavedSkill(repoDir: string, skillPath: string): Record<string, unknown> {
	const fullPath = join(repoDir, skillPath);
	if (!existsSync(fullPath)) return {};
	try {
		const parsed = matter(readFileSync(fullPath, 'utf-8'));
		const frontmatter = { ...parsed.data } as Record<string, unknown>;
		delete frontmatter._excerpt;
		return frontmatter;
	} catch {
		return {};
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRateLimit(octokit: Octokit): Promise<void> {
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
}

/**
 * Discover skills from the recursive tree.
 * Returns SKILL.md locations, their parent directory tree SHAs, and related file paths.
 */
function discoverSkillsFromTree(treeEntries: TreeEntry[]): DiscoveredSkill[] {
	// Find all SKILL.md blobs
	const skillMdEntries = treeEntries.filter((e) => e.type === 'blob' && e.path?.endsWith('/SKILL.md'));

	// Also check for root-level SKILL.md
	const rootSkillMd = treeEntries.find((e) => e.type === 'blob' && e.path === 'SKILL.md');

	const skills: DiscoveredSkill[] = [];

	// Root-level SKILL.md
	if (rootSkillMd) {
		skills.push({
			skillPath: 'SKILL.md',
			dirPath: null,
			treeSha: null,
			filePaths: ['SKILL.md'],
		});
	}

	// Nested SKILL.md files
	for (const entry of skillMdEntries) {
		const skillPath = entry.path!;
		const dirPath = skillPath.replace(/\/SKILL\.md$/, '');

		// Find tree SHA for the skill directory
		const dirTreeEntry = treeEntries.find((e) => e.type === 'tree' && e.path === dirPath);
		const treeSha = dirTreeEntry?.sha ?? null;

		// Find all files under this directory
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

/**
 * Fallback: find skills using getContent API (when tree is truncated).
 */
async function findSkillFilesFallback(octokit: Octokit, owner: string, repo: string): Promise<DiscoveredSkill[]> {
	const skills: DiscoveredSkill[] = [];

	// Check root SKILL.md
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

	// Check .claude/skills/*/SKILL.md
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
	const { data } = await octokit.repos.getContent({ owner, repo, path });
	if (Array.isArray(data) || data.type !== 'file' || !data.content) {
		throw new Error(`Unexpected response for ${path}`);
	}
	return Buffer.from(data.content, 'base64').toString('utf-8');
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

function collectFromRefsFromFrontmatter(
	platform: string,
	frontmatter: Record<string, unknown>,
	seenRepoKeys: Set<string>,
	queuedRepoKeys: Set<string>,
): ParsedFromRef[] {
	const parsed = parseFromRepoRef(platform, frontmatter._from);
	if (!parsed) return [];
	if (seenRepoKeys.has(parsed.repoKey) || queuedRepoKeys.has(parsed.repoKey)) return [];
	queuedRepoKeys.add(parsed.repoKey);
	return [parsed];
}

async function fetchRepoTarget(octokit: Octokit, platform: string, owner: string, repo: string): Promise<RepoTarget | null> {
	try {
		await checkRateLimit(octokit);
		const { data } = await octokit.repos.get({ owner, repo });
		if (data.private) {
			console.log(`  [skip] ${owner}/${repo} (referenced via _from, not public)`);
			return null;
		}
		return {
			owner,
			repo,
			default_branch: data.default_branch ?? 'main',
			html_url: data.html_url,
			visibility: 'public',
			fork: data.fork,
			source: 'from',
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(`  [skip] ${owner}/${repo} (referenced via _from, unavailable: ${message})`);
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
	counts: { collectedCount: number; skippedRepoCount: number; skippedSkillCount: number },
	collectFromRefs: boolean,
): Promise<void> {
	const repoKey = normalizeRepoKey(platform, target.owner, target.repo);
	const existingRepo = catalog.repositories[repoKey];

	await checkRateLimit(octokit);
	const { data: branchData } = await octokit.repos.getBranch({
		owner: target.owner,
		repo: target.repo,
		branch: target.default_branch,
	});
	const headSha = branchData.commit.sha;

	const repoDir = join(SKILLS_DIR, platform, target.owner, target.repo);
	if (existingRepo?.repo_sha === headSha) {
		counts.skippedRepoCount++;
		console.log(`  [skip] ${target.owner}/${target.repo} (repo unchanged)`);
		if (collectFromRefs) {
			for (const skillPath of Object.keys(existingRepo.skills)) {
				const frontmatter = readFrontmatterFromSavedSkill(repoDir, skillPath);
				fromRefs.push(...collectFromRefsFromFrontmatter(platform, frontmatter, seenRepoKeys, queuedRepoKeys));
			}
		}
		return;
	}

	await checkRateLimit(octokit);
	const { data: treeData } = await octokit.git.getTree({
		owner: target.owner,
		repo: target.repo,
		tree_sha: headSha,
		recursive: 'true',
	});

	let discoveredSkills: DiscoveredSkill[];
	if (treeData.truncated) {
		console.log(`  [warn] ${target.owner}/${target.repo}: tree truncated, falling back to getContent`);
		discoveredSkills = await findSkillFilesFallback(octokit, target.owner, target.repo);
	} else {
		discoveredSkills = discoverSkillsFromTree(treeData.tree as TreeEntry[]);
	}

	if (discoveredSkills.length === 0) return;

	const newSkills: Record<string, SkillEntry> = {};

	for (const skill of discoveredSkills) {
		const existingSkill = existingRepo?.skills?.[skill.skillPath];
		if (skill.treeSha && existingSkill?.tree_sha === skill.treeSha) {
			newSkills[skill.skillPath] = existingSkill;
			counts.skippedSkillCount++;
			console.log(`  [skip] ${target.owner}/${target.repo} -> ${skill.skillPath} (tree_sha unchanged)`);
			if (collectFromRefs) {
				const frontmatter = readFrontmatterFromSavedSkill(repoDir, skill.skillPath);
				fromRefs.push(...collectFromRefsFromFrontmatter(platform, frontmatter, seenRepoKeys, queuedRepoKeys));
			}
			continue;
		}

		let collectedFrontmatter: Record<string, unknown> = {};
		for (const filePath of skill.filePaths) {
			try {
				const content = await fetchFileContent(octokit, target.owner, target.repo, filePath);
				saveFile(repoDir, filePath, content);
				console.log(`  [collected:${target.source}] ${target.owner}/${target.repo} -> ${filePath}`);
				if (filePath === skill.skillPath) {
					const parsed = matter(content);
					collectedFrontmatter = { ...parsed.data } as Record<string, unknown>;
					delete collectedFrontmatter._excerpt;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`  [error] ${target.owner}/${target.repo} -> ${filePath}: ${message}`);
			}
		}

		if (collectFromRefs) {
			fromRefs.push(...collectFromRefsFromFrontmatter(platform, collectedFrontmatter, seenRepoKeys, queuedRepoKeys));
		}

		counts.collectedCount++;
		const now = new Date().toISOString();
		newSkills[skill.skillPath] = {
			tree_sha: skill.treeSha,
			updated_at: now,
			registered_at: existingSkill?.registered_at ?? now,
			frontmatter: collectedFrontmatter,
			files: skill.filePaths,
		};
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

async function main(): Promise<void> {
	const token = process.env.GH_TOKEN;
	const { org, repo: selfRepo } = detectOrgRepo();

	if (!token) {
		console.error('Error: GH_TOKEN environment variable is required.');
		process.exit(1);
	}
	if (!org) {
		console.error('Error: GH_ORG environment variable is not set and could not be detected from git remote URL.');
		process.exit(1);
	}

	const octokit = new Octokit({ auth: token });
	const platform = 'github.com';
	const catalog = loadCatalog();

	console.log(`Collecting skills from organization: ${org}`);
	if (selfRepo) {
		console.log(`Excluding self repository: ${org}/${selfRepo}`);
	}

	const admin = loadAdmin();
	const excludeForks = admin.collector?.exclude_forks ?? false;
	const excludeRepos = new Set(admin.collector?.exclude_repos ?? []);
	const collectPublicOriginRepos = admin.collector?.collect_public_origin_repos ?? true;

	// Fetch all repositories in the org
	const repos: RepoTarget[] = [];
	let page = 1;

	while (true) {
		await checkRateLimit(octokit);
		const { data } = await octokit.repos.listForOrg({
			org,
			type: 'all',
			per_page: 100,
			page,
		});

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

	const filters = [excludeForks && 'forks excluded', excludeRepos.size > 0 && `${excludeRepos.size} repo(s) excluded`]
		.filter(Boolean)
		.join(', ');
	console.log(`Found ${repos.length} repositories${filters ? ` (${filters})` : ''}`);
	if (collectPublicOriginRepos) {
		console.log(`Following public _from repositories: enabled`);
	}

	let collectedCount = 0;
	let skippedRepoCount = 0;
	let skippedSkillCount = 0;
	const counts = { collectedCount, skippedRepoCount, skippedSkillCount };
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
					collectPublicOriginRepos,
				);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`  [error] ${repo.owner}/${repo.repo}: ${message}`);
		}
	}

	if (collectPublicOriginRepos) {
		for (const fromRef of fromRefs) {
			if (seenRepoKeys.has(fromRef.repoKey)) continue;
			seenRepoKeys.add(fromRef.repoKey);
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
				const message = error instanceof Error ? error.message : String(error);
				console.error(`  [error] ${target.owner}/${target.repo}: ${message}`);
			}
		}
	}

	saveCatalog(catalog);
	console.log(
		`\nDone: ${counts.collectedCount} skill(s) collected, ` +
			`${counts.skippedRepoCount} repo(s) unchanged, ` +
			`${counts.skippedSkillCount} skill(s) unchanged (tree_sha)`,
	);
}

main();
