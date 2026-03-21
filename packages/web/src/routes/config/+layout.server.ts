import {
	loadSettingsConfig,
	loadGovernanceConfig,
	loadSettingsConfigRaw,
	loadGovernanceConfigRaw,
} from '$lib/server/catalog';

export const load = () => {
	return {
		settings: loadSettingsConfig(),
		governance: loadGovernanceConfig(),
		rawConfigs: {
			harbor: loadSettingsConfigRaw(),
			governance: loadGovernanceConfigRaw(),
		},
	};
};
