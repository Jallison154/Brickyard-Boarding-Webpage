// Care Management Functions - Check-in, Care Logs, Alerts

// Get animal placeholder photo (for when no photo is uploaded)
function getAnimalPlaceholderPhoto(animalType, size = 'medium') {
    const type = animalType || 'Dog';
    const iconFile = type === 'Cat' ? 'cat-icon.png' : 'dog-icon.png';
    const sizes = {
        small: '50px',
        medium: '150px',
        large: '200px'
    };
    const photoSize = sizes[size] || sizes.medium;
    return `<img src="resources/images/${iconFile}" alt="${type} placeholder" style="width: 100%; height: 100%; object-fit: contain;">`;
}

// Check-in/Check-out Functions
function openCheckinModal(appointmentId, action = 'in') {
    const appointment = getAppointmentById(appointmentId);
    const modal = document.getElementById('checkinModal');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const dogInfo = document.getElementById('checkinDogInfo');
    
    // Set appointment ID
    document.getElementById('checkinAppointmentId').value = appointmentId;
    
    // Update modal title and buttons
    if (action === 'out') {
        document.getElementById('checkinTitle').textContent = 'Check Out';
        checkInBtn.style.display = 'none';
        checkOutBtn.style.display = 'block';
        checkOutBtn.textContent = 'Confirm Check Out';
    } else {
        document.getElementById('checkinTitle').textContent = 'Check In';
        checkInBtn.style.display = 'block';
        checkOutBtn.style.display = 'none';
        checkInBtn.textContent = 'Confirm Check In';
    }
    
    // Set dog info
    if (appointment) {
        dogInfo.textContent = `${appointment.clientName} - ${appointment.dogName}`;
        
        // Pre-fill existing data
        if (appointment.checkinDateTime) {
            document.getElementById('checkinDate').value = appointment.checkinDateTime;
        }
        if (appointment.checkoutDateTime) {
            document.getElementById('checkoutDate').value = appointment.checkoutDateTime;
        }
        if (appointment.checkinNotes) {
            document.getElementById('checkinNotes').value = appointment.checkinNotes;
        }
        
        // Set default times
        if (!appointment.checkinDateTime) {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('checkinDate').value = localDateTime;
        }
    }
    
    // Setup backdrop click with change tracking
    setupModalWithTracking('checkinModal', 'checkinForm', closeCheckinModal);
    
    modal.classList.add('active');
}

async function closeCheckinModal() {
    // Note: Check-in/out forms don't use standard form submission, so we can't auto-save
    // Just check if user wants to discard changes
    if (hasUnsavedChanges('checkinForm')) {
        const choice = await showUnsavedChangesModal('checkinForm', null);
        if (choice === 'cancel') {
            return; // Stay on page
        }
        // If save was requested but no callback, just discard (can't auto-save check-in)
        resetFormTracking('checkinForm');
    }
    document.getElementById('checkinModal').classList.remove('active');
    document.getElementById('checkinForm').reset();
}

function checkIn() {
    const appointmentId = document.getElementById('checkinAppointmentId').value;
    const checkinDateTime = document.getElementById('checkinDate').value;
    const notes = document.getElementById('checkinNotes').value;
    
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
        appointment.checkedIn = true;
        appointment.checkedOut = false;
        appointment.checkinDateTime = checkinDateTime;
        appointment.checkinNotes = notes;
        appointment.status = 'in-progress';
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        resetFormTracking('checkinForm');
        loadAppointments();
        closeCheckinModal();
    }
}

function checkOut() {
    const appointmentId = document.getElementById('checkinAppointmentId').value;
    const checkoutDateTime = document.getElementById('checkoutDate').value;
    const notes = document.getElementById('checkinNotes').value;
    
    const appointments = getAppointments();
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
        appointment.checkedOut = true;
        appointment.checkoutDateTime = checkoutDateTime || new Date().toISOString();
        if (notes && !appointment.checkoutNotes) {
            appointment.checkoutNotes = notes;
        }
        appointment.status = 'completed';
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        resetFormTracking('checkinForm');
        loadAppointments();
        closeCheckinModal();
        
        alert('Check-out complete! Consider generating a stay report for the owner.');
    }
}

