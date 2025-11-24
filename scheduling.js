// Scheduling System

let currentDate = new Date();
let selectedMonth = currentDate.getMonth();
let selectedYear = currentDate.getFullYear();

// Initialize scheduling
document.addEventListener('DOMContentLoaded', () => {
    setupAppointmentModal();
    setupViewToggle();
    setupScheduleFilters();
    setupCalendarNavigation();
    loadAppointments();
    renderTodayAppointments();
    renderCalendar();
    setupDatePopout();
    setupTimePopout();
});

// Setup appointment modal
function setupAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    const addBtn = document.getElementById('addAppointmentBtn');
    const closeBtn = document.getElementById('closeAppointmentModal');
    const cancelBtn = document.getElementById('cancelAppointmentBtn');
    const form = document.getElementById('appointmentForm');
    const clientSelect = document.getElementById('appointmentClient');
    const dogSelect = document.getElementById('appointmentDog');
    const typeHidden = document.getElementById('appointmentType');
    const typeButtons = document.querySelectorAll('.service-type-btn');

    function setServiceType(val) {
        if (typeHidden) typeHidden.value = val;
        typeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.type === val));
    }
    if (typeButtons && typeButtons.length) {
        typeButtons.forEach(btn => btn.addEventListener('click', () => setServiceType(btn.dataset.type)));
        // default
        setServiceType(typeHidden && typeHidden.value ? typeHidden.value : 'boarding');
    }

    // Populate clients dropdown
    function populateClients() {
        const clients = getClients();
        clientSelect.innerHTML = '<option value="">Select Client...</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.familyName;
            clientSelect.appendChild(option);
        });
    }

    // Update dogs dropdown when client changes
    clientSelect.addEventListener('change', () => {
        const clientId = clientSelect.value;
        dogSelect.innerHTML = '<option value="">Select Dog...</option>';
        
        if (clientId) {
            const client = getClientById(clientId);
            if (client && client.dogs) {
                client.dogs.forEach(dog => {
                    const option = document.createElement('option');
                    option.value = dog.id;
                    option.textContent = dog.name || 'Unnamed Dog';
                    dogSelect.appendChild(option);
                });
            }
        }
    });

    // Open modal
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (typeof startAppointmentFlow === 'function') {
                startAppointmentFlow();
            } else {
                populateClients();
                openAppointmentModal();
            }
        });
    }

    // Close modal
    if (closeBtn) closeBtn.addEventListener('click', closeAppointmentModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAppointmentModal);

    if (modal) {
        setupModalWithTracking('appointmentModal', 'appointmentForm', closeAppointmentModal);
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAppointment();
        });
    }
}

