import { Octokit } from '@octokit/rest';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const CATALOG_YAML_PATH = join(DATA_DIR, 'catalog.yaml');
const CONFIG_DIR = join(import.meta.dirname, '..', 'config');
const ADMIN_PATH = join(CONFIG_DIR, 'admin.yaml');

interface AdminConfig {
	collector?: {
		exclude_forks?: boolean;
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
	const skillMdEntries = treeEntries.filter(
		(e) => e.type === 'blob' && e.path?.endsWith('/SKILL.md')
	);

	// Also check for root-level SKILL.md
	const rootSkillMd = treeEntries.find(
		(e) => e.type === 'blob' && e.path === 'SKILL.md'
	);

	const skills: DiscoveredSkill[] = [];

	// Root-level SKILL.md
	if (rootSkillMd) {
		skills.push({
			skillPath: 'SKILL.md',
			dirPath: null,
			treeSha: null,
			filePaths: ['SKILL.md']
		});
	}

	// Nested SKILL.md files
	for (const entry of skillMdEntries) {
		const skillPath = entry.path!;
		const dirPath = skillPath.replace(/\/SKILL\.md$/, '');

		// Find tree SHA for the skill directory
		const dirTreeEntry = treeEntries.find(
			(e) => e.type === 'tree' && e.path === dirPath
		);
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
			filePaths
		});
	}

	return skills;
}

/**
 * Fallback: find skills using getContent API (when tree is truncated).
 */
async function findSkillFilesFallback(
	octokit: Octokit,
	owner: string,
	repo: string
): Promise<DiscoveredSkill[]> {
	const skills: DiscoveredSkill[] = [];

	// Check root SKILL.md
	try {
		const { data } = await octokit.repos.getContent({ owner, repo, path: 'SKILL.md' });
		if (!Array.isArray(data) && data.type === 'file') {
			skills.push({
				skillPath: 'SKILL.md',
				dirPath: null,
				treeSha: null,
				filePaths: ['SKILL.md']
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
							path: `${item.path}/SKILL.md`
						});
						if (!Array.isArray(skillFile) && skillFile.type === 'file') {
							skills.push({
								skillPath: `${item.path}/SKILL.md`,
								dirPath: item.path,
								treeSha: null,
								filePaths: [`${item.path}/SKILL.md`]
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


async function fetchFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string
): Promise<string> {
	const { data } = await octokit.repos.getContent({ owner, repo, path });
	if (Array.isArray(data) || data.type !== 'file' || !data.content) {
		throw new Error(`Unexpected response for ${path}`);
	}
	return Buffer.from(data.content, 'base64').toString('utf-8');
}

function detectOrgRepo(): { org: string | null; repo: string | null } {
	let org = process.env.GH_ORG || null;
	let repo = process.env.GH_REPO || null;
	if (org && repo) return { org, repo };
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: join(import.meta.dirname, '..')
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
	const token = process.env.GITHUB_TOKEN;
	const { org, repo: selfRepo } = detectOrgRepo();

	if (!token) {
		console.error('Error: GITHUB_TOKEN environment variable is required.');
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

	// Fetch all repositories in the org
	const repos: Array<{
		name: string;
		default_branch: string;
		html_url: string;
		visibility: string;
		fork: boolean;
	}> = [];
	let page = 1;

	while (true) {
		await checkRateLimit(octokit);
		const { data } = await octokit.repos.listForOrg({
			org,
			type: 'all',
			per_page: 100,
			page
		});

		if (data.length === 0) break;

		for (const repo of data) {
			if (selfRepo && repo.name === selfRepo) continue;
			if (excludeForks && repo.fork) continue;
			repos.push({
				name: repo.name,
				default_branch: repo.default_branch ?? 'main',
				html_url: repo.html_url,
				visibility: repo.visibility ?? 'private',
				fork: repo.fork
			});
		}

		page++;
	}

	console.log(`Found ${repos.length} repositories${excludeForks ? ' (forks excluded)' : ''}`);

	let collectedCount = 0;
	let skippedRepoCount = 0;
	let skippedSkillCount = 0;

	for (const repo of repos) {
		try {
			const repoKey = `${platform}/${org}/${repo.name}`;
			const existingRepo = catalog.repositories[repoKey];

			// Check HEAD SHA to skip unchanged repos
			await checkRateLimit(octokit);
			const { data: branchData } = await octokit.repos.getBranch({
				owner: org,
				repo: repo.name,
				branch: repo.default_branch
			});
			const headSha = branchData.commit.sha;

			if (existingRepo?.repo_sha === headSha) {
				skippedRepoCount++;
				continue;
			}

			// Get recursive tree for skill discovery and tree_sha extraction
			await checkRateLimit(octokit);
			const { data: treeData } = await octokit.git.getTree({
				owner: org,
				repo: repo.name,
				tree_sha: headSha,
				recursive: 'true'
			});

			let discoveredSkills: DiscoveredSkill[];

			if (treeData.truncated) {
				console.log(`  [warn] ${repo.name}: tree truncated, falling back to getContent`);
				discoveredSkills = await findSkillFilesFallback(octokit, org, repo.name);
			} else {
				discoveredSkills = discoverSkillsFromTree(treeData.tree as TreeEntry[]);
			}

			if (discoveredSkills.length === 0) continue;

			const repoDir = join(SKILLS_DIR, platform, org, repo.name);
			const newSkills: Record<string, SkillEntry> = {};

			for (const skill of discoveredSkills) {
				// Check tree_sha for skill-level skip
				const existingSkill = existingRepo?.skills?.[skill.skillPath];
				if (
					skill.treeSha &&
					existingSkill?.tree_sha === skill.treeSha
				) {
					// Skill directory unchanged, preserve existing entry
					newSkills[skill.skillPath] = existingSkill;
					skippedSkillCount++;
					console.log(`  [skip] ${org}/${repo.name} -> ${skill.skillPath} (tree_sha unchanged)`);
					continue;
				}

				// Download all files in the skill directory
				for (const filePath of skill.filePaths) {
					try {
						const content = await fetchFileContent(octokit, org, repo.name, filePath);
						saveFile(repoDir, filePath, content);
						console.log(`  [collected] ${org}/${repo.name} -> ${filePath}`);
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						console.error(`  [error] ${org}/${repo.name} -> ${filePath}: ${message}`);
					}
				}

				collectedCount++;

				const now = new Date().toISOString();
				newSkills[skill.skillPath] = {
					tree_sha: skill.treeSha,
					updated_at: now,
					registered_at: existingSkill?.registered_at ?? now,
					frontmatter: {},
					files: skill.filePaths
				};
			}

			// Update catalog entry
			catalog.repositories[repoKey] = {
				visibility: repo.visibility,
				repo_sha: headSha,
				...(repo.fork ? { fork: true } : {}),
				skills: {
					...existingRepo?.skills,
					...newSkills
				}
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`  [error] ${repo.name}: ${message}`);
		}
	}

	saveCatalog(catalog);
	console.log(
		`\nDone: ${collectedCount} skill(s) collected, ` +
			`${skippedRepoCount} repo(s) unchanged, ` +
			`${skippedSkillCount} skill(s) unchanged (tree_sha)`
	);
}

main();
