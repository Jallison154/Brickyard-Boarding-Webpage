// Database Management for Medications, Breeds, Food, etc.

// Initialize databases with default data
function initializeDatabases() {
    // Medications Database
    if (!localStorage.getItem('medicationsDB')) {
        const defaultMeds = [
            { id: '1', name: 'Apoquel', dosage: ['5.4mg', '16mg'], frequency: ['Once daily', 'Twice daily'] },
            { id: '2', name: 'Cytopoint', dosage: ['10-14.9 lbs', '15-29.9 lbs', '30-59.9 lbs', '60+ lbs'], frequency: ['Monthly injection'] },
            { id: '3', name: 'Simparica', dosage: ['2.5-5 lbs', '5.1-10 lbs', '10.1-20 lbs', '20.1-40 lbs', '40.1-88 lbs'], frequency: ['Monthly'] },
            { id: '4', name: 'Prozac', dosage: ['10mg', '20mg', '40mg'], frequency: ['Once daily', 'Twice daily'] },
            { id: '5', name: 'Tramadol', dosage: ['50mg', '100mg'], frequency: ['Every 8 hours', 'Every 12 hours', 'As needed'] },
            { id: '6', name: 'Rimadyl', dosage: ['25mg', '75mg', '100mg'], frequency: ['Once daily', 'Twice daily'] },
            { id: '7', name: 'Metronidazole', dosage: ['250mg', '500mg'], frequency: ['Twice daily', 'Three times daily'] },
            { id: '8', name: 'Prednisone', dosage: ['5mg', '10mg', '20mg'], frequency: ['Once daily', 'Twice daily', 'Tapering schedule'] },
            { id: '9', name: 'Cephalexin', dosage: ['250mg', '500mg'], frequency: ['Twice daily', 'Three times daily'] },
            { id: '10', name: 'Heartgard Plus', dosage: ['Up to 25 lbs', '26-50 lbs', '51-100 lbs', 'Over 100 lbs'], frequency: ['Monthly'] },
            { id: '11', name: 'NexGard', dosage: ['4-10 lbs', '10.1-24 lbs', '24.1-60 lbs', '60.1-121 lbs'], frequency: ['Monthly'] },
            { id: '12', name: 'Frontline Plus', dosage: ['5-22 lbs', '23-44 lbs', '45-88 lbs', '89-132 lbs'], frequency: ['Monthly'] }
        ];
        localStorage.setItem('medicationsDB', JSON.stringify(defaultMeds));
    }

    // Dog Breeds Database
    if (!localStorage.getItem('breedsDB')) {
        const defaultBreeds = [
            'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'French Bulldog',
            'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
            'Siberian Husky', 'Great Dane', 'Boxer', 'Shih Tzu', 'Doberman Pinscher',
            'Border Collie', 'Australian Shepherd', 'Cavalier King Charles Spaniel',
            'Maltese', 'Pomeranian', 'Pug', 'Boston Terrier', 'Shetland Sheepdog',
            'Cocker Spaniel', 'Miniature Schnauzer', 'Chihuahua', 'Bichon Frise',
            'Havanese', 'Mastiff', 'Basset Hound', 'Australian Cattle Dog', 'Mixed Breed'
        ];
        localStorage.setItem('breedsDB', JSON.stringify(defaultBreeds));
    }

    // Food Brands Database
    if (!localStorage.getItem('foodBrandsDB')) {
        const defaultFoods = [
            'Purina Pro Plan', 'Royal Canin', 'Hill\'s Science Diet', 'Blue Buffalo',
            'Wellness', 'Taste of the Wild', 'Orijen', 'Acana', 'Merrick',
            'Nutro', 'Iams', 'Eukanuba', 'Pedigree', 'Kibbles \'n Bits',
            'Cesar', 'Freshpet', 'Stella & Chewy\'s', 'Fromm', 'Canidae',
            'Diamond Naturals', 'Victor', 'Farmina', 'Earthborn Holistic',
            'Zignature', 'Tiki Dog', 'Weruva', 'Open Farm', 'JustFoodForDogs',
            'The Honest Kitchen', 'Ollie', 'Home-cooked', 'Raw diet', 'Prescription diet'
        ];
        localStorage.setItem('foodBrandsDB', JSON.stringify(defaultFoods));
    }
}

