const listEl = document.getElementById('list');
const emptyStateEl = document.getElementById('emptyState');
const clearBtn = document.getElementById('clearBtn');
const settingsBtn = document.getElementById('settingsBtn');
const openInEclipseBtn = document.getElementById('openInEclipseBtn');

import { loadSettings } from '../utils/settings.js';
import { buildAdtHref as buildAbapGitAdtHref } from '../utils/abapgit.js';

let ADT_BASE = 'adt://DCL/sap/bc/adt/businessservices/bindings';

function buildAdtHref(segment) {
	const raw = String(segment).trim();
	const encoded = encodeURIComponent(raw);
	return `${ADT_BASE}/${encoded}`;
}

function render(matches) {
	listEl.innerHTML = '';
	if (!matches || matches.length === 0) {
		emptyStateEl.style.display = 'block';
		return;
	}
	emptyStateEl.style.display = 'none';
	for (const segment of matches) {
		const li = document.createElement('li');
		const link = document.createElement('a');
		link.href = buildAdtHref(segment);
		link.textContent = String(segment).toUpperCase();
		link.className = 'link';
		link.target = '_blank';
		link.rel = 'noopener';

		const copyBtn = document.createElement('button');
		copyBtn.className = 'copyBtn';
		copyBtn.textContent = 'Copy';
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(segment);
				copyBtn.textContent = 'Copied!';
				setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
			} catch (e) {
				const ta = document.createElement('textarea');
				ta.value = segment;
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				copyBtn.textContent = 'Copied!';
				setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
			}
		});
		li.appendChild(link);
		li.appendChild(copyBtn);
		listEl.appendChild(li);
	}
}

async function checkAndShowEclipseButton() {
	try {
		const settings = await loadSettings();
		const whitelistRegex = settings.abapgitWhitelistRegex || '^https://github\\.com/.*';
		const adtProjectName = settings.adtProjectName || 'DCL';
		
		// Get current tab URL
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab || !tab.url) {
			openInEclipseBtn.style.display = 'none';
			return;
		}
		
		const currentUrl = tab.url;
		
		// Check if URL matches whitelist regex
		try {
			const regex = new RegExp(whitelistRegex);
			if (!regex.test(currentUrl)) {
				openInEclipseBtn.style.display = 'none';
				return;
			}
		} catch (e) {
			// Invalid regex, hide button
			openInEclipseBtn.style.display = 'none';
			return;
		}
		
		// Try to build ADT href - if it throws, hide button
		try {
			const adtLink = buildAbapGitAdtHref(currentUrl, adtProjectName);
			// Success - show button and store the link
			openInEclipseBtn.dataset.adtLink = adtLink;
			openInEclipseBtn.style.display = 'inline-block';
		} catch (e) {
			// buildAbapGitAdtHref failed, hide button
			openInEclipseBtn.style.display = 'none';
		}
	} catch (e) {
		// Any error, hide button
		openInEclipseBtn.style.display = 'none';
	}
}

async function load() {
	const s = await loadSettings();
	ADT_BASE = s.adtBase || ADT_BASE;
	
	// Check and show Eclipse button
	await checkAndShowEclipseButton();
	
    chrome.runtime.sendMessage({ type: 'getMatches' }, (resp) => {
        if (chrome.runtime && chrome.runtime.lastError) {
            render([]);
            return;
        }
        render((resp && resp.matches) || []);
    });
}

clearBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'clearMatches' }, (_resp) => {
        // In case background isn't ready, just clear UI
        render([]);
    });
});

if (settingsBtn) {
	settingsBtn.addEventListener('click', () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options/options.html'));
		}
	});
}

if (openInEclipseBtn) {
	openInEclipseBtn.addEventListener('click', () => {
		const adtLink = openInEclipseBtn.dataset.adtLink;
		if (adtLink) {
			// Open ADT link - create a temporary anchor element for custom protocol links
			const link = document.createElement('a');
			link.href = adtLink;
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	});
}

chrome.runtime.onMessage.addListener((msg) => {
	if (msg && msg.type === 'newMatch') {
		load();
	}
	if (msg && msg.type === 'refreshSettings') {
		checkAndShowEclipseButton();
	}
});

document.addEventListener('DOMContentLoaded', load);
