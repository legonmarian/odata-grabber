import { loadSettings } from './settings.js';

let START_TOKEN = '/sap/opu/odata';
let END_TOKEN = '/$batch';
let WHITELIST_RE = null; // RegExp or null

async function setBadgeCount(count) {
	const text = count > 0 ? String(count) : '';
	await chrome.action.setBadgeText({ text });
}

async function addMatch(segment) {
	const { matches = [] } = await chrome.storage.local.get({ matches: [] });
	if (!matches.includes(segment)) {
		matches.unshift(segment);
		await chrome.storage.local.set({ matches });
		await setBadgeCount(matches.length);
		try {
			chrome.runtime.sendMessage({ type: 'newMatch', segment });
		} catch (e) {
			// ignore if no listeners
		}
	}
}

function extractSegment(url) {
	const startIdx = url.indexOf(START_TOKEN);
	if (startIdx === -1) return null;
	const afterStart = startIdx + START_TOKEN.length;
	const endIdx = url.indexOf(END_TOKEN, afterStart);
	if (endIdx === -1) return null;
	const between = url.substring(afterStart, endIdx);
	return between || null;
}

function compileWhitelistRegex(pattern) {
	if (!pattern) return null;
	try {
		return new RegExp(pattern);
 	} catch (_e) {
 		return null;
 	}
}

function isHostAllowed(url) {
 	try {
 		const u = new URL(url);
 		const host = u.hostname || '';
		if (!WHITELIST_RE) return false; // if not configured/invalid, block all
 		return WHITELIST_RE.test(host);
 	} catch (_e) {
 		return false;
 	}
}

chrome.runtime.onInstalled.addListener(async () => {
	try {
		await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
		// initialize tokens from settings
		const s = await loadSettings();
		START_TOKEN = s.startToken || START_TOKEN;
		END_TOKEN = s.endToken || END_TOKEN;
		WHITELIST_RE = compileWhitelistRegex(s.whitelistRegex);
		const { matches = [] } = await chrome.storage.local.get({ matches: [] });
		await setBadgeCount(matches.length);
	} catch (e) {
		// ignore
	}
});

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(async () => {
	const s = await loadSettings();
	START_TOKEN = s.startToken || START_TOKEN;
	END_TOKEN = s.endToken || END_TOKEN;
	WHITELIST_RE = compileWhitelistRegex(s.whitelistRegex);
	const { matches = [] } = await chrome.storage.local.get({ matches: [] });
	await setBadgeCount(matches.length);
});

chrome.webRequest.onCompleted.addListener(
	(details) => {
		const { url } = details;
		if (!url || !url.includes(END_TOKEN)) return;
		if (!url.includes(START_TOKEN)) return;
		if (!isHostAllowed(url)) return;
		const segment = extractSegment(url);
		if (!segment) return;
		addMatch(segment).catch(() => {});
	},
	{ urls: ['<all_urls>'] }
);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg && msg.type === 'getMatches') {
		chrome.storage.local.get({ matches: [] }, ({ matches }) => {
			sendResponse({ matches });
		});
		return true;
	}
	if (msg && msg.type === 'refreshSettings') {
		loadSettings().then((s) => {
			START_TOKEN = s.startToken || START_TOKEN;
			END_TOKEN = s.endToken || END_TOKEN;
			WHITELIST_RE = compileWhitelistRegex(s.whitelistRegex);
			sendResponse({ ok: true });
		});
		return true;
	}
	if (msg && msg.type === 'clearMatches') {
		chrome.storage.local.set({ matches: [] }, async () => {
			await setBadgeCount(0);
			sendResponse({ ok: true });
		});
		return true;
	}
	return false;
});
