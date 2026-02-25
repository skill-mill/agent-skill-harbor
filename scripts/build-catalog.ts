import matter from 'gray-matter';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const CATALOG_YAML_PATH = join(DATA_DIR, 'catalog.yaml');
const CONFIG_DIR = join(import.meta.dirname, '..', 'config');
const GOVERNANCE_PATH = join(CONFIG_DIR, 'governance.yaml');
const ADMIN_PATH = join(CONFIG_DIR, 'admin.yaml');
const WEB_STATIC_DIR = join(import.meta.dirname, '..', 'web', 'static');
const WEB_CATALOG_PATH = join(WEB_STATIC_DIR, 'catalog.json');

type UsagePolicy = 'recommended' | 'discouraged' | 'prohibited' | 'none';

interface GovernanceEntry {
	usage_policy: UsagePolicy;
	note?: string;
}

interface AdminConfig {
	collector?: {
		exclude_forks?: boolean;
	};
	catalog?: {
		skill?: {
			fresh_period_days?: number;
		};
	};
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

interface FlatSkillEntry {
	key: string;
	repoKey: string;
	skillPath: string;
	platform: string;
	owner: string;
	repo: string;
	visibility: string;
	isOrgOwned: boolean;
	frontmatter: Record<string, unknown>;
	files: string[];
	excerpt: string;
	usage_policy: string;
	note?: string;
	updated_at?: string;
	registered_at?: string;
	repo_sha?: string;
	tree_sha?: string | null;
	is_fork?: boolean;
}

interface DiscoveredSkill {
	frontmatter: Record<string, unknown>;
	body: string;
	files: string[];
}

function detectOrg(): string | null {
	if (process.env.GH_ORG) {
		return process.env.GH_ORG;
	}
	try {
		const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
		// SSH: git@github.com:owner/repo.git
		const sshMatch = remoteUrl.match(/^git@[^:]+:([^/]+)\//);
		if (sshMatch) return sshMatch[1];
		// HTTPS: https://github.com/owner/repo.git
		const httpsMatch = remoteUrl.match(/^https?:\/\/[^/]+\/([^/]+)\//);
		if (httpsMatch) return httpsMatch[1];
	} catch {
		// git command failed
	}
	return null;
}

function loadGovernance(): Record<string, GovernanceEntry> {
	if (!existsSync(GOVERNANCE_PATH)) {
		return {};
	}
	const raw = yamlLoad(readFileSync(GOVERNANCE_PATH, 'utf-8')) as { policies?: Record<string, GovernanceEntry> } | null;
	if (!raw || typeof raw !== 'object') return {};
	return raw.policies ?? {};
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

function loadExistingCatalog(): CatalogYaml {
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

/**
 * Collect all files in a skill directory (relative to repoDir).
 * For root-level SKILL.md, returns just ["SKILL.md"].
 * For nested skills (e.g., .claude/skills/review/SKILL.md), returns all files in that directory.
 */
function collectSkillFiles(repoDir: string, skillPath: string): string[] {
	const skillDir = skillPath === 'SKILL.md' ? null : skillPath.replace(/\/SKILL\.md$/, '');

	if (!skillDir) {
		return ['SKILL.md'];
	}

	const fullSkillDir = join(repoDir, skillDir);
	if (!existsSync(fullSkillDir) || !statSync(fullSkillDir).isDirectory()) {
		return [skillPath];
	}

	const files: string[] = [];
	walkForFiles(fullSkillDir, skillDir, files);
	return files.sort();
}

function walkForFiles(currentDir: string, relPrefix: string, files: string[]): void {
	for (const entry of readdirSync(currentDir)) {
		if (entry.startsWith('_')) continue;
		const fullPath = join(currentDir, entry);
		const stat = statSync(fullPath);

		if (stat.isFile()) {
			files.push(`${relPrefix}/${entry}`);
		} else if (stat.isDirectory()) {
			walkForFiles(fullPath, `${relPrefix}/${entry}`, files);
		}
	}
}

/**
 * Walk a repo directory to find all SKILL.md files and parse their frontmatter + files.
 */
function findSkillMdFiles(repoDir: string): Record<string, DiscoveredSkill> {
	const skills: Record<string, DiscoveredSkill> = {};
	walkForSkillMd(repoDir, repoDir, skills);
	return skills;
}

function walkForSkillMd(
	baseDir: string,
	currentDir: string,
	skills: Record<string, DiscoveredSkill>
): void {
	for (const entry of readdirSync(currentDir)) {
		if (entry.startsWith('_')) continue;
		const fullPath = join(currentDir, entry);
		const stat = statSync(fullPath);

		if (stat.isFile() && entry === 'SKILL.md') {
			const relDir = relative(baseDir, currentDir);
			const skillPath = relDir ? `${relDir}/SKILL.md` : 'SKILL.md';

			try {
				const content = readFileSync(fullPath, 'utf-8');
				const parsed = matter(content);
				const body = parsed.content.trim();
				const frontmatter: Record<string, unknown> = { ...parsed.data };
				delete frontmatter._excerpt;
				const files = collectSkillFiles(baseDir, skillPath);

				skills[skillPath] = { frontmatter, body, files };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`  [skip] ${fullPath}: ${message}`);
			}
		} else if (stat.isDirectory()) {
			walkForSkillMd(baseDir, fullPath, skills);
		}
	}
}

/**
 * Discover all repos under data/skills/github.com/ and merge with existing catalog metadata.
 * Returns catalog and a map of skill key → body text.
 */
function buildCatalog(existing: CatalogYaml): { catalog: CatalogYaml; bodyMap: Map<string, string> } {
	const catalog: CatalogYaml = { repositories: {} };
	const bodyMap = new Map<string, string>();

	const platformDir = join(SKILLS_DIR, 'github.com');
	if (!existsSync(platformDir)) return { catalog, bodyMap };

	for (const owner of readdirSync(platformDir)) {
		const ownerDir = join(platformDir, owner);
		if (!statSync(ownerDir).isDirectory()) continue;

		for (const repo of readdirSync(ownerDir)) {
			const repoDir = join(ownerDir, repo);
			if (!statSync(repoDir).isDirectory()) continue;

			const repoKey = `github.com/${owner}/${repo}`;
			const existingRepo = existing.repositories[repoKey];
			const freshSkills = findSkillMdFiles(repoDir);

			if (Object.keys(freshSkills).length === 0) continue;

			const mergedSkills: Record<string, SkillEntry> = {};
			for (const [skillPath, discovered] of Object.entries(freshSkills)) {
				const existingSkill = existingRepo?.skills?.[skillPath] as SkillEntry | undefined;
				mergedSkills[skillPath] = {
					tree_sha: existingSkill?.tree_sha ?? null,
					...(existingSkill?.updated_at ? { updated_at: existingSkill.updated_at } : {}),
					...(existingSkill?.registered_at ? { registered_at: existingSkill.registered_at } : {}),
					frontmatter: discovered.frontmatter,
					files: discovered.files
				};

				if (discovered.body) {
					bodyMap.set(`${repoKey}/${skillPath}`, discovered.body);
				}
			}

			catalog.repositories[repoKey] = {
				visibility: existingRepo?.visibility ?? 'public',
				...(existingRepo?.repo_sha ? { repo_sha: existingRepo.repo_sha } : {}),
				...(existingRepo?.fork ? { fork: true } : {}),
				skills: mergedSkills
			};
		}
	}

	return { catalog, bodyMap };
}

function buildFlatCatalog(
	catalog: CatalogYaml,
	governance: Record<string, GovernanceEntry>,
	orgName: string | null,
	bodyMap: Map<string, string>,
	freshPeriodDays: number
): { generated_at: string; org_name: string | null; fresh_period_days: number; skills: FlatSkillEntry[] } {
	const skills: FlatSkillEntry[] = [];

	for (const [repoKey, repoEntry] of Object.entries(catalog.repositories)) {
		const parts = repoKey.split('/');
		const platform = parts[0];
		const owner = parts[1];
		const repo = parts[2];

		for (const [skillPath, skillData] of Object.entries(repoEntry.skills)) {
			const key = `${repoKey}/${skillPath}`;
			const gov = governance[key];
			const body = bodyMap.get(key) ?? '';

			const entry: FlatSkillEntry = {
				key,
				repoKey,
				skillPath,
				platform,
				owner,
				repo,
				visibility: repoEntry.visibility,
				isOrgOwned: orgName != null && owner === orgName,
				frontmatter: skillData.frontmatter,
				files: skillData.files,
				excerpt: body.slice(0, 300),
				usage_policy: gov?.usage_policy ?? 'none',
				...(gov?.note ? { note: gov.note } : {}),
				...(skillData.updated_at ? { updated_at: skillData.updated_at } : {}),
				...(skillData.registered_at ? { registered_at: skillData.registered_at } : {}),
				...(repoEntry.repo_sha ? { repo_sha: repoEntry.repo_sha } : {}),
				tree_sha: skillData.tree_sha ?? null,
				...(repoEntry.fork ? { is_fork: true } : {})
			};

			skills.push(entry);

			// Write full body to static file
			if (body) {
				const bodyPath = join(WEB_STATIC_DIR, 'skills', key.replace(/\/SKILL\.md$/, ''), 'body.md');
				mkdirSync(dirname(bodyPath), { recursive: true });
				writeFileSync(bodyPath, body);
			}
		}
	}

	skills.sort((a, b) => {
		const nameA = String(a.frontmatter.name ?? a.key).toLowerCase();
		const nameB = String(b.frontmatter.name ?? b.key).toLowerCase();
		return nameA.localeCompare(nameB);
	});

	return { generated_at: new Date().toISOString(), org_name: orgName, fresh_period_days: freshPeriodDays, skills };
}

function main(): void {
	console.log('Building skill catalog...');

	const orgName = detectOrg();
	console.log(`  Org: ${orgName ?? '(not detected)'}`);

	const admin = loadAdmin();
	const freshPeriodDays = admin.catalog?.skill?.fresh_period_days ?? 0;
	console.log(`  Fresh period: ${freshPeriodDays} day(s)`);

	const governance = loadGovernance();
	console.log(`  Loaded ${Object.keys(governance).length} governance policy(ies)`);

	const existing = loadExistingCatalog();
	const { catalog, bodyMap } = buildCatalog(existing);

	const repoCount = Object.keys(catalog.repositories).length;
	const skillCount = Object.values(catalog.repositories).reduce(
		(sum, r) => sum + Object.keys(r.skills).length,
		0
	);
	console.log(`  Discovered ${skillCount} skill(s) in ${repoCount} repository(ies)`);

	// Write catalog.yaml (preserving operational metadata, updating frontmatter)
	writeFileSync(CATALOG_YAML_PATH, yamlDump(catalog, { lineWidth: 120, noRefs: true }));
	console.log(`  Written ${CATALOG_YAML_PATH}`);

	// Generate web JSON + per-skill body files
	const flatCatalog = buildFlatCatalog(catalog, governance, orgName, bodyMap, freshPeriodDays);
	writeFileSync(WEB_CATALOG_PATH, JSON.stringify(flatCatalog, null, 2) + '\n');
	console.log(`  Written ${WEB_CATALOG_PATH}`);

	console.log(`\nDone: ${flatCatalog.skills.length} skills in catalog`);
}

main();
