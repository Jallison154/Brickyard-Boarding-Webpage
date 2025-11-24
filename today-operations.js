// Today's Operations Page

// Initialize today's operations
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('todayTab')) {
        loadTodayOperations();
        // Refresh every 5 minutes
        setInterval(loadTodayOperations, 300000);
    }
});

// Load today's operations
function loadTodayOperations() {
    loadArrivals();
    loadDepartures();
    loadCurrentDogs();
    updateTodayStats();
}

// Error handling utility
function handleError(message, error) {
    // Only log in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error(message, error);
    }
}

// Get animal icon image
function getAnimalIcon(animalType) {
    const type = animalType || 'Dog';
    const iconFile = type === 'Cat' ? 'cat-icon.png' : 'dog-icon.png';
    return `<img src="resources/images/${iconFile}" alt="${type}" class="animal-icon" style="width: 1.2em; height: 1.2em; vertical-align: middle; display: inline-block;">`;
}

// Get animal icon for large display
function getAnimalIconLarge(animalType) {
    const type = animalType || 'Dog';
    const iconFile = type === 'Cat' ? 'cat-icon.png' : 'dog-icon.png';
    return `<img src="resources/images/${iconFile}" alt="${type}" class="animal-icon-large" style="width: 3em; height: 3em; display: block; margin: 0 auto;">`;
}

// Update today's stats
function updateTodayStats() {
    try {
        const appointments = getAppointments();
        if (!Array.isArray(appointments)) {
            appointments = [];
        }
        const today = new Date().toISOString().split('T')[0];
        
        // Count checked-in animals
        const checkedInCount = appointments.filter(apt => {
            if (!apt) return false;
            const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
            const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
            return isCheckedIn && !isCheckedOut;
        }).length;
        
        // Count today's arrivals
        const arrivalsCount = appointments.filter(apt => {
            if (!apt) return false;
            const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
            const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
            if (isCheckedIn || isCheckedOut) return false;
            if (!apt.startDate) return false;
            try {
                const startDate = new Date(apt.startDate).toISOString().split('T')[0];
                return startDate === today;
            } catch (e) {
                return false;
            }
        }).length;
        
        // Update UI
        const checkedInEl = document.getElementById('checkedInCount');
        const arrivalsEl = document.getElementById('arrivalsCount');
        
        if (checkedInEl) {
            checkedInEl.textContent = checkedInCount || 0;
        }
        if (arrivalsEl) {
            arrivalsEl.textContent = arrivalsCount || 0;
        }
    } catch (error) {
        handleError('Error updating today stats', error);
    }
}

// Load scheduled arrivals
function loadArrivals() {
    const appointments = getAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's arrivals that aren't checked in yet
    const arrivals = appointments.filter(apt => {
        const startDate = new Date(apt.startDate).toISOString().split('T')[0];
        return startDate === today && !apt.checkedIn && !apt.checkedOut;
    });
    
    const arrivalsList = document.getElementById('arrivalsList');
    
    if (arrivals.length === 0) {
        arrivalsList.innerHTML = `
            <div class="empty-state">
                <p>No scheduled arrivals for today</p>
            </div>
        `;
        return;
    }
    
    arrivalsList.innerHTML = arrivals.map(apt => {
        // Try to get animal from new structure first
        let dog = null;
        let clientPhone = '';
        let ownerName = apt.clientName || '';
        
        if (typeof getAnimalById === 'function') {
            dog = getAnimalById(apt.dogId);
            if (dog) {
                clientPhone = dog.ownerPhone || '';
                ownerName = `${dog.ownerName || ''} ${dog.ownerLastName || ''}`.trim();
            }
        }
        
        // Fallback to old structure
        if (!dog) {
            const client = getClientById(apt.clientId);
            dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
            if (client) {
                clientPhone = client.phone || '';
                ownerName = client.contactName || client.familyName || apt.clientName || '';
            }
        }
        
        const arrivalTime = apt.startTime || 'Scheduled';
        
        // Get first photo if available
        const firstPhoto = dog && dog.documents && dog.documents.length > 0 ? 
            dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
        
        // Determine animal type and icon
        const animalType = dog && dog.animalType ? dog.animalType : 'Dog';
        const animalIcon = getAnimalIcon(animalType);
        const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
        
        return `
            <div class="arrival-card">
                <div class="arrival-photo-section">
                    ${firstPhoto ? `
                        <div class="arrival-photo" onclick="viewPhotoFullscreen('${dog.id}', 0)">
                            <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}">
                        </div>
                    ` : `
                        <div class="arrival-photo-placeholder ${animalType.toLowerCase()}">
                            <span class="animal-icon-large">${animalEmoji}</span>
                        </div>
                    `}
                </div>
                <div class="arrival-info">
                    <h3>${escapeHtml(apt.dogName || dog?.name || 'Unknown')}${dog?.lastName ? ' ' + escapeHtml(dog.lastName) : ''}</h3>
                    <p class="arrival-owner">Owner: ${escapeHtml(ownerName || apt.clientName || 'Unknown')}</p>
                    <p class="arrival-animal-type">${animalIcon} ${animalType}</p>
                    <p class="arrival-time">⏰ ${arrivalTime}</p>
                    ${clientPhone ? `<p class="arrival-contact">📞 ${escapeHtml(clientPhone)}</p>` : ''}
                    ${dog && dog.foodRequirements ? `<p class="arrival-needs">🍽️ Food: ${escapeHtml(dog.foodRequirements)}</p>` : ''}
                    ${dog && dog.medications ? `<p class="arrival-needs urgent">💊 Meds: ${escapeHtml(formatMedicationsDisplay(dog.medications))}</p>` : ''}
                </div>
                <button class="btn-checkin" id="checkinBtn_${apt.id}" onclick="handleCheckInClick('${apt.id}')">
                    ✓ Check In
                </button>
            </div>
        `;
    }).join('');
}

