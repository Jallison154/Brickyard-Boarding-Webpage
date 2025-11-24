// Client Management System - Rewritten for Better UX

// Global state
let clients = [];
let filteredClients = [];
let currentPage = 1;
let clientsPerPage = 20;
let searchTerm = '';
let sortBy = 'name'; // name, phone, lastVisit
let sortOrder = 'asc'; // asc, desc

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadClientsFromStorage();
        setupEventListeners();
        // Don't render immediately - wait for tab to be activated
        updateStats();
    } catch (error) {
        handleError('Failed to initialize clients module', error);
    }
});

// Setup tab switching (for compatibility with admin.js)
function setupTabs() {
    try {
        const tabBtns = document.querySelectorAll('.tab-btn');
        if (!tabBtns || tabBtns.length === 0) return;
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    const targetTab = btn.dataset.tab;
                    if (!targetTab) return;
                    
                    // Update active tab button
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Show/hide tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    const targetContent = document.getElementById(targetTab + 'Tab');
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                    
                    // Load data for the active tab
                    if (targetTab === 'clients') {
                        setTimeout(() => {
                            filterAndRenderClients();
                        }, 50);
                    } else if (targetTab === 'current' && typeof loadCurrentAnimalsDetailed === 'function') {
                        setTimeout(() => {
                            loadCurrentAnimalsDetailed();
                        }, 50);
                    } else if (targetTab === 'today' && typeof loadTodayOperations === 'function') {
                        setTimeout(() => {
                            loadTodayOperations();
                        }, 50);
                    }
                } catch (error) {
                    handleError('Error switching tabs', error);
                }
            });
        });
    } catch (error) {
        handleError('Failed to setup tabs', error);
    }
}

// Error handling utility
function handleError(message, error) {
    // Only log in development, show user-friendly message in production
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error(message, error);
    }
    // Could add user notification here if needed
}

// Get animal icon image
function getAnimalIcon(animalType) {
    const type = animalType || 'Dog';
    const iconFile = type === 'Cat' ? 'cat-icon.png' : 'dog-icon.png';
    return `<img src="resources/images/${iconFile}" alt="${type}" class="animal-icon" style="width: 1.2em; height: 1.2em; vertical-align: middle; display: inline-block;">`;
}

// Load clients from localStorage
function loadClientsFromStorage() {
    try {
        const stored = localStorage.getItem('clients');
        if (!stored) {
            clients = [];
            return;
        }
        clients = JSON.parse(stored);
        if (!Array.isArray(clients)) {
            clients = [];
        }
    } catch (error) {
        handleError('Error loading clients from storage', error);
        clients = [];
    }
}

// Save clients to localStorage
function saveClientsToStorage() {
    try {
        if (!Array.isArray(clients)) {
            handleError('Clients data is invalid', new Error('Clients is not an array'));
            return;
        }
        localStorage.setItem('clients', JSON.stringify(clients));
    } catch (error) {
        handleError('Error saving clients to storage', error);
        // Check if storage quota is exceeded
        if (error.name === 'QuotaExceededError') {
            alert('Storage limit exceeded. Please contact support.');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('clientSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            currentPage = 1;
            filterAndRenderClients();
        });
    }

    // Add client buttons (multiple IDs for different pages)
    const addBtn = document.getElementById('addClientBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openClientModal());
    }
    
    // Additional add client buttons on other pages
    const addBtnSubmissions = document.getElementById('addClientBtnSubmissions');
    if (addBtnSubmissions) {
        addBtnSubmissions.addEventListener('click', () => {
            // Switch to clients tab and open modal
            const clientsTab = document.querySelector('.tab-btn[data-tab="clients"]');
            if (clientsTab) {
                clientsTab.click();
                setTimeout(() => openClientModal(), 300);
    } else {
                openClientModal();
            }
        });
    }
    
    const addBtnCurrent = document.getElementById('addClientBtnCurrent');
    if (addBtnCurrent) {
        addBtnCurrent.addEventListener('click', () => {
            const clientsTab = document.querySelector('.tab-btn[data-tab="clients"]');
            if (clientsTab) {
                clientsTab.click();
                setTimeout(() => openClientModal(), 300);
            } else {
                openClientModal();
            }
        });
    }
    
    const addBtnToday = document.getElementById('addClientBtnToday');
    if (addBtnToday) {
        addBtnToday.addEventListener('click', () => {
            const clientsTab = document.querySelector('.tab-btn[data-tab="clients"]');
            if (clientsTab) {
                clientsTab.click();
                setTimeout(() => openClientModal(), 300);
            } else {
                openClientModal();
            }
        });
    }

    const addBtnSchedule = document.getElementById('addClientBtnSchedule');
    if (addBtnSchedule) {
        addBtnSchedule.addEventListener('click', () => {
            const clientsTab = document.querySelector('.tab-btn[data-tab="clients"]');
            if (clientsTab) {
                clientsTab.click();
                setTimeout(() => openClientModal(), 300);
            } else {
                openClientModal();
            }
        });
    }
    
    // Add appointment buttons - switch to schedule tab first
    const addAppointmentButtons = [
        'addAppointmentBtnSubmissions', 
        'addAppointmentBtnCurrent',
        'addAppointmentBtnToday',
        'addAppointmentBtn'
    ];
    
    // Note: addAppointmentBtn is handled by scheduling.js on the schedule tab
    // These buttons are on other tabs and need to switch to schedule tab first
    addAppointmentButtons.forEach(btnId => {
        const nodes = document.querySelectorAll(`#${btnId}`);
        nodes.forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof startAppointmentFlow === 'function') {
                    startAppointmentFlow();
                } else {
                    const scheduleTab = document.querySelector('.tab-btn[data-tab="schedule"]');
                    if (scheduleTab) scheduleTab.click();
                }
            });
        });
    });

    // View mode buttons
    const cardViewBtn = document.getElementById('cardViewBtn');
    const tableViewBtn = document.getElementById('columnViewBtn');
    
    if (cardViewBtn) {
        cardViewBtn.addEventListener('click', () => switchViewMode('card'));
    }
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', () => switchViewMode('table'));
    }
    
    // Setup modal close buttons
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeClientModal());
    }
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeClientModal());
    }
    
    const closeClientDetailsBtn = document.getElementById('closeClientDetailsModal');
    if (closeClientDetailsBtn) {
        closeClientDetailsBtn.addEventListener('click', () => closeClientDetailsModal());
    }
    
    // Setup backdrop click for client details modal (no form, so simple close)
    const clientDetailsModal = document.getElementById('clientDetailsModal');
    if (clientDetailsModal) {
        clientDetailsModal.addEventListener('click', (e) => {
            if (e.target === clientDetailsModal) {
                closeClientDetailsModal();
            }
        });
    }
    
    // Note: clientModal backdrop click is handled by setupModalWithTracking
}

