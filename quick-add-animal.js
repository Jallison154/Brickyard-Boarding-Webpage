// Quick Add Animal - Streamlined client and animal creation

let currentQuickAddStep = 1;
let animalsList = []; // Array to store multiple animals

// Open quick add animal modal
function openQuickAddAnimal() {
    const modal = document.getElementById('quickAddAnimalModal');
    if (!modal) return;
    
    // Reset form and animals list
    currentQuickAddStep = 1;
    animalsList = [];
    document.getElementById('quickAddAnimalForm').reset();
    showQuickAddStep(1);
    updateAnimalsListDisplay();
    
    // Load breeds datalist
    loadBreedsDatalist();
    
    // Setup form tracking
    resetFormTracking('quickAddAnimalForm');
    setupModalWithTracking('quickAddAnimalModal', 'quickAddAnimalForm', closeQuickAddAnimalModal);
    
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('quickClientName')?.focus();
    }, 100);
}

// Close quick add animal modal
async function closeQuickAddAnimalModal() {
    const modal = document.getElementById('quickAddAnimalModal');
    if (!modal) return;
    
    // Check for unsaved changes
    if (typeof hasUnsavedChanges === 'function' && hasUnsavedChanges('quickAddAnimalForm')) {
        const choice = await showUnsavedChangesModal('quickAddAnimalForm', () => {
            // If user wants to save, submit the form
            const form = document.getElementById('quickAddAnimalForm');
            if (form) {
                if (currentQuickAddStep === 3) {
                    form.requestSubmit();
                } else {
                    // Advance to review step
                    currentQuickAddStep = 3;
                    showQuickAddStep(3);
                }
                return new Promise(resolve => setTimeout(resolve, 100));
            }
        });
        
        if (choice === 'cancel') {
            return; // Stay open
        }
        
        if (choice === 'dontsave') {
            // Reset tracking if discarding
            resetFormTracking('quickAddAnimalForm');
        }
    }
    
    modal.style.display = 'none';
    currentQuickAddStep = 1;
    const form = document.getElementById('quickAddAnimalForm');
    if (form) {
        form.reset();
    }
    resetFormTracking('quickAddAnimalForm');
}

// Show specific step
function showQuickAddStep(step) {
    currentQuickAddStep = step;
    
    // Hide all steps
    document.querySelectorAll('.quick-add-step').forEach(s => {
        s.style.display = 'none';
    });
    
    // Show current step
    const currentStepEl = document.getElementById(`step${step}-content`);
    if (currentStepEl) {
        currentStepEl.style.display = 'block';
    }
    
    // Update step indicators
    document.querySelectorAll('.quick-add-steps .step').forEach((s, index) => {
        if (index + 1 === step) {
            s.classList.add('active');
        } else if (index + 1 < step) {
            s.classList.add('completed');
            s.classList.remove('active');
        } else {
            s.classList.remove('active', 'completed');
        }
    });
    
    // Update buttons
    const prevBtn = document.getElementById('quickAddPrevBtn');
    const nextBtn = document.getElementById('quickAddNextBtn');
    const submitBtn = document.getElementById('quickAddSubmitBtn');
    
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < 3 ? 'block' : 'none';
    if (submitBtn) submitBtn.style.display = step === 3 ? 'block' : 'none';
    
    // Show review content if on step 3
    if (step === 3) {
        generateReviewContent();
    }
}

// Advance to next step
function quickAddNextStep() {
    // Validate current step
    const form = document.getElementById('quickAddAnimalForm');
    if (!form) return;
    
    if (currentQuickAddStep === 1) {
        // Validate client info
        const name = document.getElementById('quickClientName').value.trim();
        const phone = document.getElementById('quickClientPhone').value.trim();
        
        if (!name || !phone) {
            alert('Please fill in required fields: Contact Name and Phone');
            return;
        }
        
        showQuickAddStep(2);
        setTimeout(() => {
            document.getElementById('quickAnimalName')?.focus();
        }, 100);
        
    } else if (currentQuickAddStep === 2) {
        // Validate that at least one animal is added
        if (animalsList.length === 0) {
            alert('Please add at least one animal before continuing');
            return;
        }
        
        showQuickAddStep(3);
    }
}

// Go back to previous step
function quickAddPrevStep() {
    if (currentQuickAddStep > 1) {
        showQuickAddStep(currentQuickAddStep - 1);
    }
}