// Load scheduled departures for today
function loadDepartures() {
    const appointments = getAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's departures that are checked in but not checked out
    const departures = appointments.filter(apt => {
        const endDate = new Date(apt.endDate).toISOString().split('T')[0];
        return endDate === today && apt.checkedIn && !apt.checkedOut;
    });
    
    const departuresList = document.getElementById('departuresList');
    
    if (departures.length === 0) {
        departuresList.innerHTML = `
            <div class="empty-state">
                <p>No scheduled departures for today</p>
            </div>
        `;
        return;
    }
    
    departuresList.innerHTML = departures.map(apt => {
        const client = getClientById(apt.clientId);
        const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
        const clientPhone = client ? client.phone : '';
        const departureTime = apt.endTime || 'Before close';
        
        // Get first photo if available
        const firstPhoto = dog && dog.documents && dog.documents.length > 0 ? 
            dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
        
        // Determine animal type and icon
        const animalType = dog && dog.animalType ? dog.animalType : 'Dog';
        const animalIcon = getAnimalIcon(animalType);
        const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
        
        return `
            <div class="departure-card">
                <div class="departure-header">
                    <div class="departure-photo-section">
                        ${firstPhoto ? `
                            <div class="departure-photo" onclick="viewPhotoFullscreen('${dog.id}', 0)">
                                <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}">
                            </div>
                        ` : `
                            <div class="departure-photo-placeholder ${animalType.toLowerCase()}">
                                <span class="animal-icon-large">${animalEmoji}</span>
                            </div>
                        `}
                    </div>
                    <div class="departure-info">
                        <h3>${escapeHtml(apt.dogName || dog?.name || 'Unknown')}${dog?.lastName ? ' ' + escapeHtml(dog.lastName) : ''}</h3>
                        <p class="departure-animal-type">${animalIcon} ${animalType}</p>
                        <p class="departure-owner">Owner: ${escapeHtml(ownerName || apt.clientName || 'Unknown')}</p>
                        <p class="departure-time">⏰ ${departureTime}</p>
                    </div>
                </div>
                
                <div class="departure-actions">
                    ${clientPhone ? `
                        <button class="action-btn-large phone" onclick="callContact('${escapeHtml(clientPhone)}', 'owner')">
                            <span class="action-icon">📞</span>
                            <span class="action-text">
                                <span class="action-label">Call Owner</span>
                                <span class="action-detail">${escapeHtml(clientPhone)}</span>
                            </span>
                        </button>
                    ` : ''}
                    <button class="action-btn-large checkout" id="checkoutBtn_${apt.id}" onclick="handleCheckOutClick('${apt.id}')">
                        <span class="action-icon">🏃</span>
                        <span class="action-text">
                            <span class="action-label" id="checkoutLabel_${apt.id}">Check Out</span>
                            <span class="action-detail">${escapeHtml(apt.dogName)}</span>
                        </span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Load current animals (checked in but not checked out)
function loadCurrentDogs() {
    try {
        // Get fresh data directly from localStorage to avoid caching issues
        const appointmentsStr = localStorage.getItem('appointments');
        if (!appointmentsStr) {
            const currentDogsList = document.getElementById('currentDogsList');
            if (currentDogsList) {
                currentDogsList.innerHTML = `<div class="empty-state"><p>No animals currently checked in</p></div>`;
            }
            return;
        }
        
        let appointments;
        try {
            appointments = JSON.parse(appointmentsStr);
            if (!Array.isArray(appointments)) {
                appointments = [];
            }
        } catch (parseError) {
            handleError('Error parsing appointments data', parseError);
            appointments = [];
        }
        
        // Filter for checked-in animals that haven't been checked out
        const currentDogs = [];
        for (const apt of appointments) {
            // Skip invalid appointments
            if (!apt || !apt.id) continue;
            
            // Explicitly check boolean values (handle both true and 'true' strings)
            const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
            const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
            
            // Include if checked in AND not checked out
            if (isCheckedIn && !isCheckedOut) {
                currentDogs.push(apt);
            }
        }
        
        const currentDogsList = document.getElementById('currentDogsList');
        
        if (!currentDogsList) {
            handleError('currentDogsList element not found in DOM', new Error('DOM element missing'));
            return;
        }
        
        if (currentDogs.length === 0) {
            currentDogsList.innerHTML = `
                <div class="empty-state">
                    <p>No animals currently checked in</p>
                </div>
            `;
            return;
        }
    
    // Get today's date for care logs
    const today = new Date().toISOString().split('T')[0];
    
    currentDogsList.innerHTML = currentDogs.map(apt => {
        // Get animal using new structure - first try to get from appointments
        let dog = null;
        let clientPhone = '';
        let vetPhone = '';
        let emergencyPhone = '';
        let ownerName = apt.clientName || '';
        
        // Try to find animal from appointments with full info
        if (typeof getAnimalById === 'function') {
            dog = getAnimalById(apt.dogId);
            if (dog) {
                clientPhone = dog.ownerPhone || '';
                vetPhone = dog.vetPhone || '';
                emergencyPhone = dog.emergencyPhone || '';
                ownerName = `${dog.ownerName || ''} ${dog.ownerLastName || ''}`.trim();
            }
        }
        
        // Fallback to old structure for backwards compatibility if animal not found
        if (!dog) {
            const client = getClientById(apt.clientId);
            dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
            if (client) {
                clientPhone = client.phone || '';
                vetPhone = client.vetPhone || '';
                emergencyPhone = client.emergencyPhone || '';
                ownerName = client.contactName || client.familyName || apt.clientName || '';
            }
        }
        
        // Get today's care log if exists
        const careLogs = getCareLogs();
        const todayLog = careLogs.find(log => 
            log.appointmentId === apt.id && log.date === today
        );
        
        // Calculate medications needed (handle both string and array formats)
        const needsMeds = dog && dog.medications && (
            Array.isArray(dog.medications) ? dog.medications.length > 0 : 
            (typeof dog.medications === 'string' ? dog.medications.trim() : false)
        );
        
        // Get first photo if available
        const firstPhoto = dog && dog.documents && dog.documents.length > 0 ? 
            dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
        
        // Determine animal type and icon
        const animalType = dog && dog.animalType ? dog.animalType : 'Dog';
        const animalIcon = getAnimalIcon(animalType);
        const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
        
        return `
            <div class="current-dog-card">
                <div class="dog-card-header">
                    ${firstPhoto ? `
                        <div class="dog-photo-thumbnail-small" onclick="viewPhotoFullscreen('${dog ? dog.id : apt.dogId}', 0)">
                            <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}">
                        </div>
                    ` : `
                        <div class="dog-photo-placeholder-small">${animalEmoji}</div>
                    `}
                    <div class="dog-name-section">
                        <h3>${animalIcon} ${escapeHtml(apt.dogName || dog?.name || 'Unknown')}${dog?.lastName ? ' ' + escapeHtml(dog.lastName) : ''}</h3>
                        <p class="dog-owner">Owner: ${escapeHtml(ownerName || apt.clientName || 'Unknown')}</p>
                        ${animalType ? `<p class="dog-owner">Type: ${animalType}</p>` : ''}
                    </div>
                    <div class="dog-actions">
                        <button class="action-btn primary" onclick="viewAnimalInfo('${apt.id}')">
                            📋 View Info
                        </button>
                        <button class="action-btn secondary" onclick="openCareLogModal('${apt.id}')">
                            📝 Care Log
                        </button>
                        <button class="action-btn secondary" id="checkoutBtnCurrent_${apt.id}" onclick="handleCheckOutClick('${apt.id}')">
                            🏃 <span id="checkoutLabelCurrent_${apt.id}">Check Out</span>
                        </button>
                    </div>
                </div>
                
                <div class="dog-needs-grid">
                    ${dog && dog.foodRequirements ? `
                        <div class="need-card food">
                            <div class="need-header">
                                <span class="need-icon">🍽️</span>
                                <span class="need-title">Food</span>
                                ${todayLog && todayLog.breakfast && todayLog.dinner ? '<span class="need-done">✓ Done</span>' : ''}
                            </div>
                            <p class="need-details">${escapeHtml(dog.foodRequirements)}</p>
                            ${todayLog ? `
                                <div class="need-status">
                                    ${todayLog.breakfast ? '<span class="status-done">Breakfast ✓</span>' : '<span class="status-pending">Breakfast ⏳</span>'}
                                    ${todayLog.dinner ? '<span class="status-done">Dinner ✓</span>' : '<span class="status-pending">Dinner ⏳</span>'}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${needsMeds ? `
                        <div class="need-card medication ${todayLog && todayLog.medications ? 'med-given' : 'med-needed'}">
                            <div class="need-header">
                                <span class="need-icon">💊</span>
                                <span class="need-title">Medications</span>
                                ${todayLog && todayLog.medications ? '<span class="need-done">✓ Given</span>' : '<span class="need-urgent">⚠️ Needed</span>'}
                            </div>
                            <p class="need-details">${escapeHtml(typeof formatMedicationsDisplay === 'function' ? formatMedicationsDisplay(dog.medications) : (typeof dog.medications === 'string' ? dog.medications : JSON.stringify(dog.medications)))}</p>
                            ${todayLog && todayLog.medications ? `<p class="need-log">Today: ${escapeHtml(todayLog.medications)}</p>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="need-card exercise">
                        <div class="need-header">
                            <span class="need-icon">🚶</span>
                            <span class="need-title">Exercise</span>
                            ${todayLog && todayLog.walks ? '<span class="need-done">✓ Done</span>' : ''}
                        </div>
                        ${todayLog && todayLog.walks ? `<p class="need-log">${escapeHtml(todayLog.walks)}</p>` : '<p class="need-placeholder">Log walks and activities here</p>'}
                    </div>
                    
                    ${dog && dog.notes ? `
                        <div class="need-card notes">
                            <div class="need-header">
                                <span class="need-icon">📋</span>
                                <span class="need-title">Special Notes</span>
                            </div>
                            <p class="need-details">${escapeHtml(dog.notes)}</p>
                        </div>
                    ` : ''}
                    
                    ${todayLog && todayLog.behavior ? `
                        <div class="need-card behavior">
                            <div class="need-header">
                                <span class="need-icon">👀</span>
                                <span class="need-title">Today's Behavior</span>
                            </div>
                            <p class="need-log">${escapeHtml(todayLog.behavior)}</p>
                        </div>
                    ` : ''}
                </div>
                
            </div>
        `;
    }).join('');
    
    } catch (error) {
        handleError('Error in loadCurrentDogs', error);
        const currentDogsList = document.getElementById('currentDogsList');
        if (currentDogsList) {
            currentDogsList.innerHTML = `<div class="empty-state"><p>Error loading current animals</p></div>`;
        }
    }
}


// Handle check-in button click (two-step confirmation)
function handleCheckInClick(appointmentId) {
    const btn = document.getElementById(`checkinBtn_${appointmentId}`);
    if (!btn) return;
    
    // If button already shows "Confirm", perform the check-in
    if (btn.textContent.trim() === 'Confirm' || btn.classList.contains('btn-confirm')) {
        performCheckIn(appointmentId);
    } else {
        // First click - change button to "Confirm" with animation
        btn.style.width = btn.offsetWidth + 'px'; // Lock width
        btn.textContent = 'Confirm';
        btn.classList.add('btn-confirm');
        
        // Reset after 3 seconds if not clicked again
        setTimeout(() => {
            const currentBtn = document.getElementById(`checkinBtn_${appointmentId}`);
            if (currentBtn && currentBtn.classList.contains('btn-confirm')) {
                currentBtn.textContent = '✓ Check In';
                currentBtn.classList.remove('btn-confirm');
                currentBtn.style.width = ''; // Unlock width
            }
        }, 3000);
    }
}

// Handle check-out button click (two-step confirmation)
function handleCheckOutClick(appointmentId) {
    // Try to find all possible checkout button IDs
    const btn = document.getElementById(`checkoutBtn_${appointmentId}`) || 
                document.getElementById(`checkoutBtnCurrent_${appointmentId}`) ||
                document.getElementById(`checkoutDetailed_${appointmentId}`) ||
                document.getElementById(`checkoutDetailModal_${appointmentId}`);
    const label = document.getElementById(`checkoutLabel_${appointmentId}`) || 
                  document.getElementById(`checkoutLabelCurrent_${appointmentId}`) ||
                  document.getElementById(`checkoutLabelDetailed_${appointmentId}`) ||
                  document.getElementById(`checkoutLabelDetailModal_${appointmentId}`);
    
    if (!btn && !label) return;
    
    // Check if button already shows "Confirm"
    const btnText = btn ? btn.textContent.trim() : '';
    const labelText = label ? label.textContent.trim() : '';
    const isConfirming = btnText === 'Confirm' || btnText.includes('Confirm') || labelText === 'Confirm' || btn?.classList.contains('btn-confirm');
    
    // If button already shows "Confirm", perform the check-out
    if (isConfirming) {
        performCheckOut(appointmentId);
    } else {
        // Lock width BEFORE changing text to maintain button size
        if (btn) {
            btn.style.width = btn.offsetWidth + 'px'; // Lock width first
        }
        
        // First click - change button to "Confirm" (remove emoji)
        if (label) {
            // Update label text - remove emoji from parent button if present
            const parentBtn = label.closest('button');
            if (parentBtn && parentBtn.innerHTML.includes('🏃')) {
                parentBtn.innerHTML = `<span id="${label.id}">Confirm</span>`;
                // Ensure parent button width is locked
                if (parentBtn) {
                    parentBtn.style.width = parentBtn.offsetWidth + 'px';
                }
            } else {
                label.textContent = 'Confirm';
            }
        } else if (btn) {
            // Update button text - remove emoji
            btn.innerHTML = `Confirm`;
        }
        
        // Add confirm class
        if (btn || label) {
            const targetBtn = btn || label.closest('button');
            if (targetBtn) {
                targetBtn.classList.add('btn-confirm');
                // Double-check width is locked
                if (!targetBtn.style.width || targetBtn.style.width === '') {
                    targetBtn.style.width = targetBtn.offsetWidth + 'px';
                }
            }
        }
        
              // Reset after 3 seconds if not clicked again
              setTimeout(() => {
                  const currentBtn = document.getElementById(`checkoutBtn_${appointmentId}`) || 
                                    document.getElementById(`checkoutBtnCurrent_${appointmentId}`) ||
                                    document.getElementById(`checkoutDetailed_${appointmentId}`) ||
                                    document.getElementById(`checkoutDetailModal_${appointmentId}`);
                  const currentLabel = document.getElementById(`checkoutLabel_${appointmentId}`) || 
                                      document.getElementById(`checkoutLabelCurrent_${appointmentId}`) ||
                                      document.getElementById(`checkoutLabelDetailed_${appointmentId}`) ||
                                      document.getElementById(`checkoutLabelDetailModal_${appointmentId}`);
            
            if (currentBtn || currentLabel) {
                const isStillConfirming = (currentBtn?.classList.contains('btn-confirm') || 
                                         currentLabel?.textContent.trim() === 'Confirm');
                
                if (isStillConfirming) {
                    if (currentLabel) {
                        currentLabel.textContent = 'Check Out';
                    }
                    if (currentBtn) {
                        currentBtn.classList.remove('btn-confirm');
                        currentBtn.style.width = ''; // Unlock width
                        // Restore original button HTML if needed
                        if (currentBtn.innerHTML.includes('Confirm') && !currentBtn.innerHTML.includes('🏃')) {
                            currentBtn.innerHTML = `🏃 <span id="checkoutLabel${currentBtn.id.includes('Current') ? 'Current' : currentBtn.id.includes('Detailed') ? 'Detailed' : ''}_${appointmentId}">Check Out</span>`;
                        }
                    }
                }
            }
        }, 3000);
    }
}

// Perform actual check-in
function performCheckIn(appointmentId) {
    if (!appointmentId) {
        handleError('No appointment ID provided for check-in', new Error('Missing appointment ID'));
        return;
    }
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) {
        handleError('Appointment not found for check-in', new Error(`Appointment ID: ${appointmentId}`));
        return;
    }
    
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === appointmentId);
    
    if (apt) {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        
        // Set check-in status
        apt.checkedIn = true;
        apt.checkedOut = false;
        apt.checkinDateTime = localDateTime;
        apt.status = 'in-progress';
        
        // Create check-in log entry
        const checkInLog = {
            id: `checkin_${Date.now()}`,
            appointmentId: appointmentId,
            clientId: apt.clientId,
            dogId: apt.dogId,
            dogName: apt.dogName,
            action: 'checked_in',
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            notes: `${apt.dogName} checked in`
        };
        
        // Get existing check-in logs
        let checkInLogs = [];
        try {
            const logsStr = localStorage.getItem('checkInLogs');
            if (logsStr) {
                checkInLogs = JSON.parse(logsStr);
            }
        } catch (e) {
            handleError('Error reading check-in logs', e);
        }
        
        // Add new check-in log
        checkInLogs.push(checkInLog);
        localStorage.setItem('checkInLogs', JSON.stringify(checkInLogs));
        
        // Save updated appointment
        try {
            localStorage.setItem('appointments', JSON.stringify(appointments));
        } catch (saveError) {
            handleError('Error saving appointment during check-in', saveError);
            if (saveError.name === 'QuotaExceededError') {
                alert('Storage limit exceeded. Please contact support.');
            }
            return;
        }
        
        // Force refresh all sections
        setTimeout(() => {
            loadTodayOperations();
            loadCurrentDogs();
            updateTodayStats();
            if (document.getElementById('currentTab') && document.getElementById('currentTab').classList.contains('active')) {
                loadCurrentAnimalsDetailed();
            }
        }, 100);
        
        // Check-in completed successfully
    } else {
        handleError('Appointment not found in appointments array during check-in', new Error(`Appointment ID: ${appointmentId}`));
    }
}

// Perform actual check-out
function performCheckOut(appointmentId) {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;
    
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === appointmentId);
    
    if (apt) {
        apt.checkedOut = true;
        apt.checkoutDateTime = new Date().toISOString();
        apt.status = 'completed';
        
        // Create check-out log entry
        const checkOutLog = {
            id: `checkout_${Date.now()}`,
            appointmentId: appointmentId,
            clientId: apt.clientId,
            dogId: apt.dogId,
            dogName: apt.dogName,
            action: 'checked_out',
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            notes: `${apt.dogName} checked out`
        };
        
        // Get existing check-in logs
        let checkInLogs = [];
        try {
            const logsStr = localStorage.getItem('checkInLogs');
            if (logsStr) {
                checkInLogs = JSON.parse(logsStr);
            }
        } catch (e) {
            handleError('Error reading check-in logs', e);
        }
        
        // Add new check-out log
        checkInLogs.push(checkOutLog);
        localStorage.setItem('checkInLogs', JSON.stringify(checkInLogs));
        
        // Save updated appointment
        try {
            localStorage.setItem('appointments', JSON.stringify(appointments));
        } catch (saveError) {
            handleError('Error saving appointment during check-out', saveError);
            if (saveError.name === 'QuotaExceededError') {
                alert('Storage limit exceeded. Please contact support.');
            }
            return;
        }
        
        // Force refresh all sections
        setTimeout(() => {
            loadTodayOperations();
            loadCurrentDogs();
            updateTodayStats();
            if (document.getElementById('currentTab') && document.getElementById('currentTab').classList.contains('active')) {
                loadCurrentAnimalsDetailed();
            }
        }, 100);
        
        // Check-out completed successfully
    }
}

// Load simple grid view for Current Animals tab
function loadCurrentAnimalsDetailed() {
    try {
        // Get fresh data directly from localStorage
        const appointmentsStr = localStorage.getItem('appointments');
        if (!appointmentsStr) {
            const gridContainer = document.getElementById('currentAnimalsGrid');
            if (gridContainer) {
                gridContainer.innerHTML = `<div class="empty-state"><p>No animals currently checked in</p></div>`;
            }
            return;
        }
        
        const appointments = JSON.parse(appointmentsStr);
        
        // Simple filter: if checked in and not checked out, show them
        const currentDogs = [];
        for (const apt of appointments) {
            if (!apt || !apt.id) continue;
            
            const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
            const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
            
            if (isCheckedIn && !isCheckedOut) {
                currentDogs.push(apt);
            }
        }
        
        const gridContainer = document.getElementById('currentAnimalsGrid');
        const countElement = document.getElementById('currentAnimalsCount');
        
        if (!gridContainer) {
            handleError('currentAnimalsGrid element not found in DOM', new Error('DOM element missing'));
            return;
        }
        
        if (countElement) {
            countElement.textContent = currentDogs.length;
        }
        
        if (currentDogs.length === 0) {
            gridContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2"/>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>No animals currently checked in</p>
                    <span>Animals will appear here once they are checked in</span>
                </div>
            `;
            return;
        }
        
        // Render simple grid with just photo and name
        gridContainer.innerHTML = currentDogs.map(apt => {
        const client = getClientById(apt.clientId);
        const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
        
        // Get first photo
        const firstPhoto = dog && dog.documents && dog.documents.length > 0 ? 
            dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
        const animalType = dog && dog.animalType ? dog.animalType : 'Dog';
        const animalEmoji = getAnimalIcon(animalType);
        
        return `
            <div class="current-animal-card" onclick="openCurrentAnimalDetail('${apt.id}')">
                <div class="current-animal-photo">
                    ${firstPhoto ? `
                        <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}">
                    ` : `
                        <div class="current-animal-photo-placeholder ${animalType.toLowerCase()}">
                            ${animalType === 'Dog' ? `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJkb2dGcmFkaSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNERUI1ODciLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGNUQzODIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI2NSIgZmlsbD0idXJsKCNkb2dGcmFkaSkiLz48cGF0aCBkPSJNNDUgNTBMMzUgNzVMNTUgNzVaIiBmaWxsPSIjOEI3MzU1Ii8+PHBhdGggZD0iTTEwNSA1MEwxMTUgNzVMOTUgNzVaIiBmaWxsPSIjOEI3MzU1Ii8+PGNpcmNsZSBjeD0iNjUiIGN5PSI3MCIgcj0iNCIgZmlsbD0iIzAwMCIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iNzAiIHI9IjQiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNNzAgODVDNzAgODUgNzMgOTAgNzUgOTBDNzcgOTAgODAgODUgODAgODUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTYyIDEwMEg4OEwxMDAgMTIwSDUwWiIgZmlsbD0iI0YwMzU4NiIvPjxwYXRoIGQ9Ik02MiAxMDBINDAiIHN0cm9rZT0iI0YwMzU4NiIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+" alt="Dog" />` : animalType === 'Cat' ? `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjYXRGcmFkaSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRkQ3MDA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRkE1ODA7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI3MCIgZmlsbD0iIzY0MzI5NiIvLz48cmVjdCB4PSI0MCIgeT0iNDUiIHdpZHRoPSI3MCIgaGVpZ2h0PSI1NSIgcng9IjE1IiBmaWxsPSJ1cmwoI2NhdEZyYWRpKSIvPjxwYXRoIGQ9Ik01MCA1NUw0MCAyMEw2MCAyMFoiIGZpbGw9InVybCgjY2F0RnJhZGkpIi8+PHBhdGggZD0iTTEwMCA1NUwxMTAgMjBMOTAgMjBaIiBmaWxsPSJ1cmwoI2NhdEZyYWRpKSIvPjxjaXJjbGUgY3g9IjY1IiBjeT0iNzAiIHI9IjUiIGZpbGw9IiMwMDAiLz48Y2lyY2xlIGN4PSI4NSIgY3k9IjcwIiByPSI1IiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTc1IDgwTDcwIDc1TDgwIDc1WiIgZmlsbD0iI0ZGOTdBQyIvPjxwYXRoIGQ9Ik03MCA4NUM3MCA4NSA3NSA5NSA3NSA5NSIgc3Ryb2tlPSIjRkY5N0FDIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgcXg9IjEwMCIgcXk9Ijk1Ii8+PHBhdGggZD0iTTYwIDcyTDQ1IDY1IiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTYwIDc3TDQ1IDgwIiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTYwIDgyTDQ1IDg1IiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTkwIDcyTDEwNSA2NSIgc3Ryb2tlPSIjQTU0NDIwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik05MCA3N0wxMDUgODAiIHN0cm9rZT0iI0E1NDQyMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNOTEgODJMMTA1IDg1IiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+" alt="Cat" />` : `<span style="font-size: 4rem;">${animalEmoji}</span>`}
                        </div>
                    `}
                </div>
                <h3 class="current-animal-name">${escapeHtml(apt.dogName)}</h3>
            </div>
        `;
        }).join('');
    
    } catch (error) {
        handleError('Error in loadCurrentAnimalsDetailed', error);
        const gridContainer = document.getElementById('currentAnimalsGrid');
        if (gridContainer) {
            const errorMessage = error && error.message ? error.message : 'Unknown error';
            gridContainer.innerHTML = `<div class="empty-state"><p>Error loading current animals: ${escapeHtml(errorMessage)}</p></div>`;
        }
    }
}

