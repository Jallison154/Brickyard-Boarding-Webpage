// Custom Confirmation Modal - Replace browser confirm() dialogs

let confirmResolve = null;
let unsavedChangesResolve = null;
let currentFormId = null;
let saveCallback = null;

// Show custom confirmation modal
function showConfirm(title, message) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const footer = document.getElementById('confirmModalFooter');
        const yesBtn = document.getElementById('confirmModalYesBtn');
        
        if (!modal || !titleEl || !messageEl || !yesBtn || !footer) return;
        
        titleEl.textContent = title || 'Confirm Action';
        messageEl.textContent = message || 'Are you sure?';
        
        // Reset to default buttons
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="closeConfirmModal(false)">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmModalYesBtn">Yes</button>
        `;
        
        const newYesBtn = document.getElementById('confirmModalYesBtn');
        if (newYesBtn) {
            newYesBtn.addEventListener('click', () => closeConfirmModal(true));
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Setup backdrop click
        const backdropHandler = (e) => {
            if (e.target === modal) {
                closeConfirmModal(false);
            }
        };
        modal.removeEventListener('click', backdropHandler);
        modal.addEventListener('click', backdropHandler);
        
        // Handle Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeConfirmModal(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

// Show unsaved changes modal with Save/Don't Save options
function showUnsavedChangesModal(formId, onSave) {
    return new Promise((resolve) => {
        // Only show if there are actual changes
        if (!hasUnsavedChanges(formId)) {
            resolve('close');
            return;
        }
        
        unsavedChangesResolve = resolve;
        currentFormId = formId;
        saveCallback = onSave;
        
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const footer = document.getElementById('confirmModalFooter');
        
        if (!modal || !titleEl || !messageEl || !footer) return;
        
        titleEl.textContent = 'Unsaved Changes';
        messageEl.textContent = 'You have unsaved changes. What would you like to do?';
        
        // Custom buttons for unsaved changes
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="handleUnsavedChangesChoice('cancel')">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="handleUnsavedChangesChoice('dontsave')">Discard</button>
            <button type="button" class="btn btn-primary" onclick="handleUnsavedChangesChoice('save')">Save</button>
        `;
        
        // Show modal
        modal.classList.add('active');
        
        // Setup backdrop click
        const backdropHandler = (e) => {
            if (e.target === modal) {
                handleUnsavedChangesChoice('cancel');
            }
        };
        modal.removeEventListener('click', backdropHandler);
        modal.addEventListener('click', backdropHandler);
        
        // Handle Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                handleUnsavedChangesChoice('cancel');
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

// Handle unsaved changes choice
async function handleUnsavedChangesChoice(choice) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (unsavedChangesResolve) {
        if (choice === 'save' && saveCallback) {
            // Trigger save
            try {
                if (typeof saveCallback === 'function') {
                    await saveCallback();
                } else {
                    // Try to submit the form
                    const form = document.getElementById(currentFormId);
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
                resetFormTracking(currentFormId);
                unsavedChangesResolve('saved');
            } catch (e) {
                console.error('Error saving:', e);
                unsavedChangesResolve('cancel');
            }
        } else if (choice === 'dontsave') {
            // Close without saving - discard changes
            resetFormTracking(currentFormId);
            delete formChangeTrackers[currentFormId];
            unsavedChangesResolve('dontsave');
        } else if (choice === 'cancel') {
            // Cancel - stay on page
            unsavedChangesResolve('cancel');
        }
        
        unsavedChangesResolve = null;
        currentFormId = null;
        saveCallback = null;
    }
}

// Close confirmation modal
function closeConfirmModal(confirmed) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (confirmResolve) {
        confirmResolve(confirmed);
        confirmResolve = null;
    }
}

// Make functions globally available
window.showConfirm = showConfirm;
window.showUnsavedChangesModal = showUnsavedChangesModal;
window.handleUnsavedChangesChoice = handleUnsavedChangesChoice;
window.closeConfirmModal = closeConfirmModal;

// Replace native confirm with custom modal (async/await compatible)
async function customConfirm(message, title = 'Confirm Action') {
    return await showConfirm(title, message);
}

window.customConfirm = customConfirm;