// Open appointment modal
function openAppointmentModal(appointment = null, preClientId = null, preDogId = null, preDogName = '') {
    const modal = document.getElementById('appointmentModal');
    const modalTitle = document.getElementById('appointmentModalTitle');
    const form = document.getElementById('appointmentForm');
    const clientSelect = document.getElementById('appointmentClient');
    const dogSelect = document.getElementById('appointmentDog');

    form.reset();
    
    // Always (re)populate client select before potential preselect
    if (clientSelect) {
        const clients = getClients();
        clientSelect.innerHTML = '<option value="">Select Client...</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.familyName;
            clientSelect.appendChild(option);
        });
        clientSelect.disabled = false;
    }
    if (dogSelect) {
        dogSelect.innerHTML = '<option value="">Select Dog...</option>';
        dogSelect.disabled = false;
    }

    if (appointment) {
        modalTitle.textContent = 'Edit Appointment';
        document.getElementById('appointmentId').value = appointment.id;
        document.getElementById('appointmentClient').value = appointment.clientId;
        
        // Trigger dog dropdown update
        document.getElementById('appointmentClient').dispatchEvent(new Event('change'));
        setTimeout(() => {
            document.getElementById('appointmentDog').value = appointment.dogId;
        }, 100);
        
        const typeHidden = document.getElementById('appointmentType');
        if (typeHidden) typeHidden.value = appointment.type || 'boarding';
        const typeButtons = document.querySelectorAll('.service-type-btn');
        typeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.type === (appointment.type || 'boarding')));
        document.getElementById('appointmentStatus').value = appointment.status;
        document.getElementById('appointmentStartDate').value = appointment.startDate;
        document.getElementById('appointmentStartTime').value = appointment.startTime || '';
        document.getElementById('appointmentEndDate').value = appointment.endDate;
        document.getElementById('appointmentEndTime').value = appointment.endTime || '';
        document.getElementById('appointmentNotes').value = appointment.notes || '';
    } else {
        modalTitle.textContent = 'Add Appointment';
        document.getElementById('appointmentId').value = '';
        // Set today as default start date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentStartDate').value = today;
        document.getElementById('appointmentEndDate').value = today;
        // Default type
        const typeHidden = document.getElementById('appointmentType');
        if (typeHidden) typeHidden.value = typeHidden.value || 'boarding';
        const typeButtons = document.querySelectorAll('.service-type-btn');
        typeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.type === (typeHidden.value || 'boarding')));

        // Apply pre-selections from prior steps (client/animal chosen)
        if (preClientId) {
            clientSelect.value = preClientId;
            clientSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                const client = getClientById(preClientId);
                // Replace selects with title style for cleaner look
                const clientGrp = clientSelect.closest('.form-group');
                if (clientGrp) {
                    clientSelect.style.display = 'none';
                    let t = clientGrp.querySelector('.selected-title');
                    if (!t) {
                        t = document.createElement('div');
                        t.className = 'selected-title';
                        clientGrp.appendChild(t);
                    }
                    t.textContent = client ? (client.familyName || client.contactName || 'Selected Client') : 'Selected Client';
                }
                if (preDogId) {
                    dogSelect.value = preDogId;
                    const dogGrp = dogSelect.closest('.form-group');
                    if (dogGrp) {
                        dogSelect.style.display = 'none';
                        let td = dogGrp.querySelector('.selected-title');
                        if (!td) {
                            td = document.createElement('div');
                            td.className = 'selected-title';
                            dogGrp.appendChild(td);
                        }
                        const dog = client && client.dogs ? client.dogs.find(d=>d.id===preDogId) : null;
                        td.textContent = dog ? (dog.name || 'Selected Animal') : 'Selected Animal';
                    }
                }
                // Lock selects to prevent changes (also hidden)
                clientSelect.disabled = true;
                dogSelect.disabled = !!preDogId;
            }, 100);
        }
    }

    // Initialize form tracking when modal opens
    trackFormChanges('appointmentForm');
    
    modal.classList.add('active');
}

// Close appointment modal
async function closeAppointmentModal() {
    const choice = await showUnsavedChangesModal('appointmentForm', () => {
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
            return new Promise(resolve => setTimeout(resolve, 100));
        }
    });
    
    if (choice === 'cancel') {
        return; // Stay on page
    }
    
    // choice is 'saved' or 'dontsave' - proceed to close
    const modal = document.getElementById('appointmentModal');
    modal.classList.remove('active');
    document.getElementById('appointmentForm').reset();
    // Unlock selects for next open
    const clientSelect = document.getElementById('appointmentClient');
    const dogSelect = document.getElementById('appointmentDog');
    if (clientSelect) {
        clientSelect.disabled = false;
        clientSelect.style.display = '';
        const t = clientSelect.closest('.form-group')?.querySelector('.selected-title');
        if (t) t.remove();
    }
    if (dogSelect) {
        dogSelect.disabled = false;
        dogSelect.style.display = '';
        const td = dogSelect.closest('.form-group')?.querySelector('.selected-title');
        if (td) td.remove();
    }
}

// Mobile date popout for small screens
let activeDateField = null; // 'start' | 'end'
function setupDatePopout() {
    const startInput = document.getElementById('appointmentStartDate');
    const endInput = document.getElementById('appointmentEndDate');
    if (!startInput || !endInput) return;

    const openPop = (field) => {
        activeDateField = field;
        const modal = document.getElementById('appointmentDateModal');
        const s = document.getElementById('mobileStartDate');
        const e = document.getElementById('mobileEndDate');
        s.value = document.getElementById('appointmentStartDate').value;
        e.value = document.getElementById('appointmentEndDate').value;
        modal.classList.add('active');
    };

    startInput.addEventListener('focus', () => openPop('start'));
    startInput.addEventListener('click', () => openPop('start'));
    endInput.addEventListener('focus', () => openPop('end'));
    endInput.addEventListener('click', () => openPop('end'));
}

function closeAppointmentDateModal() {
    const modal = document.getElementById('appointmentDateModal');
    if (modal) modal.classList.remove('active');
    activeDateField = null;
}