// Get databases
function getMedicationsDB() {
    return JSON.parse(localStorage.getItem('medicationsDB') || '[]');
}

function getBreedsDB() {
    return JSON.parse(localStorage.getItem('breedsDB') || '[]');
}

function getFoodBrandsDB() {
    return JSON.parse(localStorage.getItem('foodBrandsDB') || '[]');
}

// Add to databases
function addMedication(medData) {
    const meds = getMedicationsDB();
    medData.id = Date.now().toString();
    meds.push(medData);
    localStorage.setItem('medicationsDB', JSON.stringify(meds));
    return medData.id;
}

function addBreed(breedName) {
    const breeds = getBreedsDB();
    if (!breeds.includes(breedName)) {
        breeds.push(breedName);
        breeds.sort();
        localStorage.setItem('breedsDB', JSON.stringify(breeds));
    }
}

function addFoodBrand(brandName) {
    const foods = getFoodBrandsDB();
    if (!foods.includes(brandName)) {
        foods.push(brandName);
        foods.sort();
        localStorage.setItem('foodBrandsDB', JSON.stringify(foods));
    }
}

// Remove from databases
function removeMedication(medId) {
    const meds = getMedicationsDB();
    const filtered = meds.filter(m => m.id !== medId);
    localStorage.setItem('medicationsDB', JSON.stringify(filtered));
}

function removeBreed(breedName) {
    const breeds = getBreedsDB();
    const filtered = breeds.filter(b => b !== breedName);
    localStorage.setItem('breedsDB', JSON.stringify(filtered));
}

function removeFoodBrand(brandName) {
    const foods = getFoodBrandsDB();
    const filtered = foods.filter(f => f !== brandName);
    localStorage.setItem('foodBrandsDB', JSON.stringify(filtered));
}

