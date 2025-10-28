import { loadSettings } from '../utils/settings.js';

let _whitelistCache = { pattern: undefined, regex: null };

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

function extractSegment(url, startToken, endToken) {
	const startIdx = url.indexOf(startToken);
	if (startIdx === -1) return null;
	const afterStart = startIdx + startToken.length;
	const endIdx = url.indexOf(endToken, afterStart);
	if (endIdx === -1) return null;
	const between = url.substring(afterStart, endIdx);
	return between || null;
}

function compileWhitelistCached(pattern) {
	if (!pattern) {
		_whitelistCache = { pattern: undefined, regex: null };
		return null;
	}
	if (_whitelistCache.pattern === pattern) return _whitelistCache.regex;
	try {
		const re = new RegExp(pattern);
		_whitelistCache = { pattern, regex: re };
		return re;
	} catch (_e) {
		_whitelistCache = { pattern, regex: null };
		return null;
	}
}

function isHostAllowed(url, whitelistRe) {
	try {
		const u = new URL(url);
		const host = u.hostname || '';
		if (!whitelistRe) return false; // if not configured/invalid, block all
		return whitelistRe.test(host);
	} catch (_e) {
		return false;
	}
}

async function getCurrentConfig() {
	const s = await loadSettings();
	return {
		START_TOKEN: s.startToken,
		END_TOKEN: s.endToken,
		WHITELIST_RE: compileWhitelistCached(s.whitelistRegex)
	};
}

async function initializeSettingsAndBadge() {
	await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
	const { matches = [] } = await chrome.storage.local.get({ matches: [] });
	await setBadgeCount(matches.length);
}

if (chrome && chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(async () => {
        await initializeSettingsAndBadge();
    });
} else {
    // Fallback: try to initialize immediately if events are unavailable
    initializeSettingsAndBadge();
}

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(async () => {
	const { matches = [] } = await chrome.storage.local.get({ matches: [] });
	await setBadgeCount(matches.length);
});

if (chrome && chrome.webRequest && chrome.webRequest.onCompleted) {
	chrome.webRequest.onCompleted.addListener(
		async (details) => {
			const { url } = details;
			if (!url) return;
			const { START_TOKEN, END_TOKEN, WHITELIST_RE } = await getCurrentConfig();
			if (!url.includes(END_TOKEN)) return;
			if (!url.includes(START_TOKEN)) return;
			if (!isHostAllowed(url, WHITELIST_RE)) return;
			const segment = extractSegment(url, START_TOKEN, END_TOKEN);
			if (!segment) return;
			addMatch(segment).catch(() => {});
		},
		{ urls: ['<all_urls>'] }
	);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	if (msg && msg.type === 'getMatches') {
		chrome.storage.local.get({ matches: [] }, ({ matches }) => {
			sendResponse({ matches });
		});
		return true;
	}
	if (msg && msg.type === 'refreshSettings') {
		// No globals to refresh; acknowledge save so UI can notify user
		sendResponse({ ok: true });
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