// Add animal to list
function addAnimalToList() {
    const animalName = document.getElementById('quickAnimalName').value.trim();
    const animalType = document.getElementById('quickAnimalType').value;
    const animalBreed = document.getElementById('quickAnimalBreed').value.trim();
    const animalAge = document.getElementById('quickAnimalAge').value;
    const animalWeight = document.getElementById('quickAnimalWeight').value;
    const animalFood = document.getElementById('quickAnimalFood').value.trim();
    const animalNotes = document.getElementById('quickAnimalNotes').value.trim();
    
    // Validate required fields
    if (!animalName || !animalType) {
        alert('Please fill in Animal Name and Animal Type');
        return;
    }
    
    // Add to list
    const animal = {
        id: 'temp_' + Date.now() + '_' + Math.random(),
        name: animalName,
        animalType: animalType,
        breed: animalBreed,
        age: animalAge,
        weight: animalWeight,
        foodRequirements: animalFood,
        notes: animalNotes
    };
    
    animalsList.push(animal);
    
    // Clear form
    document.getElementById('quickAnimalName').value = '';
    document.getElementById('quickAnimalType').value = '';
    document.getElementById('quickAnimalBreed').value = '';
    document.getElementById('quickAnimalAge').value = '';
    document.getElementById('quickAnimalWeight').value = '';
    document.getElementById('quickAnimalFood').value = '';
    document.getElementById('quickAnimalNotes').value = '';
    
    // Update display
    updateAnimalsListDisplay();
    
    // Focus back on name field
    setTimeout(() => {
        document.getElementById('quickAnimalName').focus();
    }, 100);
}

// Remove animal from list
function removeAnimalFromList(animalId) {
    animalsList = animalsList.filter(a => a.id !== animalId);
    updateAnimalsListDisplay();
}