function saveAppointmentDatesFromPopout() {
    const s = document.getElementById('mobileStartDate').value;
    const e = document.getElementById('mobileEndDate').value;
    if (activeDateField === 'start' || activeDateField === 'end') {
        // If only one was intended, still copy both to keep consistent
        if (s) document.getElementById('appointmentStartDate').value = s;
        if (e) document.getElementById('appointmentEndDate').value = e;
    }
    closeAppointmentDateModal();
}

window.closeAppointmentDateModal = closeAppointmentDateModal;
window.saveAppointmentDatesFromPopout = saveAppointmentDatesFromPopout;

// Time popout
let activeTimeField = null; // 'start' | 'end'
function setupTimePopout() {
    const start = document.getElementById('appointmentStartTime');
    const end = document.getElementById('appointmentEndTime');
    if (!start || !end) return;
    const open = (field) => {
        activeTimeField = field;
        const modal = document.getElementById('appointmentTimeModal');
        const input = document.getElementById('mobileTimeInput');
        input.value = document.getElementById(field === 'start' ? 'appointmentStartTime' : 'appointmentEndTime').value || '';
        modal.classList.add('active');
    };
    start.addEventListener('focus', () => open('start'));
    start.addEventListener('click', () => open('start'));
    end.addEventListener('focus', () => open('end'));
    end.addEventListener('click', () => open('end'));
}

function closeAppointmentTimeModal() {
    const modal = document.getElementById('appointmentTimeModal');
    if (modal) modal.classList.remove('active');
    activeTimeField = null;
}

function setQuickTime(val) {
    const input = document.getElementById('mobileTimeInput');
    input.value = val;
}

function saveAppointmentTimeFromPopout() {
    const val = document.getElementById('mobileTimeInput').value;
    if (activeTimeField === 'start') {
        document.getElementById('appointmentStartTime').value = val;
    } else if (activeTimeField === 'end') {
        document.getElementById('appointmentEndTime').value = val;
    }
    closeAppointmentTimeModal();
}

window.closeAppointmentTimeModal = closeAppointmentTimeModal;
window.saveAppointmentTimeFromPopout = saveAppointmentTimeFromPopout;
window.setQuickTime = setQuickTime;