// Open current animal detail modal (reuses the detailed view logic)
function openCurrentAnimalDetail(appointmentId) {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;
    
    const modal = document.getElementById('currentAnimalDetailModal');
    const content = document.getElementById('currentAnimalDetailContent');
    const title = document.getElementById('currentAnimalDetailTitle');
    
    if (!modal || !content) return;
    
    const client = getClientById(appointment.clientId);
    const dog = client && client.dogs ? client.dogs.find(d => d.id === appointment.dogId) : null;
    const clientPhone = client ? client.phone : '';
    const vetPhone = client ? client.vetPhone : '';
    const emergencyPhone = client ? client.emergencyPhone : '';
    
    if (!dog) {
        content.innerHTML = '<p>Animal information not found.</p>';
        modal.style.display = 'flex';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const careLogs = getCareLogs();
    const todayLog = careLogs.find(log => 
        log.appointmentId === appointment.id && log.date === today
    );
    const allLogs = careLogs.filter(log => log.appointmentId === appointment.id);
    
    const firstPhoto = dog.documents && dog.documents.length > 0 ? 
        dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
    const animalType = dog.animalType || 'Dog';
    const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
    
    const checkInDate = appointment.checkinDateTime ? new Date(appointment.checkinDateTime) : (appointment.startDate ? new Date(appointment.startDate) : new Date());
    const daysStayed = Math.floor((new Date() - checkInDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const needsMeds = dog.medications && (
        Array.isArray(dog.medications) ? dog.medications.length > 0 : 
        (typeof dog.medications === 'string' ? dog.medications.trim() : false)
    );
    
    title.textContent = appointment.dogName;
    
    content.innerHTML = `
        <div class="current-animal-detailed-card">
            <div class="animal-detailed-header">
                <div class="animal-detailed-photo">
                    ${firstPhoto ? `
                        <div class="animal-photo-large" onclick="viewPhotoFullscreen('${dog.id}', 0)">
                            <img src="${firstPhoto.data}" alt="${escapeHtml(appointment.dogName)}">
                        </div>
                    ` : `
                        <div class="animal-photo-large-placeholder ${animalType.toLowerCase()}">
                            ${animalType === 'Dog' ? `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJkb2dGcmFkaTIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojREVCNTg3Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjVEMzgyIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5MCIgZmlsbD0idXJsKCNkb2dGcmFkaTIpIi8+PHBhdGggZD0iTTYwIDcwTDUwIDk1TDcwIDk1WiIgZmlsbD0iIzhCNzM1NSIvPjxwYXRoIGQ9Ik0xNDAgNzBMMTUwIDk1TDEzMCA5NVoiIGZpbGw9IiM4QjczNTUiLz48Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI2IiBmaWxsPSIjMDAwIi8+PGNpcmNsZSBjeD0iMTE1IiBjeT0iOTUiIHI9IjYiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNOTUgODVDOTUgODUgOTkgMTAwIDEwMCAxMDVDMTA2IDEwMCAxMTAgODUgMTEwIDg1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMTAgMTM1SDE0MEwxNTUgMTcwSDU1WiIgZmlsbD0iI0YwMzU4NiIvPjxwYXRoIGQ9Ik0xMTAgMTM1SDUwIiBzdHJva2U9IiNGMDM1ODYiIHN0cm9rZS13aWR0aD0iNCIvPjwvc3ZnPg==" alt="Dog" />` : animalType === 'Cat' ? `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjYXRGcmFkaTIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkZENzAwO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkZBNTgwO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0iIzY0MzI5NiIvLz48cmVjdCB4PSI1NSIgeT0iNjAiIHdpZHRoPSI5MCIgaGVpZ2h0PSI3MCIgcng9IjIwIiBmaWxsPSJ1cmwoI2NhdEZyYWRpMikiLz48cGF0aCBkPSJNNjUgNjVMNTUgMjVMNzUgMjVaIiBmaWxsPSJ1cmwoI2NhdEZyYWRpMikiLz48cGF0aCBkPSJNMTM1IDY1TDE0NSAyNUwxMjUgMjVaIiBmaWxsPSJ1cmwoI2NhdEZyYWRpMikiLz48Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI3IiBmaWxsPSIjMDAwIi8+PGNpcmNsZSBjeD0iMTE1IiBjeT0iOTUiIHI9IjciIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNMTAwIDEwNUw5MyAxMDBMMTA3IDEwMFoiIGZpbGw9IiNGRjk3QUMiLz48cGF0aCBkPSJNOTMgMTEwQzkzIDExMCAxMDAgMTI1IDEwMCAxMjUiIHN0cm9rZT0iI0ZGOTdBQyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHF4PSIxMTAiIHF5PSIxMjUiLz48cGF0aCBkPSJNODAgOTVMNjAgODUiIHN0cm9rZT0iI0E1NDQyMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNODAgMTAwTDYwIDEwNSIgc3Ryb2tlPSIjQTU0NDIwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik04MCAxMDVMNjAgMTEwIiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTEyMCA5NUwxNDAgODUiIHN0cm9rZT0iI0E1NDQyMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTIwIDEwMEwxNDAgMTA1IiBzdHJva2U9IiNBNTQ0MjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTEyMCAxMDVMMTQwIDExMCIgc3Ryb2tlPSIjQTU0NDIwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==" alt="Cat" />` : `<span class="animal-icon-large">${animalEmoji}</span>`}
                        </div>
                    `}
                </div>
                <div class="animal-detailed-info">
                    <h2>${escapeHtml(appointment.dogName)}</h2>
                    <p class="animal-owner-detailed">Owner: ${escapeHtml(appointment.clientName)}</p>
                    <div class="animal-meta">
                        <span class="meta-badge type">${animalType}</span>
                        ${dog.breed ? `<span class="meta-badge breed">${escapeHtml(dog.breed)}</span>` : ''}
                        ${dog.age ? `<span class="meta-badge">Age: ${escapeHtml(dog.age)} years</span>` : ''}
                        ${dog.weight ? `<span class="meta-badge">Weight: ${escapeHtml(dog.weight)} lbs</span>` : ''}
                        ${dog.color ? `<span class="meta-badge">Color: ${escapeHtml(dog.color)}</span>` : ''}
                    </div>
                    <div class="stay-info">
                        <p><strong>Days Stayed:</strong> ${daysStayed} ${daysStayed === 1 ? 'day' : 'days'}</p>
                        ${appointment.checkinDateTime ? `<p><strong>Checked In:</strong> ${new Date(appointment.checkinDateTime).toLocaleString()}</p>` : ''}
                        ${appointment.endDate ? `<p><strong>Expected Departure:</strong> ${new Date(appointment.endDate).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="animal-detailed-actions">
                <button class="action-btn primary" onclick="viewAnimalInfo('${appointment.id}')">
                    📋 View Full Info
                </button>
                <button class="action-btn secondary" onclick="openCareLogModal('${appointment.id}')">
                    📝 Care Log
                </button>
                ${clientPhone ? `
                    <button class="action-btn phone-btn" onclick="callContact('${escapeHtml(clientPhone)}', 'owner')">
                        📞 Call Owner
                    </button>
                ` : ''}
                <button class="action-btn checkout-btn btn-confirm-ready" id="checkoutDetailModal_${appointment.id}" onclick="handleCheckOutClick('${appointment.id}')">
                    🏃 <span id="checkoutLabelDetailModal_${appointment.id}">Check Out</span>
                </button>
            </div>
            
            <div class="animal-detailed-content">
                <div class="detail-section">
                    <h3>🍽️ Food Requirements</h3>
                    ${dog.foodRequirements ? `
                        <p>${escapeHtml(dog.foodRequirements)}</p>
                        ${todayLog ? `
                            <div class="care-status">
                                <span class="${todayLog.breakfast ? 'status-done' : 'status-pending'}">Breakfast: ${todayLog.breakfast ? '✓ Given' : '⏳ Pending'}</span>
                                <span class="${todayLog.dinner ? 'status-done' : 'status-pending'}">Dinner: ${todayLog.dinner ? '✓ Given' : '⏳ Pending'}</span>
                            </div>
                        ` : ''}
                    ` : '<p class="no-data-text">No specific food requirements</p>'}
                </div>
                
                ${needsMeds ? `
                    <div class="detail-section">
                        <h3>💊 Medications</h3>
                        <div class="medications-detailed">
                            <p>${escapeHtml(typeof formatMedicationsDisplay === 'function' ? formatMedicationsDisplay(dog.medications) : JSON.stringify(dog.medications))}</p>
                            ${todayLog && todayLog.medications ? `
                                <div class="care-status">
                                    <span class="status-done">✓ Given today: ${escapeHtml(todayLog.medications)}</span>
                                </div>
                            ` : '<span class="status-urgent">⚠️ Needs to be given</span>'}
                        </div>
                    </div>
                ` : ''}
                
                ${dog.vaccinations ? `
                    <div class="detail-section">
                        <h3>💉 Vaccinations</h3>
                        <p>${escapeHtml(dog.vaccinations)}</p>
                        ${dog.rabiesExpiration ? `
                            <p class="vaccination-exp">Rabies Expires: ${new Date(dog.rabiesExpiration).toLocaleDateString()}</p>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${dog.notes ? `
                    <div class="detail-section">
                        <h3>📝 Special Notes</h3>
                        <p>${escapeHtml(dog.notes)}</p>
                    </div>
                ` : ''}
                
                ${dog.groomingNotes ? `
                    <div class="detail-section">
                        <h3>✂️ Grooming</h3>
                        ${dog.lastGroomingDate ? `<p><strong>Last Grooming:</strong> ${new Date(dog.lastGroomingDate).toLocaleDateString()}</p>` : ''}
                        ${dog.nextGroomingDue ? `<p><strong>Next Due:</strong> ${new Date(dog.nextGroomingDue).toLocaleDateString()}</p>` : ''}
                        <p>${escapeHtml(dog.groomingNotes)}</p>
                    </div>
                ` : ''}
                
                <div class="detail-section">
                    <h3>📋 Care History</h3>
                    ${allLogs.length > 0 ? `
                        <div class="care-history">
                            ${allLogs.slice(-5).reverse().map(log => `
                                <div class="care-history-item">
                                    <strong>${new Date(log.date).toLocaleDateString()}</strong>
                                    ${log.breakfast || log.dinner ? `<span>Food: ${log.breakfast ? 'Breakfast ✓' : ''} ${log.dinner ? 'Dinner ✓' : ''}</span>` : ''}
                                    ${log.medications ? `<span>Meds: ${escapeHtml(log.medications)}</span>` : ''}
                                    ${log.walks ? `<span>Exercise: ${escapeHtml(log.walks)}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-data-text">No care logs yet</p>'}
                </div>
                
                <div class="detail-section">
                    <h3>📞 Emergency Contacts</h3>
                    <div class="contact-info-grid">
                        ${clientPhone ? `
                            <div class="contact-info-item">
                                <strong>Owner:</strong> 
                                <a href="tel:${escapeHtml(clientPhone)}">${escapeHtml(clientPhone)}</a>
                            </div>
                        ` : ''}
                        ${vetPhone ? `
                            <div class="contact-info-item">
                                <strong>Veterinarian:</strong> 
                                <a href="tel:${escapeHtml(vetPhone)}">${escapeHtml(vetPhone)}</a>
                                ${client && client.vetName ? `<span>(${escapeHtml(client.vetName)})</span>` : ''}
                            </div>
                        ` : ''}
                        ${emergencyPhone ? `
                            <div class="contact-info-item">
                                <strong>Emergency:</strong> 
                                <a href="tel:${escapeHtml(emergencyPhone)}">${escapeHtml(emergencyPhone)}</a>
                                ${client && client.emergencyContact ? `<span>(${escapeHtml(client.emergencyContact)})</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Close current animal detail modal
function closeCurrentAnimalDetailModal() {
    const modal = document.getElementById('currentAnimalDetailModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make functions globally available
window.openCurrentAnimalDetail = openCurrentAnimalDetail;
window.closeCurrentAnimalDetailModal = closeCurrentAnimalDetailModal;

// Make functions globally available
window.handleCheckInClick = handleCheckInClick;
window.handleCheckOutClick = handleCheckOutClick;
window.loadCurrentAnimalsDetailed = loadCurrentAnimalsDetailed;

// View Animal Info
function viewAnimalInfo(appointmentId) {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;
    
    const client = getClientById(appointment.clientId);
    const dog = client && client.dogs ? client.dogs.find(d => d.id === appointment.dogId) : null;
    
    if (!dog) {
        alert('Dog information not found');
        return;
    }
    
    const modal = document.getElementById('animalInfoModal');
    const content = document.getElementById('animalInfoContent');
    const title = document.getElementById('animalInfoTitle');
    const editBtn = document.getElementById('editAnimalInfoBtn');
    
    title.textContent = dog.name;
    
    // Get today's care log
    const careLogs = getCareLogs();
    const today = new Date().toISOString().split('T')[0];
    const todayLog = careLogs.find(log => 
        log.appointmentId === appointmentId && log.date === today
    );
    
    // Get first photo if available
    const firstPhoto = dog.documents && dog.documents.length > 0 ? 
        dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
    
    content.innerHTML = `
        <div class="animal-info-header">
            <div class="animal-info-basic">
                ${firstPhoto ? `
                    <div class="animal-photo-display">
                        <img src="${firstPhoto.data}" alt="${escapeHtml(dog.name)}" onclick="viewPhotoFullscreen('${dog.id}', 0)">
                    </div>
                ` : `
                    <div class="animal-photo-placeholder">
                        ${getAnimalIconLarge(dog.animalType || 'Dog')}
                    </div>
                `}
                <h2>${escapeHtml(dog.name)}</h2>
                <p class="animal-type">${dog.animalType || 'Dog'}</p>
                <p class="animal-owner">Owner: ${escapeHtml(appointment.clientName)}</p>
            </div>
        </div>
        
        <div class="animal-info-grid">
            <div class="info-section card-food">
                <div class="info-section-header">
                    <h3>🍽️ Food</h3>
                    ${todayLog && todayLog.breakfast && todayLog.dinner ? '<span class="status-badge done">✓ Done</span>' : '<span class="status-badge pending">Pending</span>'}
                </div>
                <p class="info-detail">${dog.foodRequirements ? escapeHtml(dog.foodRequirements) : 'No food requirements specified'}</p>
                ${todayLog ? `
                    <div class="info-status">
                        ${todayLog.breakfast ? '<span class="status-item done">Breakfast ✓</span>' : '<span class="status-item pending">Breakfast ⏳</span>'}
                        ${todayLog.dinner ? '<span class="status-item done">Dinner ✓</span>' : '<span class="status-item pending">Dinner ⏳</span>'}
                    </div>
                ` : ''}
            </div>
            
            ${dog.medications ? `
                <div class="info-section card-medication">
                    <div class="info-section-header">
                        <h3>💊 Medications</h3>
                        ${todayLog && todayLog.medications ? '<span class="status-badge done">✓ Given</span>' : '<span class="status-badge urgent">⚠️ Needed</span>'}
                    </div>
                    <p class="info-detail">${formatMedicationsDisplay(dog.medications)}</p>
                    ${todayLog && todayLog.medications ? `<p class="info-log">Today: ${escapeHtml(todayLog.medications)}</p>` : ''}
                </div>
            ` : ''}
            
            <div class="info-section card-exercise">
                <div class="info-section-header">
                    <h3>🚶 Exercise</h3>
                    ${todayLog && todayLog.walks ? '<span class="status-badge done">✓ Done</span>' : ''}
                </div>
                ${todayLog && todayLog.walks ? `<p class="info-log">${escapeHtml(todayLog.walks)}</p>` : '<p class="info-placeholder">No exercise logged today</p>'}
            </div>
            
            ${dog.notes ? `
                <div class="info-section card-notes">
                    <div class="info-section-header">
                        <h3>📋 Special Notes</h3>
                    </div>
                    <p class="info-detail">${escapeHtml(dog.notes)}</p>
                </div>
            ` : ''}
            
            ${todayLog && todayLog.behavior ? `
                <div class="info-section card-behavior">
                    <div class="info-section-header">
                        <h3>👀 Today's Behavior</h3>
                    </div>
                    <p class="info-log">${escapeHtml(todayLog.behavior)}</p>
                </div>
            ` : ''}
            
            <div class="info-section card-details">
                <div class="info-section-header">
                    <h3>${getAnimalIcon('Dog')} Dog Details</h3>
                </div>
                <div class="detail-grid">
                    ${dog.breed ? `<div class="detail-item"><strong>Breed:</strong> ${escapeHtml(dog.breed)}</div>` : ''}
                    ${dog.age ? `<div class="detail-item"><strong>Age:</strong> ${escapeHtml(dog.age)}</div>` : ''}
                    ${dog.weight ? `<div class="detail-item"><strong>Weight:</strong> ${escapeHtml(dog.weight)}</div>` : ''}
                    ${dog.gender ? `<div class="detail-item"><strong>Gender:</strong> ${escapeHtml(dog.gender)}</div>` : ''}
                    ${dog.color ? `<div class="detail-item"><strong>Color:</strong> ${escapeHtml(dog.color)}</div>` : ''}
                    ${dog.vaccinations ? `<div class="detail-item"><strong>Vaccinations:</strong> ${escapeHtml(dog.vaccinations)}</div>` : ''}
                </div>
            </div>
            
            <div class="info-section card-contacts">
                <div class="info-section-header">
                    <h3>📞 Quick Contacts</h3>
                </div>
                <div class="contact-buttons-grid">
                    ${client.phone ? `<button class="contact-btn-action phone" onclick="callContact('${escapeHtml(client.phone)}', 'owner')">
                        <span class="contact-btn-icon">📞</span>
                        <div class="contact-btn-text">
                            <span class="contact-btn-label">Owner</span>
                            <span class="contact-btn-phone">${escapeHtml(client.phone)}</span>
                        </div>
                    </button>` : ''}
                    ${client.vetPhone ? `<button class="contact-btn-action vet" onclick="callContact('${escapeHtml(client.vetPhone)}', 'vet')">
                        <span class="contact-btn-icon">🏥</span>
                        <div class="contact-btn-text">
                            <span class="contact-btn-label">Vet</span>
                            <span class="contact-btn-phone">${escapeHtml(client.vetPhone)}</span>
                        </div>
                    </button>` : ''}
                    ${client.emergencyPhone ? `<button class="contact-btn-action emergency" onclick="callContact('${escapeHtml(client.emergencyPhone)}', 'emergency')">
                        <span class="contact-btn-icon">🚨</span>
                        <div class="contact-btn-text">
                            <span class="contact-btn-label">Emergency</span>
                            <span class="contact-btn-phone">${escapeHtml(client.emergencyPhone)}</span>
                        </div>
                    </button>` : ''}
                </div>
                ${client.email ? `<p class="contact-email">📧 <a href="mailto:${escapeHtml(client.email)}">${escapeHtml(client.email)}</a></p>` : ''}
            </div>
        </div>
    `;
    
    editBtn.onclick = () => {
        closeAnimalInfoModal();
        setTimeout(() => openEditAnimalInfo(appointmentId), 300);
    };
    
    modal.classList.add('active');
}

function closeAnimalInfoModal() {
    document.getElementById('animalInfoModal').classList.remove('active');
}

// Setup backdrop click for animal info modal (no form, so no unsaved check)
document.addEventListener('DOMContentLoaded', () => {
    const animalInfoModal = document.getElementById('animalInfoModal');
    if (animalInfoModal) {
        animalInfoModal.addEventListener('click', (e) => {
            if (e.target === animalInfoModal) {
                closeAnimalInfoModal();
            }
        });
    }
});

// Open Edit Animal Info Modal
function openEditAnimalInfo(appointmentId) {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return;
    
    const client = getClientById(appointment.clientId);
    const dog = client && client.dogs ? client.dogs.find(d => d.id === appointment.dogId) : null;
    
    if (!dog) return;
    
    const modal = document.getElementById('editAnimalInfoModal');
    const modalTitle = document.getElementById('editAnimalInfoTitle');
    
    // Update title with animal name
    if (modalTitle) {
        modalTitle.textContent = `Update Animal Information - ${escapeHtml(dog.name)}`;
    }
    
    // Set animal type
    const animalTypeSelect = document.getElementById('editAnimalType');
    if (animalTypeSelect) {
        animalTypeSelect.value = dog.animalType || 'Dog';
    }
    
    document.getElementById('editAnimalInfoAppointmentId').value = appointmentId;
    document.getElementById('editAnimalInfoDogId').value = dog.id;
    document.getElementById('editAnimalInfoClientId').value = client.id;
    document.getElementById('editFoodRequirements').value = dog.foodRequirements || '';
    document.getElementById('editDogNotes').value = dog.notes || '';
    
    // Setup medication selector
    const selectedMeds = Array.isArray(dog.medications) ? dog.medications : 
                        (dog.medications ? [{ name: dog.medications }] : []);
    renderMedicationSelector('editMedicationsSelector', selectedMeds);
    
    // Store original medications for change tracking
    const medSelector = document.getElementById('editMedicationsSelector');
    if (medSelector) {
        medSelector.dataset.originalMeds = JSON.stringify(selectedMeds);
    }
    
    // Initialize form tracking when modal opens
    trackFormChanges('editAnimalInfoForm');
    
    modal.classList.add('active');
}

async function closeEditAnimalInfoModal() {
    // Check if there are actual changes before showing dialog
    let hasChanges = hasUnsavedChanges('editAnimalInfoForm');
    
    // Also check medication selector
    const medSelector = document.getElementById('editMedicationsSelector');
    if (medSelector) {
        // Get original medications from when modal was opened
        const originalMeds = medSelector.dataset.originalMeds ? 
            JSON.parse(medSelector.dataset.originalMeds) : [];
        if (hasMedicationSelectorChanges && hasMedicationSelectorChanges('editMedicationsSelector', originalMeds)) {
            hasChanges = true;
        }
    }
    
    // Only show dialog if there are changes
    if (hasChanges) {
        const choice = await showUnsavedChangesModal('editAnimalInfoForm', () => {
            const form = document.getElementById('editAnimalInfoForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
                return new Promise(resolve => setTimeout(resolve, 100));
            }
        });
        
        if (choice === 'cancel') {
            return; // Stay on page
        }
        
        // If changes were saved or discarded, continue closing
        if (choice === 'dontsave') {
            resetFormTracking('editAnimalInfoForm');
        }
    }
    
    document.getElementById('editAnimalInfoModal').classList.remove('active');
}

// Setup backdrop click for edit animal info modal
document.addEventListener('DOMContentLoaded', () => {
    const editAnimalInfoModal = document.getElementById('editAnimalInfoModal');
    if (editAnimalInfoModal) {
        setupModalWithTracking('editAnimalInfoModal', 'editAnimalInfoForm', closeEditAnimalInfoModal);
    }
});

// Save edited animal info
function saveAnimalInfo(e) {
    e.preventDefault();
    
    const appointmentId = document.getElementById('editAnimalInfoAppointmentId').value;
    const dogId = document.getElementById('editAnimalInfoDogId').value;
    const clientId = document.getElementById('editAnimalInfoClientId').value;
    const animalType = document.getElementById('editAnimalType').value || 'Dog';
    const foodRequirements = document.getElementById('editFoodRequirements').value;
    const medications = getSelectedMedications('editMedicationsSelector');
    const notes = document.getElementById('editDogNotes').value;
    
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    
    if (client && client.dogs) {
        const dog = client.dogs.find(d => d.id === dogId);
        if (dog) {
            dog.animalType = animalType;
            dog.foodRequirements = foodRequirements;
            dog.medications = medications;
            dog.notes = notes;
            dog.updatedAt = new Date().toISOString();
            
            localStorage.setItem('clients', JSON.stringify(clients));
            
            resetFormTracking('editAnimalInfoForm');
            
            // Only close modal if not being closed with unsaved changes dialog
            if (!currentFormId || currentFormId !== 'editAnimalInfoForm') {
                closeEditAnimalInfoModal();
            }
            loadTodayOperations();
            alert('Animal information updated successfully!');
        }
    }
}

// Call contact helper
function callContact(phone, type) {
    window.location.href = `tel:${phone}`;
}

// View photo in fullscreen
function viewPhotoFullscreen(dogId, photoIndex) {
    const clients = getClients();
    let dog = null;
    let photo = null;
    
    // Find the dog
    for (const client of clients) {
        if (client.dogs) {
            dog = client.dogs.find(d => d.id === dogId);
            if (dog) break;
        }
    }
    
    if (!dog || !dog.documents || !dog.documents[photoIndex]) return;
    
    photo = dog.documents[photoIndex];
    if (!photo.type || !photo.type.startsWith('image/')) return;
    
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.className = 'modal photo-viewer active';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
        <div class="modal-content photo-viewer-content">
            <div class="modal-header">
                <h2>${escapeHtml(photo.name)} - ${escapeHtml(dog.name)}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div style="padding: 2rem; text-align: center; overflow: auto; max-height: 80vh; background: #f5f5f5;">
                <img src="${photo.data}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" alt="${escapeHtml(photo.name)}">
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

window.viewPhotoFullscreen = viewPhotoFullscreen;

// Make functions globally available
window.quickCheckOut = quickCheckOut;
window.loadDepartures = loadDepartures;

// Setup edit form submit
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editAnimalInfoForm');
    if (editForm) {
        editForm.addEventListener('submit', saveAnimalInfo);
    }
});

// Make functions globally available
window.quickCheckIn = quickCheckIn;
window.viewAnimalInfo = viewAnimalInfo;
window.closeAnimalInfoModal = closeAnimalInfoModal;
window.openEditAnimalInfo = openEditAnimalInfo;
window.closeEditAnimalInfoModal = closeEditAnimalInfoModal;
window.callContact = callContact;

// Helper functions
function getAppointments() {
    const appointments = localStorage.getItem('appointments');
    return appointments ? JSON.parse(appointments) : [];
}

function getAppointmentById(id) {
    const appointments = getAppointments();
    return appointments.find(a => a.id === id);
}

function getClientById(id) {
    const clients = localStorage.getItem('clients');
    if (!clients) return null;
    const clientsList = JSON.parse(clients);
    return clientsList.find(c => c.id === id);
}

function getClients() {
    const clients = localStorage.getItem('clients');
    return clients ? JSON.parse(clients) : [];
}

function getCareLogs() {
    const logs = localStorage.getItem('careLogs');
    return logs ? JSON.parse(logs) : [];
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

// Refresh today operations when tab is switched
if (typeof setupTabs !== 'undefined') {
    const originalSetupTabs = setupTabs;
    window.setupTabs = function() {
        originalSetupTabs();
        // Add listener for today tab
        const todayTabBtn = document.querySelector('.tab-btn[data-tab="today"]');
        if (todayTabBtn) {
            todayTabBtn.addEventListener('click', () => {
                setTimeout(loadTodayOperations, 100);
            });
        }
    };
}