// Update animals list display
function updateAnimalsListDisplay() {
    const listContainer = document.getElementById('quickAnimalsList');
    const badge = document.getElementById('animalCountBadge');
    
    if (badge) {
        badge.textContent = `${animalsList.length} animal${animalsList.length !== 1 ? 's' : ''}`;
    }
    
    if (!listContainer) return;
    
    if (animalsList.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 1rem;">No animals added yet. Fill in the form below to add one.</p>';
        return;
    }
    
    listContainer.innerHTML = animalsList.map(animal => `
        <div class="animal-list-item">
            <div class="animal-item-content">
                <strong>${animal.animalType === 'Cat' ? '🐱' : '🐕'} ${escapeHtml(animal.name)}</strong>
                ${animal.breed ? `<span class="animal-item-badge">${escapeHtml(animal.breed)}</span>` : ''}
                ${animal.age ? `<span class="animal-item-badge">${escapeHtml(animal.age)} years</span>` : ''}
                ${animal.weight ? `<span class="animal-item-badge">${escapeHtml(animal.weight)} lbs</span>` : ''}
            </div>
            <button type="button" class="btn-icon btn-danger" onclick="removeAnimalFromList('${animal.id}')" title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');
}

// Generate review content
function generateReviewContent() {
    const content = document.getElementById('quickAddReviewContent');
    if (!content) return;
    
    const clientName = document.getElementById('quickClientName').value.trim();
    const clientPhone = document.getElementById('quickClientPhone').value.trim();
    const clientEmail = document.getElementById('quickClientEmail').value.trim();
    const emergencyPhone = document.getElementById('quickEmergencyPhone').value.trim();
    
    content.innerHTML = `
        <div class="quick-add-review">
            <div class="review-section">
                <h4>👤 Client Information</h4>
                <div class="review-item"><strong>Name:</strong> ${escapeHtml(clientName)}</div>
                <div class="review-item"><strong>Phone:</strong> ${escapeHtml(clientPhone)}</div>
                ${clientEmail ? `<div class="review-item"><strong>Email:</strong> ${escapeHtml(clientEmail)}</div>` : ''}
                ${emergencyPhone ? `<div class="review-item"><strong>Emergency Phone:</strong> ${escapeHtml(emergencyPhone)}</div>` : ''}
            </div>
            
            <div class="review-section">
                <h4>Animals (${animalsList.length})</h4>
                ${animalsList.map(animal => `
                    <div class="review-animal-item">
                        <strong>${animal.animalType === 'Cat' ? '🐱' : '🐕'} ${escapeHtml(animal.name)}</strong>
                        <div style="margin-left: 1.5rem; margin-top: 0.5rem;">
                            ${animal.breed ? `<div class="review-item"><strong>Breed:</strong> ${escapeHtml(animal.breed)}</div>` : ''}
                            ${animal.age ? `<div class="review-item"><strong>Age:</strong> ${escapeHtml(animal.age)} years</div>` : ''}
                            ${animal.weight ? `<div class="review-item"><strong>Weight:</strong> ${escapeHtml(animal.weight)} lbs</div>` : ''}
                            ${animal.foodRequirements ? `<div class="review-item"><strong>Food:</strong> ${escapeHtml(animal.foodRequirements)}</div>` : ''}
                            ${animal.notes ? `<div class="review-item"><strong>Notes:</strong> ${escapeHtml(animal.notes)}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Handle form submission
function saveQuickAddClient() {
    // Validate animals list
    if (animalsList.length === 0) {
        alert('Please add at least one animal');
        return false;
    }

    // Get all form values
    const clientName = document.getElementById('quickClientName').value.trim();
    const clientPhone = document.getElementById('quickClientPhone').value.trim();
    const clientEmail = document.getElementById('quickClientEmail').value.trim();
    const emergencyPhone = document.getElementById('quickEmergencyPhone').value.trim();

    // Create client object with all animals
    const clientId = 'client_' + Date.now();

    // Extract last name from client name
    const nameParts = clientName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    const dogs = animalsList.map(animal => ({
        id: 'dog_' + Date.now() + '_' + Math.random(),
        name: animal.name,
        lastName: lastName,
        animalType: animal.animalType,
        breed: animal.breed,
        age: animal.age,
        weight: animal.weight,
        foodRequirements: animal.foodRequirements,
        notes: animal.notes,
        gender: '',
        color: '',
        vaccinations: '',
        medications: [],
        documents: []
    }));

    const client = {
        id: clientId,
        familyName: lastName,
        contactName: clientName,
        phone: clientPhone,
        email: clientEmail,
        emergencyPhone: emergencyPhone,
        dogs: dogs,
        notes: ''
    };

    try {
        const clients = getClients();
        clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit exceeded. Please contact support.');
        } else {
            alert('Error saving client. Please try again.');
        }
        return false;
    }

    resetFormTracking('quickAddAnimalForm');

    // Switch to Clients tab and refresh list
    const clientsTabBtn = document.querySelector('.tab-btn[data-tab="clients"]');
    if (clientsTabBtn) clientsTabBtn.click();
    if (typeof loadClients === 'function') {
        loadClients();
    }

    // Close modal
    closeQuickAddAnimalModal();

    // After a short delay (to allow render), open the new client's details
    setTimeout(() => {
        if (typeof viewClientDetails === 'function') {
            viewClientDetails(clientId);
        }
    }, 150);

    // Optional toast/alert
    alert(`✓ Added ${clientName} with ${animalsList.length} animal${animalsList.length !== 1 ? 's' : ''} to Clients.`);
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quickAddAnimalForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveQuickAddClient();
        });
    }
    const submitBtn = document.getElementById('quickAddSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveQuickAddClient();
        });
    }
});

// Load breeds datalist
function loadBreedsDatalist() {
    const datalist = document.getElementById('breedsList');
    if (!datalist) return;
    
    try {
        const breedsStr = localStorage.getItem('breedsDB');
        if (breedsStr) {
            const breeds = JSON.parse(breedsStr);
            datalist.innerHTML = breeds.map(breed => 
                `<option value="${escapeHtml(breed.name)}">`
            ).join('');
        }
    } catch (e) {
        // Silently fail - breeds datalist is optional
    }
}

// Helper functions
function getClients() {
    const clients = localStorage.getItem('clients');
    return clients ? JSON.parse(clients) : [];
}

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

// Make functions globally available
window.openQuickAddAnimal = openQuickAddAnimal;
window.closeQuickAddAnimalModal = closeQuickAddAnimalModal;
window.quickAddNextStep = quickAddNextStep;
window.quickAddPrevStep = quickAddPrevStep;
window.addAnimalToList = addAnimalToList;
window.removeAnimalFromList = removeAnimalFromList;

