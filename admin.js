// Admin Authentication and Dashboard

// Default password (used only to derive a default SHA-256 hash at runtime)
const DEFAULT_PASSWORD = 'brickyard2025';

// Crypto helpers
async function sha256Hex(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSavedPasswordHash() {
    // Prefer stored hash
    const storedHash = localStorage.getItem('adminPasswordHash');
    if (storedHash) return storedHash;

    // Migrate old plain-text password if it exists
    const legacyPlain = localStorage.getItem('adminPassword');
    if (legacyPlain) {
        const hashed = await sha256Hex(legacyPlain);
        localStorage.setItem('adminPasswordHash', hashed);
        localStorage.removeItem('adminPassword');
        return hashed;
    }

    // Fall back to default password hash (not stored)
    return await sha256Hex(DEFAULT_PASSWORD);
}

async function setNewAdminPassword(newPassword) {
    const hashed = await sha256Hex(newPassword);
    localStorage.setItem('adminPasswordHash', hashed);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogin();
    setupLogout();
    setupSearch();
    setupFilters();
    loadSubmissions();
    setupGenerateTestDataButton();
    setupClearTestDataButton();
    
    // Setup tabs after all scripts are loaded
    setTimeout(() => {
        if (typeof setupTabs === 'function') {
            setupTabs();
        }
        // Load initial data for active tab
        loadInitialData();
    }, 100);
});

// Load initial data based on active tab
function loadInitialData() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (!activeTab) return;
    
    const targetTab = activeTab.dataset.tab;
    
    if (targetTab === 'clients' && typeof loadClients === 'function') {
        loadClients();
    } else if (targetTab === 'schedule' && typeof loadAppointments === 'function') {
        loadAppointments();
    } else if (targetTab === 'today' && typeof loadTodayOperations === 'function') {
        loadTodayOperations();
    } else if (targetTab === 'current' && typeof loadCurrentAnimalsDetailed === 'function') {
        loadCurrentAnimalsDetailed();
    } else if (targetTab === 'submissions') {
        loadSubmissions();
    }
}

// Hook up Generate Test Data button (clients tab)
function setupGenerateTestDataButton() {
    const btn = document.getElementById('generateTestDataBtn');
    if (!btn || typeof window.generateTestData !== 'function') return;
    btn.addEventListener('click', () => {
        const confirmed = confirm('Generate 150 clients with 1-2 animals each?');
        if (!confirmed) return;
        const result = window.generateTestData({ numClients: 150, minAnimalsPerClient: 1, maxAnimalsPerClient: 2 });
        // Some generators return synchronously; ensure UI refresh
        setTimeout(() => {
            if (typeof loadClients === 'function') {
                loadClients();
            }
            alert('Test data generated. Open Clients tab to view.');
        }, 50);
    });
}

// Hook up Clear Test Data button
function setupClearTestDataButton() {
    const btn = document.getElementById('clearTestDataBtn');
    if (!btn || typeof window.clearTestData !== 'function') return;
    btn.addEventListener('click', () => {
        const cleared = window.clearTestData();
        if (cleared && typeof loadClients === 'function') {
            setTimeout(() => loadClients(), 50);
        }
    });
}

