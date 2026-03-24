import type { CollectionEntry, RepoInfo } from '$lib/types';

export type OwnerFilter = 'org' | 'community' | null;

interface CollectionStatistics {
	repos: number;
	repos_with_skills: number;
	skills: number;
	files: number;
}

export interface TrendPoint {
	label: string;
	value: number;
}

export interface HistoryRowMetrics {
	stats: CollectionStatistics;
	previousStats: Pick<CollectionStatistics, 'repos' | 'repos_with_skills' | 'skills'> | null;
	skillDiff: number;
	adoptionPct: number;
	prevAdoptionPct: number;
	repoDiff: number;
}

export function parseOwnerFilterValue(value: string): OwnerFilter {
	if (value === 'org' || value === 'community') return value;
	return null;
}

export function matchesOwnerFilter(isOrgOwned: boolean, filter: OwnerFilter): boolean {
	if (!filter) return true;
	return filter === 'org' ? isOrgOwned : !isOrgOwned;
}

export function sumOwnerValues(org: number, community: number, filter: OwnerFilter): number {
	if (filter === 'org') return org;
	if (filter === 'community') return community;
	return org + community;
}

export function getFilteredRepos(repos: RepoInfo[], filter: OwnerFilter): RepoInfo[] {
	return repos.filter((repo) => matchesOwnerFilter(repo.isOrgOwned, filter));
}

export function getTotalRepos(latest: CollectionEntry | null, filteredRepos: RepoInfo[], filter: OwnerFilter): number {
	if (!latest) return filteredRepos.length;
	return sumOwnerValues(latest.statistics.org.repos, latest.statistics.community.repos, filter);
}

export function getReposWithSkills(
	latest: CollectionEntry | null,
	filteredRepos: RepoInfo[],
	filter: OwnerFilter,
): number {
	if (!latest) return filteredRepos.filter((repo) => repo.skillCount > 0).length;
	return sumOwnerValues(latest.statistics.org.repos_with_skills, latest.statistics.community.repos_with_skills, filter);
}

export function getRepoAdoptionPct(reposWithSkills: number, totalRepos: number): number {
	return totalRepos > 0 ? Math.round((reposWithSkills / totalRepos) * 100) : 0;
}

export function getTotalFiles(latest: CollectionEntry | null, filter: OwnerFilter): number {
	if (!latest) return 0;
	return sumOwnerValues(latest.statistics.org.files, latest.statistics.community.files, filter);
}

export function getSkillChange(
	totalSkills: number,
	previous: CollectionEntry | null,
	filter: OwnerFilter,
): number | undefined {
	if (!previous) return undefined;
	const previousSkills = sumOwnerValues(previous.statistics.org.skills, previous.statistics.community.skills, filter);
	return totalSkills - previousSkills;
}

export function getRepoChange(
	repoAdoptionPct: number,
	previous: CollectionEntry | null,
	filter: OwnerFilter,
): number | undefined {
	if (!previous) return undefined;
	const previousReposWithSkills = sumOwnerValues(
		previous.statistics.org.repos_with_skills,
		previous.statistics.community.repos_with_skills,
		filter,
	);
	const previousRepos = sumOwnerValues(previous.statistics.org.repos, previous.statistics.community.repos, filter);
	const previousAdoptionPct = getRepoAdoptionPct(previousReposWithSkills, previousRepos);
	return repoAdoptionPct - previousAdoptionPct;
}

export function buildSkillTrendData(collections: CollectionEntry[], filter: OwnerFilter): TrendPoint[] {
	return [...collections].reverse().map((entry) => {
		const date = new Date(entry.collecting.collected_at);
		return {
			label: `${date.getMonth() + 1}/${date.getDate()}`,
			value: sumOwnerValues(entry.statistics.org.skills, entry.statistics.community.skills, filter),
		};
	});
}

export function buildAdoptionTrendData(collections: CollectionEntry[], filter: OwnerFilter): TrendPoint[] {
	return [...collections].reverse().map((entry) => {
		const repos = sumOwnerValues(entry.statistics.org.repos, entry.statistics.community.repos, filter);
		const reposWithSkills = sumOwnerValues(
			entry.statistics.org.repos_with_skills,
			entry.statistics.community.repos_with_skills,
			filter,
		);
		return {
			label: '',
			value: getRepoAdoptionPct(reposWithSkills, repos),
		};
	});
}

function resolveCollectionStats(entry: CollectionEntry, filter: OwnerFilter): CollectionStatistics {
	if (filter === 'org') return entry.statistics.org;
	if (filter === 'community') return entry.statistics.community;
	return {
		repos: entry.statistics.org.repos + entry.statistics.community.repos,
		repos_with_skills: entry.statistics.org.repos_with_skills + entry.statistics.community.repos_with_skills,
		skills: entry.statistics.org.skills + entry.statistics.community.skills,
		files: entry.statistics.org.files + entry.statistics.community.files,
	};
}

export function getHistoryRowMetrics(
	entry: CollectionEntry,
	previous: CollectionEntry | null,
	filter: OwnerFilter,
): HistoryRowMetrics {
	const stats = resolveCollectionStats(entry, filter);
	const previousStats = previous ? resolveCollectionStats(previous, filter) : null;

	const skillDiff = previousStats ? stats.skills - previousStats.skills : 0;
	const adoptionPct = getRepoAdoptionPct(stats.repos_with_skills, stats.repos);
	const prevAdoptionPct = previousStats ? getRepoAdoptionPct(previousStats.repos_with_skills, previousStats.repos) : 0;

	return {
		stats,
		previousStats,
		skillDiff,
		adoptionPct,
		prevAdoptionPct,
		repoDiff: previousStats ? adoptionPct - prevAdoptionPct : 0,
	};
}