// Save appointment
function saveAppointment() {
    const appointmentId = document.getElementById('appointmentId').value;
    const clientId = document.getElementById('appointmentClient').value;
    const dogId = document.getElementById('appointmentDog').value;
    
    const client = getClientById(clientId);
    const dog = client && client.dogs ? client.dogs.find(d => d.id === dogId) : null;

    const appointmentData = {
        id: appointmentId || Date.now().toString(),
        clientId: clientId,
        clientName: client ? client.familyName : '',
        dogId: dogId,
        dogName: dog ? dog.name : '',
        dogLastName: dog ? (dog.lastName || client ? client.familyName : '') : '', // Include dog's last name
        type: document.getElementById('appointmentType').value,
        status: document.getElementById('appointmentStatus').value,
        startDate: document.getElementById('appointmentStartDate').value,
        startTime: document.getElementById('appointmentStartTime').value,
        endDate: document.getElementById('appointmentEndDate').value,
        endTime: document.getElementById('appointmentEndTime').value,
        notes: document.getElementById('appointmentNotes').value,
        createdAt: appointmentId ? getAppointmentById(appointmentId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const appointments = getAppointments();
    
    if (appointmentId) {
        const index = appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
            appointments[index] = appointmentData;
        }
    } else {
        appointments.push(appointmentData);
    }

    localStorage.setItem('appointments', JSON.stringify(appointments));
    resetFormTracking('appointmentForm');
    loadAppointments();
    
    // Only close modal if not being closed with unsaved changes dialog
    if (!currentFormId || currentFormId !== 'appointmentForm') {
        closeAppointmentModal();
    }
}

// Get appointments from localStorage
function getAppointments() {
    const appointments = localStorage.getItem('appointments');
    return appointments ? JSON.parse(appointments) : [];
}

// Get appointment by ID
function getAppointmentById(id) {
    const appointments = getAppointments();
    return appointments.find(a => a.id === id);
}

// Load and display appointments
function loadAppointments() {
    renderTodayAppointments();
    renderCalendar();
    renderAppointmentsList();
}

// Render today's appointments
function renderTodayAppointments() {
    const todayContainer = document.getElementById('todayList');
    if (!todayContainer) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const appointments = getAppointments();
    
    // Get today's appointments
    const todayAppointments = appointments.filter(apt => {
        const startDate = new Date(apt.startDate).toISOString().split('T')[0];
        const endDate = new Date(apt.endDate).toISOString().split('T')[0];
        return todayStr >= startDate && todayStr <= endDate;
    });

    // Sort by time
    todayAppointments.sort((a, b) => {
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
    });

    if (todayAppointments.length === 0) {
        todayContainer.innerHTML = `
            <div class="no-appointments-today">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No appointments scheduled for today</p>
            </div>
        `;
        return;
    }

    // Helper function to format status text
    function formatStatus(status) {
        if (!status) return 'Scheduled';
        return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    // Helper function to format type text
    function formatType(type) {
        if (!type || type === 'grooming') return 'Boarding'; // Remove grooming, default to boarding
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    todayContainer.innerHTML = todayAppointments.map(apt => {
        const client = getClientById(apt.clientId);
        const clientPhone = client ? client.phone : '';
        const isCheckedIn = apt.checkedIn === true || apt.checkedIn === 'true';
        const isCheckedOut = apt.checkedOut === true || apt.checkedOut === 'true';
        const appointmentType = apt.type === 'grooming' ? 'boarding' : (apt.type || 'boarding'); // Remove grooming
        const formattedType = formatType(appointmentType);
        const formattedStatus = formatStatus(apt.status || 'scheduled');
        
        return `
            <div class="today-appointment-item">
                <div class="today-appointment-info" onclick="editAppointment('${apt.id}')">
                    <h4>${escapeHtml(apt.clientName || 'Unknown')} - ${escapeHtml(apt.dogName || 'Unknown')}</h4>
                    <div class="today-appointment-details">
                        ${apt.startTime || apt.endTime ? `
                            <p class="appointment-time">
                                <span class="detail-icon">⏰</span>
                                ${apt.startTime || '08:00'}${apt.endTime ? ` - ${apt.endTime}` : ''}
                            </p>
                        ` : ''}
                        ${clientPhone ? `
                            <p class="appointment-contact">
                                <span class="detail-icon">📞</span>
                                <a href="tel:${escapeHtml(clientPhone)}" onclick="event.stopPropagation()" class="contact-link">${escapeHtml(clientPhone)}</a>
                            </p>
                        ` : ''}
                        ${apt.notes ? `
                            <p class="appointment-notes">
                                <span class="notes-label">Special requests:</span> ${escapeHtml(apt.notes.substring(0, 80))}${apt.notes.length > 80 ? '...' : ''}
                            </p>
                        ` : ''}
                    </div>
                </div>
                <div class="today-appointment-actions">
                    <div class="today-appointment-badges">
                        <span class="today-badge type ${appointmentType}">${formattedType}</span>
                        <span class="today-badge status ${apt.status || 'scheduled'}">${formattedStatus}</span>
                        ${isCheckedIn ? '<span class="today-badge status checked-in">Checked In</span>' : ''}
                        ${isCheckedOut ? '<span class="today-badge status checked-out">Checked Out</span>' : ''}
                    </div>
                    <div class="appointment-actions-buttons">
                        ${!isCheckedIn && !isCheckedOut ? `
                            <button class="btn-small btn-primary" onclick="event.stopPropagation(); openCheckinModal('${apt.id}')">Check In</button>
                        ` : ''}
                        ${isCheckedIn && !isCheckedOut ? `
                            <button class="btn-small btn-secondary" onclick="event.stopPropagation(); openCareLogModal('${apt.id}')">Care Log</button>
                            <button class="btn-small btn-primary" onclick="event.stopPropagation(); openCheckinModal('${apt.id}', 'out')">Check Out</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Setup calendar navigation
function setupCalendarNavigation() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        selectedMonth--;
        if (selectedMonth < 0) {
            selectedMonth = 11;
            selectedYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        selectedMonth++;
        if (selectedMonth > 11) {
            selectedMonth = 0;
            selectedYear++;
        }
        renderCalendar();
    });
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('currentMonth').textContent = `${monthNames[selectedMonth]} ${selectedYear}`;

    const appointments = getAppointments();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

    // Clear calendar
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        const currentDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if today
        if (isCurrentMonth && day === today.getDate()) {
            dayCell.classList.add('today');
        }

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Add appointments for this day
        const dayAppointments = appointments.filter(apt => {
            const startDate = new Date(apt.startDate);
            const endDate = new Date(apt.endDate);
            const currentDate = new Date(currentDateStr);
            
            return currentDate >= startDate && currentDate <= endDate;
        });

        if (dayAppointments.length > 0) {
            dayCell.classList.add('has-appointments');
            dayCell.dataset.count = dayAppointments.length;
            dayCell.dataset.date = currentDateStr;
            
            // Show appointment count badge instead of individual appointments
            const countBadge = document.createElement('div');
            countBadge.className = 'appointment-count-badge';
            countBadge.textContent = dayAppointments.length;
            countBadge.title = `${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''}`;
            dayCell.appendChild(countBadge);
            
            // Store appointments data for modal
            dayCell.dataset.appointments = JSON.stringify(dayAppointments.map(apt => apt.id));
            
            // Make entire day cell clickable
            dayCell.style.cursor = 'pointer';
            dayCell.onclick = (e) => {
                e.stopPropagation();
                showDayDetails(currentDateStr, dayAppointments);
            };
        }

        calendarGrid.appendChild(dayCell);
    }
}

// Render appointments list
function renderAppointmentsList() {
    const listContainer = document.getElementById('appointmentsList');
    const appointments = getAppointments().sort((a, b) => {
        return new Date(a.startDate) - new Date(b.startDate);
    });

    if (appointments.length === 0) {
        listContainer.innerHTML = `
            <div class="no-submissions">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No appointments scheduled</p>
                <span>Click "Add Appointment" to schedule a new booking</span>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = appointments.map(appointment => {
        const startDate = new Date(appointment.startDate);
        const endDate = new Date(appointment.endDate);
        const isUpcoming = endDate >= new Date();
        const isPast = endDate < new Date();

        return `
            <div class="submission-card appointment-card ${isPast ? 'past' : ''}" data-type="${appointment.type}" data-status="${appointment.status}">
                <div class="submission-header">
                    <div class="submission-info">
                        <h3>${escapeHtml(appointment.clientName)} - ${escapeHtml(appointment.dogName)}</h3>
                        <p><span class="service-badge ${appointment.type}">${appointment.type}</span> <span class="status-badge ${appointment.status}">${appointment.status}</span></p>
                        <p><strong>Start:</strong> ${formatDate(startDate)} ${appointment.startTime || ''}</p>
                        <p><strong>End:</strong> ${formatDate(endDate)} ${appointment.endTime || ''}</p>
                        ${appointment.notes ? `<p style="margin-top: 0.5rem;">${escapeHtml(appointment.notes)}</p>` : ''}
                    </div>
                    <div class="submission-meta">
                        <span class="submission-date">${isUpcoming ? 'Upcoming' : 'Past'}</span>
                    </div>
                </div>
                <div class="submission-actions">
                    <button class="btn-small btn-contact" onclick="editAppointment('${appointment.id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteAppointment('${appointment.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Format date for display
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Setup view toggle
function setupViewToggle() {
    const viewBtns = document.querySelectorAll('.schedule-view-toggle .view-btn');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all view buttons
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.dataset.view;
            
            // Hide all views
            const todayView = document.getElementById('todayView');
            const listView = document.getElementById('listView');
            const monthView = document.getElementById('monthView');
            
            if (todayView) todayView.style.display = 'none';
            if (listView) listView.style.display = 'none';
            if (monthView) monthView.style.display = 'none';
            
            // Show selected view
            if (view === 'today' && todayView) {
                todayView.style.display = 'block';
                renderTodayAppointments();
            } else if (view === 'list' && listView) {
                listView.style.display = 'block';
                renderAppointmentsList();
            } else if (view === 'month' && monthView) {
                monthView.style.display = 'block';
                renderMonthView();
            }
        });
    });
}

// Render month view of appointments
function renderMonthView() {
    const container = document.getElementById('monthAppointmentsList');
    if (!container) return;
    
    const appointments = getAppointments();
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="no-submissions">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No appointments scheduled</p>
                <span>Click "Add Appointment" to schedule a new booking</span>
            </div>
        `;
        return;
    }
    
    // Group appointments by date
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    appointments.forEach(apt => {
        const startDate = new Date(apt.startDate);
        startDate.setHours(0, 0, 0, 0);
        const dateStr = startDate.toISOString().split('T')[0];
        
        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        grouped[dateStr].push(apt);
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    // Filter to show current month and future appointments
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    const filteredDates = sortedDates.filter(dateStr => {
        const date = new Date(dateStr);
        const month = date.getMonth();
        const year = date.getFullYear();
        return (year === currentYear && month === currentMonth) || date >= today;
    });
    
    if (filteredDates.length === 0) {
        container.innerHTML = `
            <div class="no-submissions">
                <p>No appointments for this month</p>
            </div>
        `;
        return;
    }
    
    // Render grouped appointments
    container.innerHTML = filteredDates.map(dateStr => {
        const date = new Date(dateStr);
        const appointments = grouped[dateStr];
        const dateFormatted = formatDate(date);
        const isToday = dateStr === today.toISOString().split('T')[0];
        
        return `
            <div class="month-appointment-group ${isToday ? 'today-group' : ''}">
                <div class="month-appointment-group-header">
                    ${isToday ? '📅 ' : ''}${dateFormatted}${isToday ? ' (Today)' : ''}
                    <span style="float: right; font-size: 0.85rem; color: var(--text-light);">${appointments.length} appointment${appointments.length > 1 ? 's' : ''}</span>
                </div>
                ${appointments.map(apt => {
                    const startDate = new Date(apt.startDate);
                    const endDate = new Date(apt.endDate);
                    const isUpcoming = endDate >= today;
                    
                    return `
                        <div class="month-appointment-item" onclick="editAppointment('${apt.id}')" style="cursor: pointer;">
                            <div class="month-appointment-info">
                                <h4>${escapeHtml(apt.clientName)} - ${escapeHtml(apt.dogName)}</h4>
                                <p>
                                    <span class="service-badge ${apt.type}">${apt.type}</span>
                                    <span class="status-badge ${apt.status}">${apt.status}</span>
                                    ${apt.startTime ? `<span style="margin-left: 0.5rem;">${apt.startTime}</span>` : ''}
                                </p>
                                ${apt.startDate !== apt.endDate ? `<p style="font-size: 0.8rem;">Ends: ${formatDate(endDate)}</p>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}

// Setup schedule filters
function setupScheduleFilters() {
    const filterBtns = document.querySelectorAll('.schedule-filters .filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        const cards = document.querySelectorAll('.appointment-card');

        cards.forEach(card => {
            if (filter === 'all') {
                card.classList.remove('hidden');
            } else if (filter === 'upcoming') {
                const isUpcoming = !card.classList.contains('past');
                if (isUpcoming) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            } else {
                const type = card.dataset.type;
                if (type === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });
        });
    });
}

// Edit appointment
function editAppointment(id) {
    const appointment = getAppointmentById(id);
    if (appointment) {
        openAppointmentModal(appointment);
    }
}

// Delete appointment
async function deleteAppointment(id) {
    const confirmed = await showConfirm('Delete Appointment', 'Are you sure you want to delete this appointment?');
    if (!confirmed) {
        return;
    }
    
    const appointments = getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(filtered));
    loadAppointments();
}

// Re-render today's appointments when tab is switched
function refreshTodayAppointments() {
    renderTodayAppointments();
}

// Show day details modal
function showDayDetails(dateStr, appointments) {
    const modal = document.getElementById('dayDetailsModal');
    const title = document.getElementById('dayDetailsTitle');
    const content = document.getElementById('dayDetailsContent');
    
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    title.textContent = `Appointments - ${formattedDate}`;
    
    if (appointments.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No appointments for this day.</p>';
    } else {
        // Group appointments by type
        const boarding = appointments.filter(apt => apt.type === 'boarding');
        const grooming = appointments.filter(apt => apt.type === 'grooming');
        const both = appointments.filter(apt => apt.type === 'both');
        
        content.innerHTML = `
            <div class="day-appointments-summary">
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="stat-number">${appointments.length}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    ${boarding.length > 0 ? `
                        <div class="summary-stat">
                            <span class="stat-number">${boarding.length}</span>
                            <span class="stat-label">Boarding</span>
                        </div>
                    ` : ''}
                    ${grooming.length > 0 ? `
                        <div class="summary-stat">
                            <span class="stat-number">${grooming.length}</span>
                            <span class="stat-label">Grooming</span>
                        </div>
                    ` : ''}
                    ${both.length > 0 ? `
                        <div class="summary-stat">
                            <span class="stat-number">${both.length}</span>
                            <span class="stat-label">Both</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="day-appointments-list">
                ${appointments.map(apt => {
                    const startDate = new Date(apt.startDate);
                    const endDate = new Date(apt.endDate);
                    const isMultiDay = apt.startDate !== apt.endDate;
                    const isStart = apt.startDate === dateStr;
                    const isEnd = apt.endDate === dateStr;
                    const isCheckIn = apt.checkedIn && !apt.checkedOut;
                    
                    let dayLabel = '';
                    if (isMultiDay) {
                        if (isStart) dayLabel = 'Arrival';
                        else if (isEnd) dayLabel = 'Departure';
                        else dayLabel = 'Staying';
                    }
                    
                    // Get status badge
                    let statusBadge = '';
                    if (isCheckIn) {
                        statusBadge = '<span class="status-badge checked-in-badge">✓ Checked In</span>';
                    } else if (apt.status === 'confirmed') {
                        statusBadge = '<span class="status-badge confirmed-badge">✓ Confirmed</span>';
                    } else if (apt.status === 'in-progress') {
                        statusBadge = '<span class="status-badge in-progress-badge">In Progress</span>';
                    } else if (apt.status === 'completed') {
                        statusBadge = '<span class="status-badge completed-badge">Completed</span>';
                    } else if (apt.status === 'cancelled') {
                        statusBadge = '<span class="status-badge cancelled-badge">Cancelled</span>';
                    }
                    
                    return `
                        <div class="day-appointment-card ${apt.type} ${apt.status} ${isCheckIn ? 'checked-in' : ''}" onclick="event.stopPropagation(); openAppointmentModal(${JSON.stringify(apt).replace(/"/g, '&quot;')})">
                            <div class="day-appointment-header">
                                <div class="day-appointment-info">
                                    <h4>${escapeHtml(apt.dogName || 'Unnamed')}</h4>
                                    <p>${escapeHtml(apt.clientName)}</p>
                                </div>
                                <div class="day-appointment-badges">
                                    <span class="type-badge ${apt.type}">${apt.type.charAt(0).toUpperCase() + apt.type.slice(1)}</span>
                                    ${dayLabel ? `<span class="day-label">${dayLabel}</span>` : ''}
                                    ${statusBadge}
                                </div>
                            </div>
                            <div class="day-appointment-details">
                                <div class="detail-row">
                                    <span class="detail-icon">📅</span>
                                    <span>${formatDateRange(apt.startDate, apt.endDate)}</span>
                                </div>
                                ${apt.startTime ? `
                                    <div class="detail-row">
                                        <span class="detail-icon">🕐</span>
                                        <span>${apt.startTime}${apt.endTime ? ` - ${apt.endTime}` : ''}</span>
                                    </div>
                                ` : ''}
                                ${apt.notes ? `
                                    <div class="detail-row full-width">
                                        <span class="detail-icon">📝</span>
                                        <span>${escapeHtml(apt.notes)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="day-appointment-actions">
                                <button class="btn-small btn-primary" onclick="event.stopPropagation(); closeDayDetailsModal(); setTimeout(() => openAppointmentModal(${JSON.stringify(apt).replace(/"/g, '&quot;')}), 300)">View/Edit</button>
                                ${!isCheckIn && apt.startDate <= dateStr && apt.endDate >= dateStr ? `
                                    <button class="btn-small btn-secondary" onclick="event.stopPropagation(); closeDayDetailsModal(); setTimeout(() => openCheckinModal('${apt.id}', 'checkin'), 300)">Check In</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    modal.classList.add('active');
}

function closeDayDetailsModal() {
    document.getElementById('dayDetailsModal').classList.remove('active');
}

// Setup backdrop click for day details modal
document.addEventListener('DOMContentLoaded', () => {
    const dayDetailsModal = document.getElementById('dayDetailsModal');
    if (dayDetailsModal) {
        dayDetailsModal.addEventListener('click', (e) => {
            if (e.target === dayDetailsModal) {
                closeDayDetailsModal();
            }
        });
    }
});

function formatDateRange(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (startStr === endStr) {
        return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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

window.showDayDetails = showDayDetails;
window.closeDayDetailsModal = closeDayDetailsModal;

// Make functions globally available
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;

// Helper function to get clients (from clients.js)
function getClients() {
    const clients = localStorage.getItem('clients');
    return clients ? JSON.parse(clients) : [];
}

function getClientById(id) {
    const clients = getClients();
    return clients.find(c => c.id === id);
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

