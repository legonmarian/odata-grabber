const listEl = document.getElementById('list');
const emptyStateEl = document.getElementById('emptyState');
const clearBtn = document.getElementById('clearBtn');
const settingsBtn = document.getElementById('settingsBtn');

import { loadSettings } from './settings.js';

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

async function load() {
	const s = await loadSettings();
	ADT_BASE = s.adtBase || ADT_BASE;
	chrome.runtime.sendMessage({ type: 'getMatches' }, (resp) => {
		render((resp && resp.matches) || []);
	});
}

clearBtn.addEventListener('click', () => {
	chrome.runtime.sendMessage({ type: 'clearMatches' }, (resp) => {
		render([]);
	});
});

if (settingsBtn) {
	settingsBtn.addEventListener('click', () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	});
}

chrome.runtime.onMessage.addListener((msg) => {
	if (msg && msg.type === 'newMatch') {
		load();
	}
});

document.addEventListener('DOMContentLoaded', load);