// Render medication multi-select with search
function renderMedicationSelector(containerId, selectedMeds = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const meds = getMedicationsDB();
    const selectedIds = Array.isArray(selectedMeds) ? selectedMeds.map(m => {
        if (typeof m === 'string') return m;
        return m.id || m.name;
    }) : [];
    
    // Find medications that are selected but not in the database
    const customMeds = Array.isArray(selectedMeds) ? selectedMeds.filter(m => {
        const medId = typeof m === 'string' ? m : (m.id || m.name);
        return !meds.find(dbMed => (dbMed.id || dbMed.name) === medId);
    }) : [];
    
    container.innerHTML = `
        <div class="medication-selector">
            <div class="selector-header">
                <input type="text" class="med-search-input" placeholder="Search medications..." oninput="filterMedications(this)">
                <button type="button" class="btn-add-custom" onclick="showAddMedicationModal()">+ Add Custom</button>
            </div>
            <div class="medication-list" id="${containerId}_list">
                ${meds.map(med => {
                    const medIdentifier = med.id || med.name;
                    const isSelected = selectedIds.includes(medIdentifier);
                    const selectedMed = Array.isArray(selectedMeds) ? selectedMeds.find(m => {
                        const mId = typeof m === 'string' ? m : (m.id || m.name);
                        return mId === medIdentifier;
                    }) : null;
                    
                    return `
                        <div class="medication-item ${isSelected ? 'selected' : ''}" data-med-id="${med.id || med.name}">
                            <label class="med-checkbox-label">
                                <input type="checkbox" class="med-checkbox" value="${med.id || med.name}" ${isSelected ? 'checked' : ''} 
                                    onchange="toggleMedication(this, '${containerId}')">
                                <div class="med-info">
                                    <span class="med-name">${escapeHtml(med.name)}</span>
                                    ${med.dosage && med.dosage.length > 0 ? `<span class="med-dosage">Dosage: ${escapeHtml(med.dosage.join(', '))}</span>` : ''}
                                    ${med.frequency && med.frequency.length > 0 ? `<span class="med-frequency">Frequency: ${escapeHtml(med.frequency.join(', '))}</span>` : ''}
                                </div>
                            </label>
                            <div class="med-details-input" style="display: ${isSelected ? 'flex' : 'none'};">
                                <input type="text" class="med-dosage-input" placeholder="Dosage (e.g., 10mg)" 
                                    data-med-id="${med.id || med.name}" value="${selectedMed?.dosage || ''}">
                                <input type="text" class="med-frequency-input" placeholder="Frequency (e.g., twice daily)" 
                                    data-med-id="${med.id || med.name}" value="${selectedMed?.frequency || ''}">
                            </div>
                        </div>
                    `;
                }).join('')}
                ${customMeds.map(med => {
                    const medName = typeof med === 'string' ? med : (med.name || 'Unknown');
                    const medId = typeof med === 'string' ? med : (med.id || med.name);
                    const dosage = typeof med === 'string' ? '' : (med.dosage || '');
                    const frequency = typeof med === 'string' ? '' : (med.frequency || '');
                    
                    return `
                        <div class="medication-item custom-med selected" data-med-id="${medId}">
                            <label class="med-checkbox-label">
                                <input type="checkbox" class="med-checkbox" value="${medId}" checked 
                                    onchange="toggleMedication(this, '${containerId}')">
                                <div class="med-info">
                                    <span class="med-name">${escapeHtml(medName)} <span style="font-size:0.75rem; color:var(--text-light);">(Custom)</span></span>
                                </div>
                            </label>
                            <div class="med-details-input" style="display: flex;">
                                <input type="text" class="med-dosage-input" placeholder="Dosage (e.g., 10mg)" 
                                    data-med-id="${medId}" value="${dosage}">
                                <input type="text" class="med-frequency-input" placeholder="Frequency (e.g., twice daily)" 
                                    data-med-id="${medId}" value="${frequency}">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="selected-medications" id="${containerId}_selected">
                ${renderSelectedMeds(selectedMeds)}
            </div>
        </div>
    `;
    
    // Setup input listeners after rendering
    setTimeout(() => setupMedicationInputListeners(containerId), 100);
}

function filterMedications(input) {
    const searchTerm = input.value.toLowerCase();
    const items = input.closest('.medication-selector').querySelectorAll('.medication-item');
    
    items.forEach(item => {
        const medName = item.querySelector('.med-name').textContent.toLowerCase();
        item.style.display = medName.includes(searchTerm) ? 'block' : 'none';
    });
}

function toggleMedication(checkbox, containerId) {
    const medId = checkbox.value;
    const medItem = checkbox.closest('.medication-item');
    const detailsInput = medItem.querySelector('.med-details-input');
    
    if (checkbox.checked) {
        medItem.classList.add('selected');
        detailsInput.style.display = 'flex';
    } else {
        medItem.classList.remove('selected');
        detailsInput.style.display = 'none';
    }
    
    updateSelectedMedsDisplay(containerId);
}

// Add event listeners to dosage/frequency inputs
function setupMedicationInputListeners(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const dosageInputs = container.querySelectorAll('.med-dosage-input');
    const frequencyInputs = container.querySelectorAll('.med-frequency-input');
    
    const updateHandler = () => updateSelectedMedsDisplay(containerId);
    
    dosageInputs.forEach(input => {
        input.removeEventListener('input', updateHandler);
        input.addEventListener('input', updateHandler);
    });
    
    frequencyInputs.forEach(input => {
        input.removeEventListener('input', updateHandler);
        input.addEventListener('input', updateHandler);
    });
}

function updateSelectedMedsDisplay(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.med-checkbox:checked');
    const selectedMeds = Array.from(checkboxes).map(cb => {
        const medId = cb.value;
        const medItem = cb.closest('.medication-item');
        if (!medItem) return null;
        
        const medName = medItem.querySelector('.med-name')?.textContent || medId;
        const dosageInput = medItem.querySelector('.med-dosage-input');
        const frequencyInput = medItem.querySelector('.med-frequency-input');
        const dosage = dosageInput ? dosageInput.value : '';
        const frequency = frequencyInput ? frequencyInput.value : '';
        
        return {
            id: medId,
            name: medName,
            dosage: dosage,
            frequency: frequency
        };
    }).filter(med => med !== null);
    
    const selectedContainer = document.getElementById(`${containerId}_selected`);
    if (selectedContainer) {
        selectedContainer.innerHTML = renderSelectedMeds(selectedMeds);
    }
    
    return selectedMeds;
}

function getSelectedMedications(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.med-checkbox:checked');
    return Array.from(checkboxes).map(cb => {
        const medId = cb.value;
        const medItem = cb.closest('.medication-item');
        const medName = medItem.querySelector('.med-name').textContent;
        const dosage = medItem.querySelector('.med-dosage-input').value;
        const frequency = medItem.querySelector('.med-frequency-input').value;
        
        return {
            id: medId,
            name: medName,
            dosage: dosage,
            frequency: frequency
        };
    });
}

function renderSelectedMeds(selectedMeds) {
    if (!selectedMeds || selectedMeds.length === 0) {
        return '<p class="no-selections">No medications selected</p>';
    }
    
    return `
        <h4>Selected (${selectedMeds.length}):</h4>
        <div class="selected-meds-list">
            ${selectedMeds.map(med => {
                const medName = typeof med === 'string' ? med : (med.name || 'Unknown');
                const dosage = med.dosage || '';
                const frequency = med.frequency || '';
                const displayText = dosage || frequency ? 
                    `${medName}${dosage ? `, ${dosage}` : ''}${frequency ? ` - ${frequency}` : ''}` :
                    medName;
                return `<span class="med-tag-selected">${escapeHtml(displayText)}</span>`;
            }).join('')}
        </div>
    `;
}

function getMedDosage(selectedMeds, medId) {
    const med = Array.isArray(selectedMeds) ? selectedMeds.find(m => (m.id || m) === medId) : null;
    return med && med.dosage ? med.dosage : '';
}

function getMedFrequency(selectedMeds, medId) {
    const med = Array.isArray(selectedMeds) ? selectedMeds.find(m => (m.id || m) === medId) : null;
    return med && med.frequency ? med.frequency : '';
}

// Render breed dropdown with search
function renderBreedSelector(selectId, selectedBreed = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const breeds = getBreedsDB();
    
    select.innerHTML = `
        <option value="">Select breed...</option>
        ${breeds.map(breed => 
            `<option value="${escapeHtml(breed)}" ${selectedBreed === breed ? 'selected' : ''}>${escapeHtml(breed)}</option>`
        ).join('')}
        <option value="__custom__">+ Add custom breed</option>
    `;
    
    select.onchange = function() {
        if (this.value === '__custom__') {
            const customBreed = prompt('Enter breed name:');
            if (customBreed) {
                addBreed(customBreed);
                renderBreedSelector(selectId, customBreed);
            } else {
                this.value = '';
            }
        }
    };
}

// Render food brand dropdown with search
function renderFoodBrandSelector(selectId, selectedBrand = '') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const brands = getFoodBrandsDB();
    
    select.innerHTML = `
        <option value="">Select food brand...</option>
        ${brands.map(brand => 
            `<option value="${escapeHtml(brand)}" ${selectedBrand === brand ? 'selected' : ''}>${escapeHtml(brand)}</option>`
        ).join('')}
        <option value="__custom__">+ Add custom brand</option>
    `;
    
    select.onchange = function() {
        if (this.value === '__custom__') {
            const customBrand = prompt('Enter food brand name:');
            if (customBrand) {
                addFoodBrand(customBrand);
                renderFoodBrandSelector(selectId, customBrand);
            } else {
                this.value = '';
            }
        }
    };
}

// Format medications for display
function formatMedicationsDisplay(medications) {
    if (!medications) return '';
    
    // Handle old string format
    if (typeof medications === 'string') {
        return medications;
    }
    
    // Handle array format
    if (Array.isArray(medications)) {
        return medications.map(med => {
            if (typeof med === 'string') return med;
            const display = med.name || med;
            const details = [];
            if (med.dosage) details.push(med.dosage);
            if (med.frequency) details.push(med.frequency);
            return details.length > 0 ? `${display} (${details.join(', ')})` : display;
        }).join(', ');
    }
    
    return '';
}

// Escape HTML
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeDatabases();
});

// Make functions globally available
window.filterMedications = filterMedications;
window.toggleMedication = toggleMedication;
window.updateSelectedMedsDisplay = updateSelectedMedsDisplay;
window.getSelectedMedications = getSelectedMedications;
window.renderMedicationSelector = renderMedicationSelector;
window.renderBreedSelector = renderBreedSelector;
window.renderFoodBrandSelector = renderFoodBrandSelector;
window.formatMedicationsDisplay = formatMedicationsDisplay;
window.getMedicationsDB = getMedicationsDB;
window.addMedication = addMedication;

