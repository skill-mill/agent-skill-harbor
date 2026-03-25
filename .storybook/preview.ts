import type { Preview } from '@storybook/sveltekit';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/app.css';

const preview: Preview = {
	decorators: [
		withThemeByClassName({
			themes: {
				light: '',
				dark: 'dark',
			},
			defaultTheme: 'light',
			parentSelector: 'body',
		}),
	],
	parameters: {
		layout: 'centered',
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
