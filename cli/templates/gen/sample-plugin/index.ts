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
					label: 'Ex01',
					raw: 'This is an example user-defined post-collect plugin result with an "Ex01" label.',
				};
			} else if (variant === 1) {
				results[skillKey] = {
					label: 'Ex02',
					raw: 'This is an example user-defined post-collect plugin result with an "Ex02" label.',
				};
			} else {
				results[skillKey] = {
					raw: 'This is an example user-defined post-collect plugin result without a label.',
				};
			}
			index += 1;
		}
	}

	return {
		summary: `Generated example output for ${Object.keys(results).length} skill(s).`,
		label_intents: {
			Ex01: 'success' as const,
			Ex02: 'warn' as const,
		},
		results,
	};
}
