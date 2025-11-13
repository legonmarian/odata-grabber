import { settingsSchema, loadSettings, saveSettings, resetSettings, coerceValueBySchema } from '../utils/settings.js';

const form = document.getElementById('settingsForm');
const toast = document.getElementById('toast');

function showToast(msg) {
	toast.textContent = msg;
	toast.style.display = 'block';
	setTimeout(() => (toast.style.display = 'none'), 1500);
}

function renderForm(values) {
	form.innerHTML = '';
	
	// Group entries by section
	const sections = {};
	for (const entry of settingsSchema) {
		const section = entry.section;
		if (!sections[section]) {
			sections[section] = [];
		}
		sections[section].push(entry);
	}
	
	// Render sections
	for (const [sectionName, entries] of Object.entries(sections)) {
		// Add section header
		const sectionHeader = document.createElement('h2');
		sectionHeader.className = 'section-header';
		sectionHeader.textContent = sectionName;
		form.appendChild(sectionHeader);
		
		// Add fields for this section
		for (const entry of entries) {
			const field = document.createElement('div');
			field.className = 'field';
			const label = document.createElement('label');
			label.setAttribute('for', entry.key);
			label.textContent = entry.name;
			const input = document.createElement('input');
			input.type = 'text';
			input.id = entry.key;
			input.name = entry.key;
			input.value = values[entry.key] ?? '';
			const desc = document.createElement('div');
			desc.className = 'description';
			desc.textContent = entry.description;
			field.appendChild(label);
			field.appendChild(input);
			field.appendChild(desc);
			form.appendChild(field);
		}
	}

	const actions = document.createElement('div');
	actions.className = 'actions';
	const saveBtn = document.createElement('button');
	saveBtn.type = 'button';
	saveBtn.className = 'primary';
	saveBtn.textContent = 'Save';
	saveBtn.addEventListener('click', async () => {
		const data = {};
		for (const entry of settingsSchema) {
			const el = document.getElementById(entry.key);
			data[entry.key] = coerceValueBySchema(entry.key, el.value);
		}
		await saveSettings(data);
		try {
			await chrome.runtime.sendMessage({ type: 'refreshSettings' });
		} catch {}
		showToast('Settings saved');
	});

	const resetBtn = document.createElement('button');
	resetBtn.type = 'button';
	resetBtn.textContent = 'Restore defaults';
	resetBtn.addEventListener('click', async () => {
		const defaults = await resetSettings();
		renderForm(defaults);
		try {
			await chrome.runtime.sendMessage({ type: 'refreshSettings' });
		} catch {}
		showToast('Defaults restored');
	});

	actions.appendChild(saveBtn);
	actions.appendChild(resetBtn);
	form.appendChild(actions);
}

(async function init() {
	const vals = await loadSettings();
	renderForm(vals);
})();