// Filter and render clients - show owners with their animals
function filterAndRenderClients() {
    // Filter clients based on search term (search both owner and animal info)
    filteredClients = clients.filter(client => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Search owner fields
        const ownerMatch = 
            (client.familyName || '').toLowerCase().includes(searchLower) ||
            (client.contactName || '').toLowerCase().includes(searchLower) ||
            (client.phone || '').toLowerCase().includes(searchLower) ||
            (client.email || '').toLowerCase().includes(searchLower);
        
        // Search animal fields
        const animalMatch = client.dogs && client.dogs.some(dog =>
            (dog.name || '').toLowerCase().includes(searchLower) ||
            (dog.breed || '').toLowerCase().includes(searchLower)
        );
        
        return ownerMatch || animalMatch;
    });

    // Sort clients by owner name
    filteredClients.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = (a.familyName || '').toLowerCase();
                bValue = (b.familyName || '').toLowerCase();
                break;
            case 'phone':
                aValue = a.phone || '';
                bValue = b.phone || '';
                break;
            case 'lastVisit':
                aValue = new Date(a.lastVisit || 0);
                bValue = new Date(b.lastVisit || 0);
                break;
            default:
                aValue = (a.familyName || '').toLowerCase();
                bValue = (b.familyName || '').toLowerCase();
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
            } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    renderClients();
    updateStats();
}

// Render clients list
function renderClients() {
    const clientsList = document.getElementById('clientsList');
    if (!clientsList) return;

    // Calculate pagination
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    if (paginatedClients.length === 0) {
        clientsList.innerHTML = getEmptyStateHTML();
        renderPagination(0, 0);
        return;
    }
    
    // Get current view mode
    const viewMode = localStorage.getItem('clientsViewMode') || 'card';
    
    if (viewMode === 'card') {
        clientsList.innerHTML = renderCardView(paginatedClients);
        clientsList.className = 'clients-list clients-cards';
    } else {
        clientsList.innerHTML = renderTableView(paginatedClients);
        clientsList.className = 'clients-list clients-table';
    }
    
    renderPagination(filteredClients.length, totalPages);
}