// Check if user is authenticated
function checkAuth() {
    // Enforce 1-day timeout using a persistent expiry in localStorage
    const expiry = parseInt(localStorage.getItem('adminAuthExpiry') || '0', 10);
    const now = Date.now();
    const notExpired = expiry && expiry > now;

    // If a valid, unexpired session exists in localStorage, ensure this tab session is marked
    if (notExpired && sessionStorage.getItem('adminAuthenticated') !== 'true') {
        sessionStorage.setItem('adminAuthenticated', 'true');
    }

    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true' && notExpired;
    const loginContainer = document.getElementById('loginContainer');
    const adminDashboard = document.getElementById('adminDashboard');

    if (isAuthenticated) {
        loginContainer.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadSubmissions();
        // Load initial data for active tab
        setTimeout(() => {
            loadInitialData();
        }, 100);
    } else {
        // Clear stale state
        sessionStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminAuthExpiry');
        loginContainer.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

// Setup login form
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginError');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        (async () => {
            const entered = document.getElementById('password').value;
            const [savedHash, enteredHash] = await Promise.all([
                getSavedPasswordHash(),
                sha256Hex(entered)
            ]);

            if (enteredHash === savedHash) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                // Set expiry for 24 hours from now
                const oneDayMs = 24 * 60 * 60 * 1000;
                localStorage.setItem('adminAuthExpiry', String(Date.now() + oneDayMs));
                checkAuth();
            } else {
                errorMessage.textContent = 'Incorrect password. Please try again.';
                errorMessage.classList.add('show');
                setTimeout(() => {
                    errorMessage.classList.remove('show');
                }, 3000);
            }
        })();
    });
}

// Setup logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminAuthExpiry');
        checkAuth();
        window.location.href = 'admin.html';
    });
}

// Load and display submissions
function loadSubmissions() {
    const submissions = getSubmissions();
    const submissionsList = document.getElementById('submissionsList');
    const totalSubmissions = document.getElementById('totalSubmissions');
    const pendingSubmissions = document.getElementById('pendingSubmissions');

    totalSubmissions.textContent = submissions.length;
    pendingSubmissions.textContent = submissions.filter(s => !s.contacted).length;

    if (submissions.length === 0) {
        submissionsList.innerHTML = `
            <div class="no-submissions">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No contact submissions yet</p>
                <span>Submissions from the contact form will appear here</span>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    submissions.sort((a, b) => new Date(b.date) - new Date(a.date));

    submissionsList.innerHTML = submissions.map((submission, index) => {
        const date = new Date(submission.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="submission-card" data-index="${index}" data-service="${submission.service || 'other'}">
                <div class="submission-header">
                    <div class="submission-info">
                        <h3>${escapeHtml(submission.name)}</h3>
                        <p><a href="mailto:${escapeHtml(submission.email)}">${escapeHtml(submission.email)}</a></p>
                        ${submission.phone ? `<p><a href="tel:${escapeHtml(submission.phone)}">${escapeHtml(submission.phone)}</a></p>` : ''}
                    </div>
                    <div class="submission-meta">
                        <span class="submission-date">${formattedDate}</span>
                        ${submission.service ? `<span class="service-badge ${submission.service}">${escapeHtml(submission.service)}</span>` : ''}
                    </div>
                </div>
                ${submission.message ? `<div class="submission-message">${escapeHtml(submission.message)}</div>` : ''}
                <div class="submission-actions">
                    ${submission.email ? `<a href="mailto:${escapeHtml(submission.email)}" class="btn-small btn-contact">Reply via Email</a>` : ''}
                    ${submission.phone ? `<a href="tel:${escapeHtml(submission.phone)}" class="btn-small btn-contact">Call</a>` : ''}
                    <button class="btn-small btn-delete" onclick="deleteSubmission(${index})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Get submissions from localStorage
function getSubmissions() {
    const submissions = localStorage.getItem('contactSubmissions');
    return submissions ? JSON.parse(submissions) : [];
}

// Delete a submission
async function deleteSubmission(index) {
    const confirmed = await showConfirm('Delete Submission', 'Are you sure you want to delete this submission?');
    if (!confirmed) {
        return;
    }

    const submissions = getSubmissions();
    submissions.splice(index, 1);
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
    loadSubmissions();
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.submission-card');

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const cards = document.querySelectorAll('.submission-card');

            cards.forEach(card => {
                if (filter === 'all') {
                    card.classList.remove('hidden');
                } else {
                    const service = card.dataset.service || 'other';
                    if (service === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Function to save submission (called from main contact form)
function saveSubmission(data) {
    const submissions = getSubmissions();
    submissions.push({
        ...data,
        date: new Date().toISOString(),
        contacted: false
    });
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
}

// Make saveSubmission available globally
window.saveSubmission = saveSubmission;