// Care Log Functions
function openCareLogModal(appointmentId) {
    const appointment = getAppointmentById(appointmentId);
    const modal = document.getElementById('careLogModal');
    const dogInfo = document.getElementById('careLogDogInfo');
    
    // Set appointment ID and date
    document.getElementById('careLogAppointmentId').value = appointmentId;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('careLogDate').value = today;
    
    // Set dog info
    if (appointment) {
        dogInfo.textContent = `${appointment.clientName} - ${appointment.dogName}`;
        
        // Load existing care log for today if available
        const careLogs = getCareLogs();
        const todayLog = careLogs.find(log => 
            log.appointmentId === appointmentId && log.date === today
        );
        
        if (todayLog) {
            document.getElementById('breakfast').checked = todayLog.breakfast || false;
            document.getElementById('dinner').checked = todayLog.dinner || false;
            document.getElementById('medications').value = todayLog.medications || '';
            document.getElementById('walks').value = todayLog.walks || '';
            document.getElementById('behavior').value = todayLog.behavior || '';
            document.getElementById('careNotes').value = todayLog.notes || '';
        } else {
            // Reset form
            document.getElementById('careLogForm').reset();
            document.getElementById('careLogAppointmentId').value = appointmentId;
            document.getElementById('careLogDate').value = today;
        }
    }
    
    // Setup backdrop click with change tracking
    setupModalWithTracking('careLogModal', 'careLogForm', closeCareLogModal);
    
    modal.classList.add('active');
}

async function closeCareLogModal() {
    const choice = await showUnsavedChangesModal('careLogForm', () => {
        const form = document.getElementById('careLogForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
            return new Promise(resolve => setTimeout(resolve, 100));
        }
    });
    
    if (choice === 'cancel') {
        return; // Stay on page
    }
    
    // choice is 'saved' or 'dontsave' - proceed to close
    document.getElementById('careLogModal').classList.remove('active');
}

// Save care log
document.addEventListener('DOMContentLoaded', () => {
    const careLogForm = document.getElementById('careLogForm');
    if (careLogForm) {
        careLogForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveCareLog();
        });
    }
});

function saveCareLog() {
    const appointmentId = document.getElementById('careLogAppointmentId').value;
    const date = document.getElementById('careLogDate').value;
    
    const careLog = {
        appointmentId: appointmentId,
        date: date,
        breakfast: document.getElementById('breakfast').checked,
        dinner: document.getElementById('dinner').checked,
        medications: document.getElementById('medications').value,
        walks: document.getElementById('walks').value,
        behavior: document.getElementById('behavior').value,
        notes: document.getElementById('careNotes').value,
        timestamp: new Date().toISOString()
    };
    
    const careLogs = getCareLogs();
    // Remove existing log for this appointment and date
    const filtered = careLogs.filter(log => 
        !(log.appointmentId === appointmentId && log.date === date)
    );
    filtered.push(careLog);
    localStorage.setItem('careLogs', JSON.stringify(filtered));
    
    resetFormTracking('careLogForm');
    
    // Only close modal if not being closed with unsaved changes dialog
    if (!currentFormId || currentFormId !== 'careLogForm') {
        closeCareLogModal();
    }
    alert('Care log saved successfully!');
}

function getCareLogs() {
    const logs = localStorage.getItem('careLogs');
    return logs ? JSON.parse(logs) : [];
}

// Make functions globally available
window.openCheckinModal = openCheckinModal;
window.closeCheckinModal = closeCheckinModal;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.openCareLogModal = openCareLogModal;
window.closeCareLogModal = closeCareLogModal;

