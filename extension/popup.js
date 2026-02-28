const API_URL = 'https://api.mail.tm';
const APP_URL = 'https://mail.creativeutil.com';

const addressEl = document.getElementById('address');
const refreshBtn = document.getElementById('refresh');
const inboxBtn = document.getElementById('open-inbox');
const statusEl = document.getElementById('status');
const copyContainer = document.getElementById('address-container');

async function getDomains() {
    try {
        const res = await fetch(`${API_URL}/domains`);
        const data = await res.json();
        return data['hydra:member'] || [];
    } catch (e) {
        console.error('Failed to fetch domains', e);
        return [];
    }
}

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function createNewInbox() {
    showStatus('Generating...', true);
    const domains = await getDomains();
    if (!domains.length) {
        showStatus('Error: No domains found', false);
        return null;
    }

    const domain = domains[0].domain;
    const username = generateRandomString(10);
    const password = generateRandomString(15);
    const email = `${username}@${domain}`;

    try {
        const res = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password })
        });

        if (res.ok) {
            const data = await res.json();
            const inbox = { email, password, id: data.id };
            chrome.storage.local.set({ currentInbox: inbox });
            updateUI(email);
            showStatus('Ready!', false);
            return inbox;
        } else {
            showStatus('Failed to create inbox', false);
        }
    } catch (e) {
        showStatus('Connection error', false);
    }
}

function updateUI(email) {
    addressEl.textContent = email;
}

function showStatus(text, loading = false) {
    statusEl.innerHTML = loading ? `<div class="loader"></div>` : text;
}

function copyToClipboard() {
    const email = addressEl.textContent;
    if (email === 'Loading...' || email === 'Failed to create inbox') return;

    navigator.clipboard.writeText(email).then(() => {
        const originalText = addressEl.textContent;
        addressEl.textContent = 'Copied!';
        setTimeout(() => {
            addressEl.textContent = originalText;
        }, 1500);
    });
}

// Event Listeners
refreshBtn.addEventListener('click', createNewInbox);

inboxBtn.addEventListener('click', () => {
    window.open(APP_URL, '_blank');
});

copyContainer.addEventListener('click', copyToClipboard);

// Initialize
chrome.storage.local.get(['currentInbox'], (result) => {
    if (result.currentInbox && result.currentInbox.email) {
        updateUI(result.currentInbox.email);
        showStatus('Active address loaded', false);
    } else {
        createNewInbox();
    }
});
