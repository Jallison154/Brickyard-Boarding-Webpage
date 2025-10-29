// Modal Utilities - Handle unsaved changes and click-away behavior

// Track form changes
let formChangeTrackers = {};

// Check if a form has unsaved changes
function hasUnsavedChanges(formId) {
    const tracker = formChangeTrackers[formId];
    if (!tracker) return false;
    
    const form = document.getElementById(formId);
    if (!form) return false;
    
    // Check if form has been modified
    return tracker.hasChanges && tracker.originalState !== getFormState(form);
}

// Get form state as a string for comparison
function getFormState(form) {
    if (!form) return '';
    
    const formData = new FormData(form);
    const state = {};
    
    for (let [key, value] of formData.entries()) {
        state[key] = value;
    }
    
    // Also check checkboxes, radio buttons, and textareas not in FormData
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            state[input.id || input.name] = input.checked;
        } else if (input.type === 'file') {
            // Skip file inputs for state comparison
        } else {
            state[input.id || input.name] = input.value;
        }
    });
    
    return JSON.stringify(state);
}

// Initialize form change tracking
function trackFormChanges(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Store original state
    formChangeTrackers[formId] = {
        hasChanges: false,
        originalState: getFormState(form)
    };
    
    // Track changes on all inputs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (formChangeTrackers[formId]) {
                formChangeTrackers[formId].hasChanges = true;
            }
        });
        
        input.addEventListener('change', () => {
            if (formChangeTrackers[formId]) {
                formChangeTrackers[formId].hasChanges = true;
            }
        });
    });
}

// Reset form tracking (call after save)
function resetFormTracking(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    if (formChangeTrackers[formId]) {
        formChangeTrackers[formId].hasChanges = false;
        formChangeTrackers[formId].originalState = getFormState(form);
    }
}

// Confirm close with unsaved changes
async function confirmCloseWithChanges(formId, callback) {
    if (hasUnsavedChanges(formId)) {
        const confirmed = await showConfirm('Unsaved Changes', 'You have unsaved changes. Are you sure you want to close without saving?');
        if (confirmed) {
            // Reset tracking before closing
            delete formChangeTrackers[formId];
            if (callback) callback();
        }
        return false; // Prevent close
    } else {
        if (callback) callback();
        return true; // Allow close
    }
}

// Setup modal with change tracking and backdrop click
function setupModalWithTracking(modalId, formId, closeCallback) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Track form changes
    if (formId) {
        trackFormChanges(formId);
        
        // Reset tracking when form is submitted
        const form = document.getElementById(formId);
        if (form) {
            const submitHandler = () => {
                resetFormTracking(formId);
            };
            form.addEventListener('submit', submitHandler);
        }
    }
    
    // Handle backdrop click (remove existing listener if any)
    const backdropHandler = async (e) => {
        if (e.target === modal) {
            if (formId && hasUnsavedChanges(formId)) {
                const choice = await showUnsavedChangesModal(formId, () => {
                    const form = document.getElementById(formId);
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                        return new Promise(resolve => setTimeout(resolve, 100));
                    }
                });
                
                if (choice === 'cancel') {
                    return; // Stay on page
                }
                
                // choice is 'saved' or 'dontsave' - proceed to close
                if (closeCallback) closeCallback();
            } else {
                if (closeCallback) closeCallback();
            }
        }
    };
    
    // Remove any existing listener and add new one
    modal.removeEventListener('click', backdropHandler);
    modal.addEventListener('click', backdropHandler);
    
    // Handle Escape key (one listener per modal)
    if (!modal.dataset.escapeHandlerSetup) {
        document.addEventListener('keydown', async function escapeHandler(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                if (formId && hasUnsavedChanges(formId)) {
                    const choice = await showUnsavedChangesModal(formId, () => {
                        const form = document.getElementById(formId);
                        if (form) {
                            form.dispatchEvent(new Event('submit'));
                            return new Promise(resolve => setTimeout(resolve, 100));
                        }
                    });
                    
                    if (choice === 'cancel') {
                        return; // Stay on page
                    }
                    
                    // choice is 'saved' or 'dontsave' - proceed to close
                    if (closeCallback) closeCallback();
                } else {
                    if (closeCallback) closeCallback();
                }
            }
        });
        modal.dataset.escapeHandlerSetup = 'true';
    }
}

// Check medication selector changes
function hasMedicationSelectorChanges(selectorId, originalMeds) {
    const currentMeds = getSelectedMedications ? getSelectedMedications(selectorId) : [];
    const original = Array.isArray(originalMeds) ? originalMeds.map(m => m.id || m).sort().join(',') : '';
    const current = currentMeds.map(m => m.id || m).sort().join(',');
    return original !== current;
}

// Make functions globally available
window.hasUnsavedChanges = hasUnsavedChanges;
window.confirmCloseWithChanges = confirmCloseWithChanges;
window.setupModalWithTracking = setupModalWithTracking;
window.trackFormChanges = trackFormChanges;
window.resetFormTracking = resetFormTracking;
window.hasMedicationSelectorChanges = hasMedicationSelectorChanges;

