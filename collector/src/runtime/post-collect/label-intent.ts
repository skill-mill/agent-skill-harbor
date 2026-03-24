import type { LabelIntent } from './types.js';

export function isLabelIntent(intent: string | undefined): intent is LabelIntent {
	return intent === 'neutral' || intent === 'info' || intent === 'success' || intent === 'warn' || intent === 'danger';
}

export function normalizeLabelIntent(intent: string | undefined): LabelIntent {
	return isLabelIntent(intent) ? intent : 'neutral';
}