// Render card view - showing owners with their animals nested
function renderCardView(clients) {
    return clients.map(client => {
        const dogCount = client.dogs ? client.dogs.length : 0;
        const hasMedications = client.dogs && client.dogs.some(dog => 
            dog.medications && (Array.isArray(dog.medications) ? dog.medications.length > 0 : (typeof dog.medications === 'string' ? dog.medications.trim() : false))
        );
        
        return `
            <div class="client-card" data-client-id="${client.id}" onclick="viewClientDetails('${client.id}')">
                <div class="client-card-header">
                    <div class="client-avatar">
                        ${(client.contactName || client.familyName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div class="client-info">
                        <h3 class="client-name">${escapeHtml(client.contactName || 'Unnamed')}</h3>
                    </div>
                    <div class="client-actions" onclick="event.stopPropagation()">
                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="client-card-body">
                    <div class="client-details">
                        ${client.phone ? `
                            <div class="detail-item">
                                <span class="detail-icon">📞</span>
                                <a href="tel:${escapeHtml(client.phone)}" class="detail-link" onclick="event.stopPropagation()">${escapeHtml(client.phone)}</a>
                    </div>
                        ` : ''}
                        ${client.email ? `
                            <div class="detail-item">
                                <span class="detail-icon">✉️</span>
                                <a href="mailto:${escapeHtml(client.email)}" class="detail-link" onclick="event.stopPropagation()">${escapeHtml(client.email)}</a>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <span class="detail-icon">${getAnimalIcon('Dog')}</span>
                            <span>${dogCount} animal${dogCount !== 1 ? 's' : ''}</span>
                    </div>
                    </div>
                    ${hasMedications ? `
                        <div class="medication-warning">
                            <span class="warning-icon">💊</span>
                            <span>Has medications</span>
                        </div>
                    ` : ''}
                    ${client.dogs && client.dogs.length > 0 ? `
                        <div class="animals-list">
                            ${client.dogs.map(dog => {
                                const animalType = dog.animalType || 'Dog';
                                const animalIcon = getAnimalIcon(animalType);
                                const dogHasMeds = dog.medications && (
                                    Array.isArray(dog.medications) ? dog.medications.length > 0 : 
                                    (typeof dog.medications === 'string' ? dog.medications.trim() : false)
                                );
                                return `
                                    <div class="animal-item">
                                        <div class="animal-icon">${animalIcon}</div>
                                        <div class="animal-info">
                                            <span class="animal-name">${escapeHtml(dog.name || 'Unnamed')}</span>
                                            ${dog.breed ? `<span class="animal-breed">${escapeHtml(dog.breed)}</span>` : ''}
                                        </div>
                                        ${dogHasMeds ? '<span class="animal-med-icon">💊</span>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Render table view - showing owners with their animals
function renderTableView(clients) {
    return `
        <div class="clients-table-container">
            <table class="clients-table">
                <thead>
                    <tr>
                        <th onclick="sortClients('name')" class="sortable">
                            Owner Name
                            ${sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th>Phone</th>
                        <th>Animals</th>
                        <th>Meds</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => {
                        const dogCount = client.dogs ? client.dogs.length : 0;
                        const hasMedications = client.dogs && client.dogs.some(dog => 
                            dog.medications && (Array.isArray(dog.medications) ? dog.medications.length > 0 : (typeof dog.medications === 'string' ? dog.medications.trim() : false))
                        );
                        const animalNames = client.dogs ? client.dogs.map(d => {
                            const icon = (d.animalType || 'Dog') === 'Cat' ? '🐱' : '🐕';
                            const hasMeds = d.medications && (
                                Array.isArray(d.medications) ? d.medications.length > 0 : 
                                (typeof d.medications === 'string' ? d.medications.trim() : false)
                            );
                            return `${icon} ${escapeHtml(d.name || 'Unnamed')}${hasMeds ? ' 💊' : ''}`;
                        }).join(', ') : 'No animals';
        
        return `
                            <tr class="client-row" data-client-id="${client.id}">
                                <td>
                                    <div class="client-name-cell">
                                        <strong>${escapeHtml(client.contactName || 'Unnamed')}</strong>
                                    </div>
                            </td>
                                <td>
                                    ${client.phone ? `
                                        <a href="tel:${escapeHtml(client.phone)}" class="phone-link">${escapeHtml(client.phone)}</a>
                                    ` : '-'}
                            </td>
                                <td>
                                    <div class="animals-cell">
                                        <span class="animal-count">${dogCount}</span>
                                        <span class="animal-names" title="${escapeHtml(animalNames)}">${escapeHtml(animalNames)}</span>
                                    </div>
                            </td>
                                <td>
                                    ${hasMedications ? '<span class="med-indicator" title="Has medications">💊</span>' : '-'}
                            </td>
                                <td>
                                    <div class="row-actions">
                                        <button class="btn-icon" onclick="viewClientDetails('${client.id}')" title="View Details">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                        <button class="btn-icon" onclick="editClient('${client.id}')" title="Edit">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Get empty state HTML
function getEmptyStateHTML() {
    if (searchTerm) {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No clients found</h3>
                <p>No clients or animals match your search for "${escapeHtml(searchTerm)}"</p>
                <button class="btn btn-secondary" onclick="clearSearch()">Clear Search</button>
            </div>
        `;
    } else {
        return `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>No clients yet</h3>
                <p>Start by adding your first client and their animals</p>
                <button class="btn btn-primary" onclick="openClientModal()">Add First Client</button>
            </div>
        `;
    }
}

// Render pagination
function renderPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('clientsPagination');
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const startItem = (currentPage - 1) * clientsPerPage + 1;
    const endItem = Math.min(currentPage * clientsPerPage, totalItems);
    
    paginationContainer.innerHTML = `
        <div class="pagination-info">
            Showing ${startItem}-${endItem} of ${totalItems} clients
        </div>
        <div class="pagination-controls">
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
            <div class="pagination-pages">
                ${Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 2 && page <= currentPage + 2);
                    })
                    .map((page, index, array) => {
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        return `
                            ${showEllipsis ? '<span class="pagination-ellipsis">...</span>' : ''}
                            <button class="pagination-page ${page === currentPage ? 'active' : ''}" onclick="changePage(${page})">
                                ${page}
                            </button>
                        `;
                    }).join('')}
            </div>
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        </div>
    `;
}

// Update statistics
function updateStats() {
    const totalClientsEl = document.getElementById('totalClients');
    const totalDogsEl = document.getElementById('totalDogs');
    
    if (totalClientsEl) {
        totalClientsEl.textContent = clients.length;
    }
    
    if (totalDogsEl) {
        const totalDogs = clients.reduce((sum, client) => sum + (client.dogs ? client.dogs.length : 0), 0);
        totalDogsEl.textContent = totalDogs;
    }
}

// Client modal functions
function openClientModal(client = null) {
    const modal = document.getElementById('clientModal');
    if (!modal) return;

    // Reset form
    const form = document.getElementById('clientForm');
    if (form) form.reset();

    // Set modal title
    const title = document.getElementById('modalTitle');
    if (title) {
        title.textContent = client ? 'Edit Client' : 'Add New Client';
    }

    // Populate form if editing
    if (client) {
        populateClientForm(client);
    }

    // Setup modal with tracking and click-away
    if (typeof setupModalWithTracking === 'function') {
        setupModalWithTracking('clientModal', 'clientForm', () => {
            closeClientModal();
        });
    }

    // Show modal
    modal.classList.add('active');
}

function populateClientForm(client) {
    const fields = [
        'clientId', 'familyName', 'contactName', 'email', 'phone', 
        'address', 'emergencyContact', 'emergencyPhone', 'vetName', 'vetPhone', 'notes'
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && client[field.replace('Id', 'id')]) {
            element.value = client[field.replace('Id', 'id')] || '';
        }
    });

    // Handle dogs
    const dogsContainer = document.getElementById('dogsContainer');
    if (dogsContainer && client.dogs) {
        dogsContainer.innerHTML = '';
        client.dogs.forEach(dog => {
            addDogForm(dog);
        });
    }
}

async function closeClientModal() {
    // Check for unsaved changes
    if (typeof hasUnsavedChanges === 'function' && hasUnsavedChanges('clientForm')) {
        const choice = await showUnsavedChangesModal('clientForm', () => {
            const form = document.getElementById('clientForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
                return new Promise(resolve => setTimeout(resolve, 100));
            }
        });
        
        if (choice === 'cancel') {
            return; // Stay open
        }
        
        // choice is 'saved' or 'dontsave' - proceed to close
    }
    
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset form
        const form = document.getElementById('clientForm');
        if (form) {
            form.reset();
            // Clear hidden fields
            const clientIdInput = document.getElementById('clientId');
            if (clientIdInput) {
                clientIdInput.value = '';
            }
            // Clear dogs container
            const dogsContainer = document.getElementById('dogsContainer');
            if (dogsContainer) {
                dogsContainer.innerHTML = '';
            }
        }
        
        // Reset form tracking
        if (typeof resetFormTracking === 'function') {
            resetFormTracking('clientForm');
        }
    }
}

// Dog form management
function addDogForm(dogData = null) {
    const container = document.getElementById('dogsContainer');
    if (!container) return;

    const dogId = dogData ? dogData.id : `dog_${Date.now()}`;
    const dogNumber = container.children.length + 1;

    const dogForm = document.createElement('div');
    dogForm.className = 'dog-form';
    dogForm.dataset.dogId = dogId;

    dogForm.innerHTML = `
        <div class="dog-form-header">
            <h4>Animal ${dogNumber}</h4>
            <button type="button" class="btn-remove" onclick="removeDogForm(this)">Remove</button>
                                    </div>
        <input type="hidden" class="dog-id" value="${dogId}">
        <div class="form-row">
            <div class="form-group">
                <label>Animal Type *</label>
                <select class="dog-type" required>
                    <option value="">Select type...</option>
                    <option value="Dog" ${dogData && dogData.animalType === 'Dog' ? 'selected' : ''}>Dog</option>
                    <option value="Cat" ${dogData && dogData.animalType === 'Cat' ? 'selected' : ''}>Cat</option>
                </select>
                                    </div>
            <div class="form-group">
                <label>Name *</label>
                <input type="text" class="dog-name" value="${dogData ? escapeHtml(dogData.name) : ''}" required>
                                    </div>
                                            </div>
        <div class="form-row">
            <div class="form-group">
                <label>Breed</label>
                <input type="text" class="dog-breed" value="${dogData ? escapeHtml(dogData.breed) : ''}">
                                    </div>
            <div class="form-group">
                <label>Age</label>
                <input type="text" class="dog-age" value="${dogData ? escapeHtml(dogData.age) : ''}" placeholder="e.g., 3 years">
                                    </div>
                    </div>
        <div class="form-row">
            <div class="form-group">
                <label>Weight</label>
                <input type="text" class="dog-weight" value="${dogData ? escapeHtml(dogData.weight) : ''}" placeholder="e.g., 45 lbs">
                </div>
            <div class="form-group">
                <label>Gender</label>
                <select class="dog-gender">
                    <option value="">Select...</option>
                    <option value="Male" ${dogData && dogData.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${dogData && dogData.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Neutered" ${dogData && dogData.gender === 'Neutered' ? 'selected' : ''}>Neutered</option>
                    <option value="Spayed" ${dogData && dogData.gender === 'Spayed' ? 'selected' : ''}>Spayed</option>
                </select>
                    </div>
                                </div>
        <div class="form-group">
            <label>Special Instructions</label>
            <textarea class="dog-notes" rows="2" placeholder="Medications, allergies, behavior notes, etc.">${dogData ? escapeHtml(dogData.notes) : ''}</textarea>
        </div>
    `;
    
    container.appendChild(dogForm);
}

function removeDogForm(button) {
    if (confirm('Remove this animal from the profile?')) {
        button.closest('.dog-form').remove();
    }
}

// Input validation and sanitization utilities
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

function validateEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    if (!phone) return false;
    // Remove common phone formatting characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it contains at least 10 digits
    return /^\d{10,}$/.test(cleaned);
}

// Save client
function saveClient() {
    const form = document.getElementById('clientForm');
    if (!form) {
        handleError('Client form not found', new Error('Form element missing'));
        return;
    }

    try {
        const formData = new FormData(form);
        const clientId = formData.get('clientId') || Date.now().toString();
        
        // Validate required fields
        const familyName = sanitizeInput(formData.get('familyName') || '');
        const contactName = sanitizeInput(formData.get('contactName') || '');
        const phone = sanitizeInput(formData.get('phone') || '');
        
        if (!familyName || !contactName) {
            alert('Please fill in required fields: Family Name and Contact Name');
            return;
        }
        
        if (!validatePhone(phone)) {
            alert('Please enter a valid phone number');
            return;
        }
        
        // Validate email if provided
        const email = sanitizeInput(formData.get('email') || '');
        if (email && !validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Collect dog data with validation
        const dogs = [];
        const dogForms = document.querySelectorAll('.dog-form');
        dogForms.forEach(form => {
            const nameInput = form.querySelector('.dog-name');
            const name = nameInput ? sanitizeInput(nameInput.value) : '';
            
            if (!name) {
                alert('Please enter a name for all animals');
                return;
            }
            
            const dogData = {
                id: form.querySelector('.dog-id')?.value || '',
                animalType: form.querySelector('.dog-type')?.value || 'Dog',
                name: name,
                breed: sanitizeInput(form.querySelector('.dog-breed')?.value || ''),
                age: sanitizeInput(form.querySelector('.dog-age')?.value || ''),
                weight: sanitizeInput(form.querySelector('.dog-weight')?.value || ''),
                gender: form.querySelector('.dog-gender')?.value || '',
                notes: sanitizeInput(form.querySelector('.dog-notes')?.value || '')
            };
            dogs.push(dogData);
        });

        const clientData = {
            id: clientId,
            familyName: familyName,
            contactName: contactName,
            email: email,
            phone: phone,
            address: sanitizeInput(formData.get('address') || ''),
            emergencyContact: sanitizeInput(formData.get('emergencyContact') || ''),
            emergencyPhone: sanitizeInput(formData.get('emergencyPhone') || ''),
            vetName: sanitizeInput(formData.get('vetName') || ''),
            vetPhone: sanitizeInput(formData.get('vetPhone') || ''),
            notes: sanitizeInput(formData.get('notes') || ''),
            dogs: dogs,
            createdAt: clientId ? (getClientById(clientId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Update or add client
        const existingIndex = clients.findIndex(c => c.id === clientId);
        if (existingIndex !== -1) {
            clients[existingIndex] = clientData;
        } else {
            clients.push(clientData);
        }

        saveClientsToStorage();
        
        // Reset form tracking after save
        if (typeof resetFormTracking === 'function') {
            resetFormTracking('clientForm');
        }
        
        // Close modal without checking for unsaved changes (since we just saved)
        const modal = document.getElementById('clientModal');
        if (modal) {
            modal.classList.remove('active');
            form.reset();
            const clientIdInput = document.getElementById('clientId');
        if (clientIdInput) clientIdInput.value = '';
        const dogsContainer = document.getElementById('dogsContainer');
        if (dogsContainer) dogsContainer.innerHTML = '';
        }
        
        filterAndRenderClients();
    } catch (error) {
        handleError('Error saving client', error);
        alert('An error occurred while saving the client. Please try again.');
    }
}

// Utility functions
function getClientById(id) {
    return clients.find(c => c.id === id);
}

function viewClientDetails(clientId) {
    const client = getClientById(clientId);
    if (!client) return;
    
    const modal = document.getElementById('clientDetailsModal');
    const content = document.getElementById('clientDetailsContent');
    const title = document.getElementById('clientDetailsTitle');
    const editBtn = document.getElementById('editFromDetailsBtn');
    
    title.textContent = client.contactName || 'Unnamed';
    
    const dogCount = client.dogs ? client.dogs.length : 0;
    
    const hasAnimals = client.dogs && client.dogs.length > 0;
    content.innerHTML = `
        <div class="client-details-view">
            <div class="details-toolbar" style="display:flex; gap:0.5rem; justify-content:flex-end; margin-bottom:0.75rem;">
                ${hasAnimals ? `<button class="btn btn-primary" onclick="startAppointmentFlow('${client.id}')">Add Appointment</button>` : ''}
            </div>
            <div class="details-section">
                <div class="section-header-with-edit">
                    <h3>Contact Information</h3>
                    <button class="btn-icon-small" onclick="editClientSection('${client.id}', 'contact')" title="Edit Contact">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                <div class="contact-info-list">
                    ${client.phone ? `
                        <div class="contact-info-item">
                            <strong>Phone:</strong> 
                            <a href="tel:${escapeHtml(client.phone)}" class="detail-link">${escapeHtml(client.phone)}</a>
                        </div>
                    ` : ''}
                        ${client.email ? `
                        <div class="contact-info-item">
                            <strong>Email:</strong> 
                            <a href="mailto:${escapeHtml(client.email)}" class="detail-link">${escapeHtml(client.email)}</a>
                            </div>
                        ` : ''}
                        ${client.address ? `
                        <div class="contact-info-item">
                            <strong>Address:</strong> 
                                <span class="detail-value">${escapeHtml(client.address)}</span>
                            </div>
                        ` : ''}
                    ${!client.phone && !client.email && !client.address ? '<p class="no-data-inline">No contact information</p>' : ''}
                    </div>
                </div>
                
            <div class="details-section">
                <div class="section-header-with-edit">
                        <h3>Emergency Contact</h3>
                    <button class="btn-icon-small" onclick="editClientSection('${client.id}', 'emergency')" title="Edit Emergency Contact">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                <div class="contact-info-list">
                        ${client.emergencyContact || client.emergencyPhone ? `
                            ${client.emergencyContact ? `
                            <div class="contact-info-item">
                                <strong>Name:</strong> 
                                    <span class="detail-value">${escapeHtml(client.emergencyContact)}</span>
                                </div>
                            ` : ''}
                            ${client.emergencyPhone ? `
                            <div class="contact-info-item">
                                <strong>Phone:</strong> 
                                <a href="tel:${escapeHtml(client.emergencyPhone)}" class="detail-link">${escapeHtml(client.emergencyPhone)}</a>
                                </div>
                            ` : ''}
                    ` : '<p class="no-data-inline">No emergency contact information</p>'}
                    </div>
                </div>
                
            <div class="details-section">
                <div class="section-header-with-edit">
                        <h3>Veterinarian</h3>
                    <button class="btn-icon-small" onclick="editClientSection('${client.id}', 'vet')" title="Edit Veterinarian">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                <div class="contact-info-list">
                        ${client.vetName || client.vetPhone ? `
                            ${client.vetName ? `
                            <div class="contact-info-item">
                                <strong>Name:</strong> 
                                    <span class="detail-value">${escapeHtml(client.vetName)}</span>
                                </div>
                            ` : ''}
                            ${client.vetPhone ? `
                            <div class="contact-info-item">
                                <strong>Phone:</strong> 
                                <a href="tel:${escapeHtml(client.vetPhone)}" class="detail-link">${escapeHtml(client.vetPhone)}</a>
                                ${client.vetName ? `<span class="detail-meta">(${escapeHtml(client.vetName)})</span>` : ''}
                                </div>
                            ` : ''}
                    ` : '<p class="no-data-inline">No veterinarian information</p>'}
                </div>
            </div>
            
            <div class="details-section">
                <div class="section-header-with-edit">
                        <h3>Notes</h3>
                    <button class="btn-icon-small" onclick="editClientSection('${client.id}', 'notes')" title="Edit Notes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                ${client.notes ? `
                    <div class="notes-content">${escapeHtml(client.notes)}</div>
                ` : '<p class="no-data-inline">No notes</p>'}
        </div>
        
            <div class="details-section">
                <div class="section-header-with-edit">
                    <h3>Animals (${dogCount})</h3>
                    <button class="btn-icon-small" onclick="editClientSection('${client.id}', 'animals')" title="Edit Animals">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            </div>
            ${dogCount > 0 ? `
                    <div class="animals-details-grid">
                    ${client.dogs.map(dog => {
                            const animalType = dog.animalType || 'Dog';
                            const animalIcon = getAnimalIcon(animalType);
                            const hasMedications = dog.medications && (
                                Array.isArray(dog.medications) ? dog.medications.length > 0 : 
                                (typeof dog.medications === 'string' ? dog.medications.trim() : false)
                            );
                        
                        return `
                                <div class="animal-detail-card">
                                    <div class="animal-detail-header">
                                        <div class="animal-detail-icon">${animalIcon}</div>
                                        <div class="animal-detail-info">
                                            <h4>${escapeHtml(dog.name || 'Unnamed')}</h4>
                                            ${dog.breed ? `<span class="animal-breed">${escapeHtml(dog.breed)}</span>` : ''}
                                    </div>
                                    </div>
                                    <div class="animal-detail-body">
                                        ${dog.age ? `<div class="animal-detail-item"><strong>Age:</strong> ${escapeHtml(dog.age)}</div>` : ''}
                                        ${dog.weight ? `<div class="animal-detail-item"><strong>Weight:</strong> ${escapeHtml(dog.weight)}</div>` : ''}
                                        ${dog.gender ? `<div class="animal-detail-item"><strong>Gender:</strong> ${escapeHtml(dog.gender)}</div>` : ''}
                                        ${dog.color ? `<div class="animal-detail-item"><strong>Color:</strong> ${escapeHtml(dog.color)}</div>` : ''}
                                        ${dog.foodRequirements ? `<div class="animal-detail-item"><strong>Food:</strong> ${escapeHtml(dog.foodRequirements)}</div>` : ''}
                                        ${hasMedications ? `
                                            <div class="animal-detail-item medication-warning">
                                                <strong>Medications:</strong> ${escapeHtml(Array.isArray(dog.medications) ? dog.medications.map(m => typeof m === 'object' ? m.name : m).join(', ') : dog.medications)}
                                    </div>
                                ` : ''}
                                        ${dog.notes ? `<div class="animal-detail-item"><strong>Notes:</strong> ${escapeHtml(dog.notes)}</div>` : ''}
                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                ` : '<p class="no-data">No animals added yet</p>'}
                                    </div>
        </div>
    `;
    
    editBtn.onclick = () => {
        closeClientDetailsModal();
        setTimeout(() => editClient(clientId), 300);
    };
    
    // Setup close button - ensure it works
    const closeBtn = document.getElementById('closeClientDetailsModal');
    if (closeBtn) {
        // Set onclick directly (works with inline onclick)
        closeBtn.onclick = () => closeClientDetailsModal();
    }
    
    // Also setup the Close button in footer
    const footerCloseBtn = modal.querySelector('.modal-footer .btn-primary');
    if (footerCloseBtn && footerCloseBtn.textContent.trim() === 'Close') {
        footerCloseBtn.onclick = () => closeClientDetailsModal();
    }
    
    modal.classList.add('active');
}

function closeClientDetailsModal() {
    const modal = document.getElementById('clientDetailsModal');
    if (modal) {
    modal.classList.remove('active');
    }
}

function editClientSection(clientId, section) {
                closeClientDetailsModal();
    setTimeout(() => {
        editClient(clientId);
        // The edit modal will open - you can add logic to focus on specific sections if needed
    }, 300);
}


function editClient(clientId) {
    const client = getClientById(clientId);
    if (client) {
        openClientModal(client);
    }
}

function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
        clients = clients.filter(c => c.id !== clientId);
        saveClientsToStorage();
        filterAndRenderClients();
    }
}

// Pagination functions
function changePage(page) {
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderClients();
    
    // Scroll to top of clients list
    const clientsList = document.getElementById('clientsList');
    if (clientsList) {
        clientsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Sorting functions
function sortClients(field) {
    if (sortBy === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
        sortBy = field;
        sortOrder = 'asc';
    }
    filterAndRenderClients();
}

// View mode functions
function switchViewMode(mode) {
    localStorage.setItem('clientsViewMode', mode);
    renderClients();
    
    // Update button states
    const cardBtn = document.getElementById('cardViewBtn');
    const tableBtn = document.getElementById('columnViewBtn');
    
    if (cardBtn) cardBtn.classList.toggle('active', mode === 'card');
    if (tableBtn) tableBtn.classList.toggle('active', mode === 'table');
}

// Search functions
function clearSearch() {
    const searchInput = document.getElementById('clientSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchTerm = '';
        currentPage = 1;
        filterAndRenderClients();
    }
}

// Utility function
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

// Alias for compatibility with admin.js
function loadClients() {
    try {
        // Initialize the page if not already done
        if (!Array.isArray(clients) || clients.length === 0) {
            loadClientsFromStorage();
        }
        filterAndRenderClients();
    } catch (error) {
        handleError('Error loading clients', error);
    }
}

// Make functions globally available
window.openClientModal = openClientModal;
window.closeClientModal = closeClientModal;
window.addDogForm = addDogForm;
window.removeDogForm = removeDogForm;
window.saveClient = saveClient;
window.viewClientDetails = viewClientDetails;
window.closeClientDetailsModal = closeClientDetailsModal;
window.editClientSection = editClientSection;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.changePage = changePage;
window.sortClients = sortClients;
window.switchViewMode = switchViewMode;
window.clearSearch = clearSearch;
window.loadClients = loadClients;
window.setupTabs = setupTabs;

// Multi-step appointment flow using existing quickAccessModal
function startAppointmentFlow(initialClientId = null) {
    const modal = document.getElementById('quickAccessModal');
    const titleEl = document.getElementById('quickAccessTitle');
    const contentEl = document.getElementById('quickAccessContent');
    if (!modal || !titleEl || !contentEl) {
        // fallback: open classic modal
        if (initialClientId) {
            const c = getClientById(initialClientId);
            if (c && c.dogs && c.dogs[0] && typeof openAppointmentModal === 'function') {
                openAppointmentModal(null, c.id, c.dogs[0].id, c.dogs[0].name);
            }
        }
        return;
    }

    function renderClientSelect() {
        titleEl.textContent = 'Select Client';
        const sortItems = (items) => [...items].sort((a,b) => {
            const an = (a.contactName || a.familyName || '').toLowerCase();
            const bn = (b.contactName || b.familyName || '').toLowerCase();
            return an.localeCompare(bn);
        });
        const buildRows = (items) => sortItems(items).map(c => {
            const animals = (c.dogs || []).map(d => {
                const icon = getAnimalIcon(d.animalType || 'Dog');
                return `${icon} ${escapeHtml(d.name||'Unnamed')}`;
            }).join(', ');
            return `
                <tr class="select-row" data-client-id="${c.id}" style="cursor:pointer;">
                    <td style="padding:0.5rem 0.75rem;">${escapeHtml(c.contactName || c.familyName || 'Unnamed')}</td>
                    <td style="padding:0.5rem 0.75rem;">${escapeHtml(c.phone || '')}</td>
                    <td style="padding:0.5rem 0.75rem; color:#555;">${escapeHtml(animals || '—')}</td>
                </tr>
            `;
        }).join('');
        const buildTable = (items) => `
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid #ddd;">
                        <th style="padding:0.5rem 0.75rem;">Client</th>
                        <th style="padding:0.5rem 0.75rem;">Phone</th>
                        <th style="padding:0.5rem 0.75rem;">Animals</th>
                    </tr>
                </thead>
                <tbody>
                    ${buildRows(items)}
                </tbody>
            </table>
        `;
        contentEl.innerHTML = `
            <div style="margin-bottom:0.5rem;">
                <input id="apptClientSearch" type="text" placeholder="Search clients by name or phone..." style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid #ccc;" />
            </div>
            <div id="apptClientList" style="max-height:60vh; overflow:auto;">${clients.length ? buildTable(sortItems(clients)) : '<p>No clients available.</p>'}</div>
        `;
        const listEl = document.getElementById('apptClientList');
        const attachClicks = () => listEl.querySelectorAll('tr.select-row').forEach(row => {
            row.addEventListener('click', () => renderDogSelect(row.getAttribute('data-client-id')));
        });
        attachClicks();
        const input = document.getElementById('apptClientSearch');
        if (input) {
            input.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = clients.filter(c => {
                    const n = (c.contactName || c.familyName || '').toLowerCase();
                    const p = (c.phone || '').toLowerCase();
                    return n.includes(q) || p.includes(q);
                });
                listEl.innerHTML = filtered.length ? buildTable(sortItems(filtered)) : '<p>No results</p>';
                attachClicks();
            });
            setTimeout(() => input.focus(), 50);
        }
        modal.classList.add('active');
    }

    function renderDogSelect(clientId) {
        const c = getClientById(clientId);
        if (!c) return;
        if (!c.dogs || c.dogs.length === 0) {
            alert('This client has no animals yet.');
            return;
        }
        titleEl.textContent = 'Select Animal';
        const list = c.dogs.map(d => `
            <button class="btn" data-dog-id="${d.id}" style="width:100%; text-align:left; margin:0.25rem 0;">
                ${getAnimalIcon(d.animalType || 'Dog')} ${escapeHtml(d.name || 'Unnamed')}
            </button>
        `).join('');
        contentEl.innerHTML = `<div style="max-height:60vh; overflow:auto;">${list}</div>`;
        contentEl.querySelectorAll('button[data-dog-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeQuickAccessModal();
                setTimeout(() => {
                    if (typeof openAppointmentModal === 'function') {
                        openAppointmentModal(null, c.id, btn.getAttribute('data-dog-id'), (c.dogs.find(x=>x.id===btn.getAttribute('data-dog-id'))||{}).name || '');
                    }
                }, 150);
            });
        });
        modal.classList.add('active');
    }

    if (initialClientId) {
        renderDogSelect(initialClientId);
    } else {
        renderClientSelect();
    }
}
window.startAppointmentFlow = startAppointmentFlow;