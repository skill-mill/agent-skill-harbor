import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/**'],
	},
	...tseslint.configs.recommended,
	{
		files: ['bin/**/*.ts', 'src/**/*.ts'],
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
);
