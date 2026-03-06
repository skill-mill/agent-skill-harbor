import matter from 'gray-matter';
import { load as yamlLoad } from 'js-yaml';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { env } from '$env/dynamic/private';
import type { FlatSkillEntry, Visibility } from '$lib/types';

declare const __PROJECT_ROOT__: string;

type UsagePolicy = 'recommended' | 'discouraged' | 'prohibited' | 'none';

interface GovernanceEntry {
	usage_policy: UsagePolicy;
	note?: string;
}

interface AdminConfig {
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

interface CatalogResult {
	orgName: string | null;
	repoFullName: string | null;
	freshPeriodDays: number;
	skills: FlatSkillEntry[];
	bodyMap: Map<string, string>;
}

// Module-level cache: parsed once per build
let cached: CatalogResult | null = null;

const PROJECT_ROOT = __PROJECT_ROOT__;
const DATA_DIR = join(PROJECT_ROOT, 'data');
const SKILLS_DIR = join(DATA_DIR, 'skills');
const CATALOG_YAML_PATH = join(DATA_DIR, 'catalog.yaml');
const CONFIG_DIR = join(PROJECT_ROOT, 'config');
const GOVERNANCE_PATH = join(CONFIG_DIR, 'governance.yaml');
const ADMIN_PATH = join(CONFIG_DIR, 'admin.yaml');

function detectOrgRepo(): { org: string | null; repo: string | null } {
	let org: string | null = env.GH_ORG || null;
	let repo: string | null = env.GH_REPO || null;
	if (org && repo) return { org, repo };
	try {
		const remoteUrl = execSync('git remote get-url origin', {
			encoding: 'utf-8',
			cwd: PROJECT_ROOT
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

function loadGovernance(): Record<string, GovernanceEntry> {
	if (!existsSync(GOVERNANCE_PATH)) return {};
	const raw = yamlLoad(readFileSync(GOVERNANCE_PATH, 'utf-8')) as {
		policies?: Record<string, GovernanceEntry>;
	} | null;
	if (!raw || typeof raw !== 'object') return {};
	return raw.policies ?? {};
}

function loadAdmin(): AdminConfig {
	if (!existsSync(ADMIN_PATH)) return {};
	try {
		const raw = yamlLoad(readFileSync(ADMIN_PATH, 'utf-8'));
		if (!raw || typeof raw !== 'object') return {};
		return raw as AdminConfig;
	} catch {
		return {};
	}
}

function loadCatalogYaml(): CatalogYaml {
	if (!existsSync(CATALOG_YAML_PATH)) return { repositories: {} };
	try {
		const raw = yamlLoad(readFileSync(CATALOG_YAML_PATH, 'utf-8')) as CatalogYaml;
		return raw?.repositories ? raw : { repositories: {} };
	} catch {
		return { repositories: {} };
	}
}

function walkForSkillMd(
	baseDir: string,
	currentDir: string,
	results: Map<string, { frontmatter: Record<string, unknown>; body: string }>
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
				const frontmatter: Record<string, unknown> = { ...parsed.data };
				delete frontmatter._excerpt;
				results.set(skillPath, { frontmatter, body: parsed.content.trim() });
			} catch {
				// skip unparseable SKILL.md
			}
		} else if (stat.isDirectory()) {
			walkForSkillMd(baseDir, fullPath, results);
		}
	}
}

function buildCatalogData(): CatalogResult {
	const { org: orgName, repo: repoName } = detectOrgRepo();
	const repoFullName = orgName && repoName ? `${orgName}/${repoName}` : orgName;
	const admin = loadAdmin();
	const freshPeriodDays = admin.catalog?.skill?.fresh_period_days ?? 0;
	const governance = loadGovernance();
	const catalogYaml = loadCatalogYaml();

	const skills: FlatSkillEntry[] = [];
	const bodyMap = new Map<string, string>();

	const platformDir = join(SKILLS_DIR, 'github.com');
	if (!existsSync(platformDir)) {
		return { orgName, repoFullName, freshPeriodDays, skills, bodyMap };
	}

	// Scan SKILL.md files per repo
	for (const [repoKey, repoEntry] of Object.entries(catalogYaml.repositories)) {
		const parts = repoKey.split('/');
		const platform = parts[0];
		const owner = parts[1];
		const repo = parts[2];
		const repoDir = join(SKILLS_DIR, repoKey);

		if (!existsSync(repoDir)) continue;

		// Read all SKILL.md from filesystem
		const skillMdMap = new Map<
			string,
			{ frontmatter: Record<string, unknown>; body: string }
		>();
		walkForSkillMd(repoDir, repoDir, skillMdMap);

		for (const [skillPath, skillData] of Object.entries(repoEntry.skills)) {
			const key = `${repoKey}/${skillPath}`;
			const gov = governance[key];

			// Prefer SKILL.md from filesystem; fall back to catalog.yaml frontmatter
			const fromFs = skillMdMap.get(skillPath);
			const frontmatter = fromFs?.frontmatter ?? skillData.frontmatter;
			const body = fromFs?.body ?? '';

			if (body) {
				bodyMap.set(key, body);
			}

			const entry: FlatSkillEntry = {
				key,
				repoKey,
				skillPath,
				platform,
				owner,
				repo,
				visibility: repoEntry.visibility as Visibility,
				isOrgOwned: orgName != null && owner === orgName,
				frontmatter,
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
		}
	}

	const now = Date.now();
	const freshMs = freshPeriodDays * 86_400_000;
	const isNew = (s: FlatSkillEntry) =>
		freshPeriodDays > 0 &&
		!!s.registered_at &&
		now - new Date(s.registered_at).getTime() < freshMs;

	skills.sort((a, b) => {
		const aNew = isNew(a);
		const bNew = isNew(b);
		if (aNew !== bNew) return aNew ? -1 : 1;
		const nameA = String(a.frontmatter.name ?? a.key).toLowerCase();
		const nameB = String(b.frontmatter.name ?? b.key).toLowerCase();
		return nameA.localeCompare(nameB);
	});

	return { orgName, repoFullName, freshPeriodDays, skills, bodyMap };
}

export function loadCatalog(): CatalogResult {
	if (!cached) {
		cached = buildCatalogData();
	}
	return cached;
}

export function getSkillBody(key: string): string {
	const { bodyMap } = loadCatalog();
	return bodyMap.get(key) ?? '';
}
