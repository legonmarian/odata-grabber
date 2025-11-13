// Schema-driven settings for the extension, persisted in chrome.storage.sync

export const settingsSchema = [
	{
		key: 'startToken',
		name: 'Prefix (start token)',
		type: 'string',
		section: 'General',
		description: 'URL prefix to start extracting after (e.g. /sap/opu/odata).',
		defaultValue: '/sap/opu/odata'
	},
	{
		key: 'endToken',
		name: 'Suffix (end token)',
		type: 'string',
		section: 'General',
		description: 'URL suffix that marks the end of extraction (e.g. /$batch).',
		defaultValue: '/$batch'
	},
	{
		key: 'adtBase',
		name: 'ADT link base',
		type: 'string',
		section: 'General',
		description: 'Base used to build the ADT link in the popup.',
		defaultValue: 'adt://DCL/sap/bc/adt/businessservices/bindings'
	},
	{
		key: 'whitelistRegex',
		name: 'Whitelisted domains (regex)',
		type: 'string',
		section: 'General',
		description: 'Only capture on hosts matching this regex (applied to hostname).',
		defaultValue: '^.*\\.launchpad\\.cfapps\\..*\\.hana\\.ondemand\\.com$'
	},
	{
		key: 'abapgitWhitelistRegex',
		name: 'Whitelisted repository domains (regex)',
		type: 'string',
		section: 'abapgit',
		description: 'Only convert GitHub/abapGit URLs matching this regex pattern.',
		defaultValue: '^https://github\\.com/.*'
	},
	{
		key: 'adtProjectName',
		name: 'ADT project name',
		type: 'string',
		section: 'abapgit',
		description: 'ADT system/project name used when building ADT links from abapGit URLs.',
		defaultValue: 'DCL'
	}
];

export function getDefaultSettings() {
	const defaults = {};
	for (const entry of settingsSchema) {
		defaults[entry.key] = entry.defaultValue;
	}
	return defaults;
}

export async function loadSettings() {
	const defaults = getDefaultSettings();
	const stored = await chrome.storage.sync.get({ settings: {} });
	const merged = { ...defaults, ...(stored.settings || {}) };
	return merged;
}

export async function saveSettings(partialSettings) {
	const current = await loadSettings();
	const merged = { ...current, ...partialSettings };
	await chrome.storage.sync.set({ settings: merged });
	return merged;
}

export async function resetSettings() {
	const defaults = getDefaultSettings();
	await chrome.storage.sync.set({ settings: defaults });
	return defaults;
}

export function coerceValueBySchema(key, rawValue) {
	const def = settingsSchema.find((e) => e.key === key);
	if (!def) return rawValue;
	if (def.type === 'string') return String(rawValue);
	return rawValue;
}


