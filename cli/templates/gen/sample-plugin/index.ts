export async function run(context: {
	catalog: {
		repositories: Record<
			string,
			{
				skills: Record<string, { tree_sha: string | null }>;
			}
		>;
	};
}) {
	const results: Record<string, { label?: string; raw: string }> = {};
	let index = 0;

	for (const [repoKey, repoEntry] of Object.entries(context.catalog.repositories)) {
		for (const skillPath of Object.keys(repoEntry.skills)) {
			const skillKey = `${repoKey}/${skillPath}`;
			const variant = index % 3;
			if (variant === 0) {
				results[skillKey] = {
					label: 'Pass',
					raw: 'This is a sample post-collect plugin result with a "Pass" label.',
				};
			} else if (variant === 1) {
				results[skillKey] = {
					label: 'Review',
					raw: 'This is a sample post-collect plugin result with a "Review" label.',
				};
			} else {
				results[skillKey] = {
					raw: 'This is a sample post-collect plugin result without a label.',
				};
			}
			index += 1;
		}
	}

	return {
		summary: `Generated sample output for ${Object.keys(results).length} skill(s).`,
		label_intents: {
			Pass: 'success' as const,
			Review: 'warn' as const,
		},
		results,
	};
}