// Quick Access Functions
function showQuickAccess(type) {
    const modal = document.getElementById('quickAccessModal');
    const content = document.getElementById('quickAccessContent');
    
    if (type === 'vet') {
        document.getElementById('quickAccessTitle').textContent = 'Veterinarian Information';
        
        const appointments = getAppointments();
        
        // Filter for only checked-in animals (not checked out)
        const checkedInAnimals = appointments.filter(apt => {
            const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
            const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
            return isCheckedIn && !isCheckedOut;
        });
        
        if (checkedInAnimals.length === 0) {
            content.innerHTML = '<p>No animals currently checked in.</p>';
        } else {
            const vetList = checkedInAnimals.map(apt => {
                const client = getClientById(apt.clientId);
                const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
                const animalType = dog && dog.animalType ? dog.animalType : 'Dog';
                
                // Get first photo if available
                const firstPhoto = dog && dog.documents && dog.documents.length > 0 ? 
                    dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
                
                const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
                
                return {
                    client: apt.clientName,
                    dog: apt.dogName,
                    animalType: animalType,
                    photo: firstPhoto,
                    animalEmoji: animalEmoji,
                    vet: client ? client.vetName : 'Not provided',
                    vetPhone: client ? client.vetPhone : 'Not provided',
                    emergency: client ? client.emergencyContact : 'Not provided',
                    emergencyPhone: client ? client.emergencyPhone : 'Not provided'
                };
            });
            
            content.innerHTML = vetList.map(info => `
                <div class="quick-access-item">
                    <div class="vet-info-header">
                        <div class="vet-animal-photo">
                            ${info.photo ? `
                                <img src="${info.photo.data}" alt="${escapeHtml(info.dog)}" class="vet-photo-img">
                            ` : `
                                <div class="vet-photo-placeholder ${info.animalType.toLowerCase()}">
                                    ${getAnimalPlaceholderPhoto(info.animalType, 'medium')}
                                </div>
                            `}
                        </div>
                        <div class="vet-animal-info">
                            <h3 class="vet-animal-name">${escapeHtml(info.dog)}</h3>
                            <p class="vet-client-name">Owner: ${escapeHtml(info.client)}</p>
                        </div>
                    </div>
                    <p><strong>Vet:</strong> ${escapeHtml(info.vet)}</p>
                    ${info.vetPhone !== 'Not provided' ? `<p><strong>Vet Phone:</strong> <a href="tel:${escapeHtml(info.vetPhone)}">${escapeHtml(info.vetPhone)}</a></p>` : ''}
                    <p><strong>Emergency Contact:</strong> ${escapeHtml(info.emergency || 'Not provided')}</p>
                    ${info.emergencyPhone !== 'Not provided' ? `<p><strong>Emergency Phone:</strong> <a href="tel:${escapeHtml(info.emergencyPhone)}">${escapeHtml(info.emergencyPhone)}</a></p>` : ''}
                    <hr style="margin: 1rem 0; border: 1px solid #e0e0e0;">
                </div>
            `).join('');
        }
    } else if (type === 'schedule') {
        document.getElementById('quickAccessTitle').textContent = 'Schedule Check-In';
        
        // Get all clients with their animals
        const clients = getClients();
        
        if (clients.length === 0) {
            content.innerHTML = '<p>No clients found. Please add a client first.</p>';
        } else {
            // Create a form to schedule check-in
            content.innerHTML = `
                <form id="quickScheduleForm" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label for="scheduleClient">Client *</label>
                        <select id="scheduleClient" required onchange="updateScheduleDogs()">
                            <option value="">Select Client...</option>
                            ${clients.map(client => `
                                <option value="${client.id}">${escapeHtml(client.familyName)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleDog">Animal *</label>
                        <select id="scheduleDog" required>
                            <option value="">Select Animal...</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="scheduleStartDate">Check-In Date *</label>
                            <input type="date" id="scheduleStartDate" required>
                        </div>
                        <div class="form-group">
                            <label for="scheduleStartTime">Check-In Time</label>
                            <input type="time" id="scheduleStartTime">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="scheduleEndDate">Expected Departure Date</label>
                            <input type="date" id="scheduleEndDate">
                        </div>
                        <div class="form-group">
                            <label for="scheduleEndTime">Departure Time</label>
                            <input type="time" id="scheduleEndTime">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="scheduleType">Service Type *</label>
                        <select id="scheduleType" required>
                            <option value="boarding">Boarding</option>
                            <option value="grooming">Grooming</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleNotes">Notes</label>
                        <textarea id="scheduleNotes" rows="3" placeholder="Any special instructions or notes..."></textarea>
                    </div>
                    <div class="form-group" style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeQuickAccessModal()" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Schedule Check-In</button>
                    </div>
                </form>
            `;
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('scheduleStartDate').value = today;
            
            // Setup form submission
            const form = document.getElementById('quickScheduleForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleQuickScheduleSubmit();
                });
            }
        }
    }
    
    modal.classList.add('active');
}

// Make updateScheduleDogs globally available
window.updateScheduleDogs = updateScheduleDogs;

// Update dog dropdown when client is selected
function updateScheduleDogs() {
    const clientId = document.getElementById('scheduleClient')?.value;
    const dogSelect = document.getElementById('scheduleDog');
    
    if (!dogSelect) return;
    
    dogSelect.innerHTML = '<option value="">Select Animal...</option>';
    
    if (clientId) {
        const client = getClientById(clientId);
        if (client && client.dogs) {
            client.dogs.forEach(dog => {
                const option = document.createElement('option');
                option.value = dog.id;
                option.textContent = `${dog.name || 'Unnamed'} (${dog.animalType || 'Dog'})`;
                dogSelect.appendChild(option);
            });
        }
    }
}

// Handle quick schedule form submission
function handleQuickScheduleSubmit() {
    const clientId = document.getElementById('scheduleClient').value;
    const dogId = document.getElementById('scheduleDog').value;
    const startDate = document.getElementById('scheduleStartDate').value;
    const startTime = document.getElementById('scheduleStartTime').value || '';
    const endDate = document.getElementById('scheduleEndDate').value || startDate;
    const endTime = document.getElementById('scheduleEndTime').value || '';
    const type = document.getElementById('scheduleType').value;
    const notes = document.getElementById('scheduleNotes').value;
    
    const client = getClientById(clientId);
    const dog = client && client.dogs ? client.dogs.find(d => d.id === dogId) : null;
    
    if (!client || !dog) {
        alert('Please select a valid client and animal.');
        return;
    }
    
    // Create appointment
    const appointmentData = {
        id: Date.now().toString(),
        clientId: clientId,
        clientName: client.familyName,
        dogId: dogId,
        dogName: dog.name || 'Unnamed',
        dogLastName: dog.lastName || client.familyName, // Include dog's last name
        type: type,
        status: 'confirmed',
        startDate: startDate,
        startTime: startTime,
        endDate: endDate,
        endTime: endTime,
        notes: notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const appointments = getAppointments();
    appointments.push(appointmentData);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // Refresh schedules
    if (typeof loadAppointments === 'function') {
        loadAppointments();
    }
    
    // Close modal
    closeQuickAccessModal();
    
    // Show success message
    alert(`Check-in scheduled for ${dog.name} on ${new Date(startDate).toLocaleDateString()}!`);
}

function closeQuickAccessModal() {
    document.getElementById('quickAccessModal').classList.remove('active');
}

// Setup backdrop click for quick access modal
document.addEventListener('DOMContentLoaded', () => {
    const quickAccessModal = document.getElementById('quickAccessModal');
    if (quickAccessModal) {
        quickAccessModal.addEventListener('click', (e) => {
            if (e.target === quickAccessModal) {
                closeQuickAccessModal();
            }
        });
    }
});

window.showQuickAccess = showQuickAccess;
window.closeQuickAccessModal = closeQuickAccessModal;

// Vaccination Alert Functions
function checkVaccinationAlerts() {
    const appointments = getAppointments();
    const clients = getClients();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const oneMonthFromNowStr = oneMonthFromNow.toISOString().split('T')[0];
    
    // Get scheduled arrivals (not checked in yet, within next month)
    const scheduledArrivals = appointments.filter(apt => {
        if (apt.checkedIn || apt.checkedOut) return false;
        if (!apt.startDate) return false;
        const startDate = new Date(apt.startDate).toISOString().split('T')[0];
        return startDate >= todayStr && startDate <= oneMonthFromNowStr;
    });
    
    // Get currently checked-in animals
    const checkedInAnimals = appointments.filter(apt => {
        const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
        const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
        return isCheckedIn && !isCheckedOut;
    });
    
    // Show in modal
    const modal = document.getElementById('quickAccessModal');
    const content = document.getElementById('quickAccessContent');
    
    document.getElementById('quickAccessTitle').textContent = 'Vaccination Status';
    
    // Filter for today by default
    const todayArrivals = scheduledArrivals.filter(apt => {
        const startDate = new Date(apt.startDate).toISOString().split('T')[0];
        return startDate === todayStr;
    });
    
    // Add filter buttons (today is default/active)
    const filterHtml = `
        <div class="vaccination-filters" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--bg-light);">
            <button class="vaccination-filter-btn" data-filter="all" onclick="filterVaccinations('all')">All</button>
            <button class="vaccination-filter-btn active" data-filter="today" onclick="filterVaccinations('today')">Today</button>
            <button class="vaccination-filter-btn" data-filter="week" onclick="filterVaccinations('week')">This Week</button>
            <button class="vaccination-filter-btn" data-filter="month" onclick="filterVaccinations('month')">This Month</button>
        </div>
    `;
    
    // Store original data for filtering
    window._vaccinationData = {
        scheduledArrivals: scheduledArrivals,
        checkedInAnimals: checkedInAnimals,
        today: today,
        todayStr: todayStr
    };
    
    let html = filterHtml;
    
    // Section 1: Scheduled Arrivals (show today's by default)
    if (todayArrivals.length > 0) {
        html += '<h3 style="margin: 0 0 1rem 0; color: var(--text-dark); font-size: 1.2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);" class="arrivals-section-header">📅 Scheduled Arrivals</h3>';
        html += '<div id="vaccinationArrivalsSection">';
        
        const arrivalList = todayArrivals.map(apt => {
            const client = getClientById(apt.clientId);
            const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
            
            if (!dog) return null;
            
            // Get first photo
            const firstPhoto = dog.documents && dog.documents.length > 0 ? 
                dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
            const animalType = dog.animalType || 'Dog';
            const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
            
            // Check rabies expiration
            let rabiesStatus = '⚠️ No date';
            let rabiesClass = 'status-pending';
            if (dog.rabiesExpiration) {
                const expDate = new Date(dog.rabiesExpiration);
                const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntil < 0) {
                    rabiesStatus = `❌ Expired ${Math.abs(daysUntil)} days ago`;
                    rabiesClass = 'status-expired';
                } else if (daysUntil <= 30) {
                    rabiesStatus = `⚠️ Expires in ${daysUntil} days`;
                    rabiesClass = 'status-warning';
                } else {
                    rabiesStatus = `✓ Expires ${new Date(dog.rabiesExpiration).toLocaleDateString()}`;
                    rabiesClass = 'status-good';
                }
            }
            
            return `
                <div class="quick-access-item">
                    <div class="vet-info-header">
                        <div class="vet-animal-photo">
                            ${firstPhoto ? `
                                <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}" class="vet-photo-img">
                            ` : `
                                <div class="vet-photo-placeholder ${animalType.toLowerCase()}">
                                    ${getAnimalPlaceholderPhoto(animalType, 'medium')}
                                </div>
                            `}
                        </div>
                        <div class="vet-animal-info">
                            <h3 class="vet-animal-name">${escapeHtml(apt.dogName)}</h3>
                            <p class="vet-client-name">Owner: ${escapeHtml(apt.clientName)}</p>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <p><strong>Rabies:</strong> <span class="${rabiesClass}" style="font-weight: 600;">${rabiesStatus}</span></p>
                        ${dog.vaccinations ? `<p><strong>Other Vaccines:</strong> ${escapeHtml(dog.vaccinations)}</p>` : ''}
                    </div>
                </div>
            `;
        }).filter(item => item !== null);
        
        html += arrivalList.join('');
        html += '</div>';
    } else {
        html += '<h3 style="margin: 0 0 1rem 0; color: var(--text-dark); font-size: 1.2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);" class="arrivals-section-header">📅 Scheduled Arrivals</h3>';
        html += '<div id="vaccinationArrivalsSection"><p style="margin-bottom: 1.5rem; color: var(--text-light);">No scheduled arrivals for today.</p></div>';
    }
    
    // Show message if there are arrivals in other time periods
    if (scheduledArrivals.length > 0 && todayArrivals.length === 0) {
        html = html.replace('No scheduled arrivals for today.', 'No scheduled arrivals for today. Use the filter buttons to view other time periods.');
    }
    
    // Section 2: Currently Checked In
    if (checkedInAnimals.length > 0) {
        html += '<h3 style="margin: 2rem 0 1rem 0; color: var(--text-dark); font-size: 1.2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);" class="checkedin-section-header">✓ Currently Checked In</h3>';
        html += '<div id="vaccinationCheckedInSection">';
        
        const checkedInList = checkedInAnimals.map(apt => {
            const client = getClientById(apt.clientId);
            const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
            
            if (!dog) return null;
            
            // Get first photo
            const firstPhoto = dog.documents && dog.documents.length > 0 ? 
                dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
            const animalType = dog.animalType || 'Dog';
            const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
            
            // Check rabies expiration
            let rabiesStatus = '⚠️ No date';
            let rabiesClass = 'status-pending';
            if (dog.rabiesExpiration) {
                const expDate = new Date(dog.rabiesExpiration);
                const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntil < 0) {
                    rabiesStatus = `❌ Expired ${Math.abs(daysUntil)} days ago`;
                    rabiesClass = 'status-expired';
                } else if (daysUntil <= 30) {
                    rabiesStatus = `⚠️ Expires in ${daysUntil} days`;
                    rabiesClass = 'status-warning';
                } else {
                    rabiesStatus = `✓ Expires ${new Date(dog.rabiesExpiration).toLocaleDateString()}`;
                    rabiesClass = 'status-good';
                }
            }
            
            return `
                <div class="quick-access-item">
                    <div class="vet-info-header">
                        <div class="vet-animal-photo">
                            ${firstPhoto ? `
                                <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}" class="vet-photo-img">
                            ` : `
                                <div class="vet-photo-placeholder ${animalType.toLowerCase()}">
                                    ${getAnimalPlaceholderPhoto(animalType, 'medium')}
                                </div>
                            `}
                        </div>
                        <div class="vet-animal-info">
                            <h3 class="vet-animal-name">${escapeHtml(apt.dogName)}</h3>
                            <p class="vet-client-name">Owner: ${escapeHtml(apt.clientName)}</p>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem;">
                        <p><strong>Rabies:</strong> <span class="${rabiesClass}" style="font-weight: 600;">${rabiesStatus}</span></p>
                        ${dog.vaccinations ? `<p><strong>Other Vaccines:</strong> ${escapeHtml(dog.vaccinations)}</p>` : ''}
                    </div>
                </div>
            `;
        }).filter(item => item !== null);
        
        html += checkedInList.join('');
        html += '</div>';
    } else {
        html += '<h3 style="margin: 2rem 0 1rem 0; color: var(--text-dark); font-size: 1.2rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);" class="checkedin-section-header">✓ Currently Checked In</h3>';
        html += '<div id="vaccinationCheckedInSection"><p style="margin-bottom: 1.5rem; color: var(--text-light);">No animals currently checked in.</p></div>';
    }
    
    if (scheduledArrivals.length === 0 && checkedInAnimals.length === 0) {
        content.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>No scheduled arrivals or checked-in animals.</p></div>';
    } else {
        content.innerHTML = html;
    }
    
    modal.classList.add('active');
}

// Filter vaccinations by time period
function filterVaccinations(filter) {
    if (!window._vaccinationData) return;
    
    const { scheduledArrivals, checkedInAnimals, today, todayStr } = window._vaccinationData;
    
    // Update active filter button
    document.querySelectorAll('.vaccination-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.vaccination-filter-btn[data-filter="${filter}"]`)?.classList.add('active');
    
    // Calculate date ranges
    let filteredArrivals = scheduledArrivals;
    
    if (filter === 'today') {
        filteredArrivals = scheduledArrivals.filter(apt => {
            const startDate = new Date(apt.startDate).toISOString().split('T')[0];
            return startDate === todayStr;
        });
    } else if (filter === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekFromNowStr = weekFromNow.toISOString().split('T')[0];
        filteredArrivals = scheduledArrivals.filter(apt => {
            const startDate = new Date(apt.startDate).toISOString().split('T')[0];
            return startDate >= todayStr && startDate <= weekFromNowStr;
        });
    } else if (filter === 'month') {
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const oneMonthFromNowStr = oneMonthFromNow.toISOString().split('T')[0];
        filteredArrivals = scheduledArrivals.filter(apt => {
            const startDate = new Date(apt.startDate).toISOString().split('T')[0];
            return startDate >= todayStr && startDate <= oneMonthFromNowStr;
        });
    }
    // 'all' shows everything (already filtered to next month)
    
    // Re-render arrivals section
    const arrivalsSection = document.getElementById('vaccinationArrivalsSection');
    if (arrivalsSection) {
        if (filteredArrivals.length === 0) {
            arrivalsSection.innerHTML = '<p style="margin-bottom: 1.5rem; color: var(--text-light);">No scheduled arrivals for this period.</p>';
        } else {
            arrivalsSection.innerHTML = filteredArrivals.map(apt => {
                const client = getClientById(apt.clientId);
                const dog = client && client.dogs ? client.dogs.find(d => d.id === apt.dogId) : null;
                
                if (!dog) return null;
                
                const firstPhoto = dog.documents && dog.documents.length > 0 ? 
                    dog.documents.find(doc => doc.type && doc.type.startsWith('image/')) : null;
                const animalType = dog.animalType || 'Dog';
                const animalEmoji = animalType === 'Cat' ? '🐱' : '🐶';
                
                let rabiesStatus = '⚠️ No date';
                let rabiesClass = 'status-pending';
                if (dog.rabiesExpiration) {
                    const expDate = new Date(dog.rabiesExpiration);
                    const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                    if (daysUntil < 0) {
                        rabiesStatus = `❌ Expired ${Math.abs(daysUntil)} days ago`;
                        rabiesClass = 'status-expired';
                    } else if (daysUntil <= 30) {
                        rabiesStatus = `⚠️ Expires in ${daysUntil} days`;
                        rabiesClass = 'status-warning';
                    } else {
                        rabiesStatus = `✓ Expires ${new Date(dog.rabiesExpiration).toLocaleDateString()}`;
                        rabiesClass = 'status-good';
                    }
                }
                
                return `
                    <div class="quick-access-item">
                        <div class="vet-info-header">
                            <div class="vet-animal-photo">
                                ${firstPhoto ? `
                                    <img src="${firstPhoto.data}" alt="${escapeHtml(apt.dogName)}" class="vet-photo-img">
                                ` : `
                                    <div class="vet-photo-placeholder ${animalType.toLowerCase()}">
                                        ${animalEmoji}
                                    </div>
                                `}
                            </div>
                            <div class="vet-animal-info">
                                <h3 class="vet-animal-name">${escapeHtml(apt.dogName)}</h3>
                                <p class="vet-client-name">Owner: ${escapeHtml(apt.clientName)}</p>
                            </div>
                        </div>
                        <div style="margin-top: 0.75rem;">
                            <p><strong>Rabies:</strong> <span class="${rabiesClass}" style="font-weight: 600;">${rabiesStatus}</span></p>
                            ${dog.vaccinations ? `<p><strong>Other Vaccines:</strong> ${escapeHtml(dog.vaccinations)}</p>` : ''}
                        </div>
                    </div>
                `;
            }).filter(item => item !== null).join('');
        }
    }
}

window.checkVaccinationAlerts = checkVaccinationAlerts;
window.filterVaccinations = filterVaccinations;

// Helper function to escape HTML
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

