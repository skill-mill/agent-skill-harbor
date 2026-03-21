<script lang="ts">
	const taglines = [
		'Powered by Agent Skill Harbor — Skills in. Chaos out.',
		'Powered by Agent Skill Harbor — See the skills. Shape the policy.',
		'Powered by Agent Skill Harbor — Nurturing skills is the new team building.',
		'Powered by Agent Skill Harbor — Skill curation is the new knowledge management.',
		'Powered by Agent Skill Harbor — Skill Governance for companies. Skill Discovery for teams.',
	];

	const tagline = taglines[Math.floor(Math.random() * taglines.length)];
</script>

<footer class="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<p class="text-center text-sm text-gray-500 dark:text-gray-400">
			<a
				href="https://github.com/skill-mill/agent-skill-harbor"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-gray-700 hover:underline dark:hover:text-gray-200"
			>
				{tagline}
			</a>
		</p>
	</div>
</footer>
