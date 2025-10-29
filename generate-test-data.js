// Generate Test Data for Brickyard Boarding Kennel
// Run this in the browser console to populate with test data

// Helper function to generate a placeholder animal photo as base64
function generatePlaceholderDogPhoto(animalName, breed, animalType = 'Dog') {
    const seed = animalName.replace(/\s/g, '').toLowerCase() + Math.random().toString(36).substring(7);
    const width = 400;
    const height = 400;
    
    // Determine emoji and gradient colors based on animal type
    let emoji, gradientStart, gradientEnd;
    if (animalType === 'Cat') {
        emoji = '🐱';
        // Warm orange/pink gradient for cats (like orange tabby colors)
        gradientStart = '#FF8A65'; // Light orange
        gradientEnd = '#E64A19'; // Deep orange
    } else {
        emoji = '🐕';
        // Brown gradient for dogs (original style)
        gradientStart = '#8B7355'; // Brown
        gradientEnd = '#D4A574'; // Light brown
    }
    
    // Return a data URL for a simple placeholder SVG
    // In production, you could fetch from an API and convert to base64
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad${seed})"/>
            ${animalType === 'Cat' ? `
                <!-- Cat face shape (triangle ears + round head) -->
                <polygon points="200,80 230,140 170,140" fill="#fff" opacity="0.2"/>
                <polygon points="200,80 170,140 110,140" fill="#fff" opacity="0.15"/>
                <polygon points="200,80 230,140 290,140" fill="#fff" opacity="0.15"/>
                <circle cx="200" cy="160" r="60" fill="#fff" opacity="0.2"/>
            ` : `
                <!-- Dog face shape (original) -->
                <circle cx="150" cy="130" r="40" fill="#fff" opacity="0.3"/>
                <circle cx="250" cy="130" r="40" fill="#fff" opacity="0.3"/>
                <ellipse cx="200" cy="220" rx="80" ry="60" fill="#fff" opacity="0.2"/>
            `}
            <text x="200" y="300" font-family="Arial, sans-serif" font-size="24" fill="#fff" text-anchor="middle" opacity="0.8">${emoji}</text>
            <text x="200" y="350" font-family="Arial, sans-serif" font-size="16" fill="#fff" text-anchor="middle" opacity="0.6">${(animalName || animalType).replace(/[&<>"']/g, '')}</text>
        </svg>
    `.trim();
    
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return {
        name: `${animalName || animalType}_photo.svg`,
        type: 'image/svg+xml',
        data: `data:image/svg+xml;base64,${base64}`,
        uploadedDate: new Date().toISOString()
    };
}

// Helper to fetch a random dog photo from an API (optional - uses placeholder if fails)
async function fetchRandomDogPhoto(dogName, breed) {
    try {
        // Try using dog.ceo API (free, no key required)
        const response = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await response.json();
        
        if (data.status === 'success' && data.message) {
            // Fetch the image and convert to base64
            const imgResponse = await fetch(data.message);
            const blob = await imgResponse.blob();
            
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: `${dogName || 'Dog'}_photo.jpg`,
                        type: blob.type || 'image/jpeg',
                        data: reader.result,
                        uploadedDate: new Date().toISOString()
                    });
                };
                reader.onerror = () => {
                    // Fallback to placeholder (defaults to Dog)
                    resolve(generatePlaceholderDogPhoto(dogName, breed, 'Dog'));
                };
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        console.warn('Could not fetch animal photo, using placeholder:', error);
    }
    
    // Fallback to placeholder (defaults to Dog)
    return generatePlaceholderDogPhoto(dogName, breed, 'Dog');
}

// Synchronous version that always uses placeholder (faster for bulk generation)
function getDogPhotoForTest(animalName, breed, index, animalType = 'Dog') {
    // Use placeholder for speed, but vary the appearance based on animal type
    return generatePlaceholderDogPhoto(animalName, breed, animalType);
}

function generateTestData() {
    const dogBreeds = [
        'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Beagle',
        'French Bulldog', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
        'Siberian Husky', 'Shih Tzu', 'Boxer', 'Border Collie', 'Great Dane',
        'Australian Shepherd', 'Pomeranian', 'Cocker Spaniel', 'Chihuahua', 'Maltese'
    ];
    
    const catBreeds = [
        'Domestic Shorthair', 'Domestic Longhair', 'Siamese', 'Persian', 'Maine Coon',
        'Bengal', 'British Shorthair', 'Ragdoll', 'Scottish Fold', 'Russian Blue',
        'American Shorthair', 'Abyssinian', 'Sphynx', 'Burmese', 'Exotic Shorthair'
    ];
    
    const dogNames = [
        'Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Lucy', 'Buddy', 'Daisy', 'Rocky', 'Molly',
        'Bailey', 'Sadie', 'Tucker', 'Lola', 'Bear', 'Zoe', 'Duke', 'Stella', 'Jack', 'Mia',
        'Oliver', 'Ruby', 'Bentley', 'Penny', 'Leo', 'Coco', 'Zeus', 'Rosie', 'Milo', 'Lily'
    ];
    
    const catNames = [
        'Whiskers', 'Shadow', 'Mittens', 'Smokey', 'Tiger', 'Luna', 'Bella', 'Oreo', 'Simba', 'Chloe',
        'Milo', 'Luna', 'Oliver', 'Lucy', 'Charlie', 'Daisy', 'Max', 'Bella', 'Lily', 'Coco',
        'Sophie', 'Princess', 'Ginger', 'Jasper', 'Lucky', 'Angel', 'Misty', 'Midnight', 'Salem', 'Pepper'
    ];
    
    const firstNames = dogNames.concat(catNames); // Combined for backwards compatibility
    
    const humanFirstNames = [
        'John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Robert', 'Karen',
        'James', 'Jennifer', 'Michael', 'Amanda', 'William', 'Jessica', 'Richard', 'Michelle', 'Joseph', 'Melissa',
        'Thomas', 'Nancy', 'Joseph', 'Laura', 'Daniel', 'Melissa', 'Matthew', 'Amy', 'Anthony', 'Angela'
    ];
    
    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris'
    ];
    
    const services = ['Boarding', 'Grooming', 'Day Care', 'Training'];
    const baseTimestamp = Date.now();
    
    // Load existing data (if any) to merge
    const existingClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const existingSubmissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    const existingCareLogs = JSON.parse(localStorage.getItem('careLogs') || '[]');
    const existingCheckins = JSON.parse(localStorage.getItem('checkinData') || '[]');
    
    const clients = [...existingClients];
    const appointments = [...existingAppointments];
    const contactSubmissions = [...existingSubmissions];
    const careLogs = [...existingCareLogs];
    const checkinData = [...existingCheckins];
    
    // Generate 20 contact submissions
    for (let i = 0; i < 20; i++) {
        const submission = {
            name: `${humanFirstNames[i % humanFirstNames.length]} ${lastNames[i % lastNames.length]}`,
            email: `inquiry${i}@example.com`,
            phone: `406-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            service: services[Math.floor(Math.random() * services.length)],
            message: [
                'Interested in boarding my dog for the weekend.',
                'Would like to schedule a grooming appointment.',
                'Looking for day care services.',
                'Need information about pricing and availability.',
                'My dog needs medication administration. Is this possible?'
            ][Math.floor(Math.random() * 5)],
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            contacted: Math.random() > 0.6
        };
        contactSubmissions.push(submission);
    }
    
    // Generate 150 clients with 1-3 dogs each
    for (let i = 0; i < 150; i++) {
        const familyName = `${lastNames[i % lastNames.length]} Family`;
        const contactName = `${humanFirstNames[i % humanFirstNames.length]} ${lastNames[i % lastNames.length]}`;
        
        const numDogs = Math.floor(Math.random() * 3) + 1; // 1-3 dogs
        const dogs = [];
        
        for (let j = 0; j < numDogs; j++) {
            // Determine animal type (75% dogs, 25% cats)
            const animalType = Math.random() > 0.25 ? 'Dog' : 'Cat';
            
            // Select appropriate name and breed based on type
            let animalName, breed;
            if (animalType === 'Cat') {
                animalName = catNames[(i * 3 + j) % catNames.length];
                breed = catBreeds[Math.floor(Math.random() * catBreeds.length)];
            } else {
                animalName = dogNames[(i * 3 + j) % dogNames.length];
                breed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
            }
            
            // Adjust age and weight based on animal type
            const age = Math.floor(Math.random() * 15) + 1;
            let weight;
            if (animalType === 'Cat') {
                weight = Math.floor(Math.random() * 15) + 5; // Cats: 5-20 lbs
            } else {
                weight = Math.floor(Math.random() * 80) + 10; // Dogs: 10-90 lbs
            }
            
            const gender = ['Male', 'Female', 'Neutered', 'Spayed'][Math.floor(Math.random() * 4)];
            
            // Random food requirements (adjusted for animal type)
            const foods = ['Royal Canin', 'Purina Pro Plan', 'Blue Buffalo', 'Hill\'s Science Diet', 'Homemade'];
            let food;
            if (animalType === 'Cat') {
                const cupsOrCans = ['1/4 cup', '1/3 cup', '1/2 cup', '1 can', '2 cans'];
                food = `${foods[Math.floor(Math.random() * foods.length)]}, ${cupsOrCans[Math.floor(Math.random() * cupsOrCans.length)]}, ${['2x daily', '3x daily'][Math.floor(Math.random() * 2)]}`;
            } else {
                food = `${foods[Math.floor(Math.random() * foods.length)]}, ${Math.floor(Math.random() * 3) + 1} cups, ${['2x daily', '3x daily'][Math.floor(Math.random() * 2)]}`;
            }
            
            // Random medications (50% chance) - use database format
            let meds = [];
            if (Math.random() > 0.5) {
                // Get medications from database or use defaults
                let availableMeds = [];
                try {
                    const medsDB = JSON.parse(localStorage.getItem('medicationsDB') || '[]');
                    if (medsDB.length > 0) {
                        availableMeds = medsDB;
                    } else {
                        // Fallback to default meds if database not initialized
                        availableMeds = [
                            { id: '1', name: 'Apoquel', dosage: ['5.4mg', '16mg'], frequency: ['Once daily', 'Twice daily'] },
                            { id: '2', name: 'Cytopoint', dosage: ['10-14.9 lbs', '15-29.9 lbs'], frequency: ['Monthly injection'] },
                            { id: '3', name: 'Simparica', dosage: ['2.5-5 lbs', '5.1-10 lbs'], frequency: ['Monthly'] },
                            { id: '4', name: 'Prozac', dosage: ['10mg', '20mg'], frequency: ['Once daily', 'Twice daily'] },
                            { id: '5', name: 'Rimadyl', dosage: ['25mg', '75mg'], frequency: ['Once daily', 'Twice daily'] },
                            { id: '6', name: 'Heartgard Plus', dosage: ['Up to 25 lbs', '26-50 lbs'], frequency: ['Monthly'] }
                        ];
                    }
                } catch (e) {
                    console.error('Error loading medications database:', e);
                }
                
                // Select 1-3 random medications
                const numMeds = Math.floor(Math.random() * 3) + 1;
                const selectedMeds = [];
                const medIndices = [];
                
                for (let k = 0; k < numMeds && k < availableMeds.length; k++) {
                    let medIndex;
                    do {
                        medIndex = Math.floor(Math.random() * availableMeds.length);
                    } while (medIndices.includes(medIndex));
                    
                    medIndices.push(medIndex);
                    const med = availableMeds[medIndex];
                    
                    // Randomly select dosage and frequency if available
                    const dosage = med.dosage && med.dosage.length > 0 ? 
                        med.dosage[Math.floor(Math.random() * med.dosage.length)] : '';
                    const frequency = med.frequency && med.frequency.length > 0 ? 
                        med.frequency[Math.floor(Math.random() * med.frequency.length)] : '';
                    
                    selectedMeds.push({
                        id: med.id,
                        name: med.name,
                        dosage: dosage,
                        frequency: frequency
                    });
                }
                
                meds = selectedMeds;
            }
            
            // Random rabies expiration (some past, some future)
            const rabiesDate = new Date();
            rabiesDate.setDate(rabiesDate.getDate() + (Math.floor(Math.random() * 365) - 180));
            
            // Generate photo for this animal (80% chance to have a photo)
            const documents = [];
            if (Math.random() > 0.2) {
                const photo = getDogPhotoForTest(animalName, breed, i * 3 + j, animalType);
                documents.push(photo);
            }
            
            // Extract last name from familyName (remove " Family" suffix if present)
            const ownerLastName = familyName.replace(' Family', '').trim();
            
            const dog = {
                id: `dog_${baseTimestamp}_${i}_${j}`,
                animalType: animalType,
                name: animalName,
                lastName: ownerLastName, // Add owner's last name
                breed: breed,
                age: `${age} years`,
                weight: `${weight} lbs`,
                gender: gender,
                color: ['Black', 'Brown', 'White', 'Golden', 'Gray', 'Multi'][Math.floor(Math.random() * 6)],
                foodRequirements: food,
                medications: meds,
                notes: Math.random() > 0.7 ? `Allergic to ${['chicken', 'grains', 'dairy'][Math.floor(Math.random() * 3)]}. Friendly but can be timid around new people.` : '',
                vaccinations: ['Up to Date', 'Partial', 'Up to Date', 'Up to Date'][Math.floor(Math.random() * 4)],
                rabiesExpiration: rabiesDate.toISOString().split('T')[0],
                documents: documents,
                lastGroomingDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
                nextGroomingDue: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
                groomingNotes: Math.random() > 0.7 ? ['Prefers short cut', 'Allergic to certain shampoos', 'Needs regular brushing'][Math.floor(Math.random() * 3)] : '',
                groomingFrequency: ['Monthly', 'Bi-monthly', 'Quarterly', 'As needed'][Math.floor(Math.random() * 4)]
            };
            
            dogs.push(dog);
        }
        
        const client = {
            id: `client_${baseTimestamp}_${i}`,
            familyName: familyName,
            contactName: contactName,
            email: `client${i}@example.com`,
            phone: `406-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            address: `${Math.floor(Math.random() * 9000) + 100} Main St, Billings, MT`,
            emergencyContact: `${humanFirstNames[(i + 10) % humanFirstNames.length]} ${lastNames[(i + 5) % lastNames.length]}`,
            emergencyPhone: `406-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            vetName: ['Billings Veterinary Hospital', 'Lockwood Animal Clinic', 'Pet Health Center'][Math.floor(Math.random() * 3)],
            vetPhone: `406-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            notes: Math.random() > 0.8 ? 'Preferred drop-off time: Morning' : '',
            dogs: dogs,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        clients.push(client);
        
        // Target: 10-15 total today's appointments, 3-5 arrivals, 3-5 departures
        // Set targets once per client to ensure consistency
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Check initial counts before this client's appointments
        const initialArrivals = appointments.filter(apt => apt.startDate === todayStr).length;
        const initialDepartures = appointments.filter(apt => apt.endDate === todayStr && apt.startDate !== todayStr).length;
        const initialTodayCount = appointments.filter(apt => {
            const aptStart = apt.startDate;
            const aptEnd = apt.endDate;
            return aptStart <= todayStr && aptEnd >= todayStr;
        }).length;
        
        // Set targets - ensure we have at least 3 of each, max 5
        const targetArrivals = Math.max(3, Math.min(5, initialArrivals + Math.floor(Math.random() * 3) + 1));
        const targetDepartures = Math.max(3, Math.min(5, initialDepartures + Math.floor(Math.random() * 3) + 1));
        const maxTodayAppointments = 15;
        
        // Generate 2-5 appointments per client
        const numAppointments = Math.floor(Math.random() * 4) + 2;
        for (let k = 0; k < numAppointments; k++) {
            const dog = dogs[Math.floor(Math.random() * dogs.length)];
            
            // Calculate current counts including appointments already added in this loop
            const currentArrivalsCount = appointments.filter(apt => apt.startDate === todayStr).length;
            const currentDeparturesCount = appointments.filter(apt => apt.endDate === todayStr && apt.startDate !== todayStr).length;
            const currentTodayCount = appointments.filter(apt => {
                const aptStart = apt.startDate;
                const aptEnd = apt.endDate;
                return aptStart <= todayStr && aptEnd >= todayStr;
            }).length;
            
            // Decide if this should be a today's appointment (arrival or departure)
            let isTodayArrival = false;
            let isTodayDeparture = false;
            
            // Generate arrivals if we haven't reached the target and haven't exceeded max today's appointments
            if (currentArrivalsCount < targetArrivals && currentTodayCount < maxTodayAppointments) {
                isTodayArrival = Math.random() < 0.15; // Chance to create arrival
            }
            
            // Generate departures if we haven't reached the target (only if not arrival) and haven't exceeded max
            if (!isTodayArrival && currentDeparturesCount < targetDepartures && currentTodayCount < maxTodayAppointments) {
                isTodayDeparture = Math.random() < 0.10;
            }
            
            let daysOffset;
            if (isTodayArrival) {
                daysOffset = 0; // Today's arrival
            } else if (isTodayDeparture) {
                daysOffset = Math.floor(Math.random() * -5) - 1; // Arrived few days ago, leaving today
            } else {
                daysOffset = Math.floor(Math.random() * 90) - 30; // -30 to +60 days
            }
            
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + daysOffset);
            
            const duration = Math.floor(Math.random() * 7) + 1; // 1-7 days
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
            
            // If it's today's departure, ensure it hasn't been checked out yet
            if (isTodayDeparture && endDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
                endDate.setDate(endDate.getDate()); // Keep end date as today
            }
            
            const types = ['boarding', 'grooming', 'both'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // For today's arrivals, don't check in yet (they're arriving today)
            // For today's departures, ensure they're checked in but not checked out
            let checkedIn = false;
            let checkedOut = false;
            
            if (isTodayArrival) {
                checkedIn = false; // Arriving today, not checked in yet
                checkedOut = false;
            } else if (isTodayDeparture) {
                checkedIn = true; // Already here, leaving today
                checkedOut = false; // Not checked out yet
            } else {
                checkedIn = daysOffset < 0 && daysOffset + duration >= 0 && Math.random() > 0.3;
                checkedOut = daysOffset + duration < 0 && Math.random() > 0.5;
            }
            
            let status = 'scheduled';
            if (checkedIn) status = 'in-progress';
            else if (checkedOut) status = 'completed';
            else if (isTodayArrival || daysOffset <= 7) status = 'confirmed';
            
            const appointment = {
                id: `apt_${baseTimestamp}_${i}_${k}`,
                clientId: client.id,
                clientName: client.familyName,
                dogId: dog.id,
                dogName: dog.name,
                type: type,
                status: status,
                startDate: startDate.toISOString().split('T')[0],
                startTime: ['08:00', '09:00', '10:00', '14:00', '15:00'][Math.floor(Math.random() * 5)],
                endDate: endDate.toISOString().split('T')[0],
                endTime: ['16:00', '17:00', '18:00'][Math.floor(Math.random() * 3)],
                notes: Math.random() > 0.7 ? `Special requests: ${['Extra walks', 'Quiet area', 'Extra attention', 'Dietary restrictions'][Math.floor(Math.random() * 4)]}` : '',
                checkedIn: checkedIn || false,
                checkedOut: checkedOut || false,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            appointments.push(appointment);
            
            // Generate check-in data for checked-in appointments
            if (checkedIn && !checkedOut) {
                const checkinDate = new Date(startDate);
                checkinDate.setHours(Math.floor(Math.random() * 5) + 8, 0, 0, 0);
                
                const checkoutDate = new Date(endDate);
                checkoutDate.setHours(Math.floor(Math.random() * 4) + 15, 0, 0, 0);
                
                checkinData.push({
                    appointmentId: appointment.id,
                    checkinDateTime: checkinDate.toISOString(),
                    checkoutDateTime: checkoutDate.toISOString(),
                    notes: Math.random() > 0.7 ? 'Brought favorite toy and bed. Arrived in good condition.' : '',
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Generate care logs for checked-in dogs
    const today = new Date().toISOString().split('T')[0];
    
    appointments.filter(apt => apt.checkedIn && !apt.checkedOut).forEach(apt => {
        // Generate logs for last 3 days
        for (let day = 0; day <= 2; day++) {
            const logDate = new Date(today);
            logDate.setDate(logDate.getDate() - day);
            
            const log = {
                appointmentId: apt.id,
                date: logDate.toISOString().split('T')[0],
                breakfast: Math.random() > 0.3,
                dinner: Math.random() > 0.5,
                medications: Math.random() > 0.6 ? 'Heartgard given at 8am' : '',
                walks: `${Math.floor(Math.random() * 4) + 1} walks, ${Math.floor(Math.random() * 30) + 10} min each`,
                behavior: ['Happy and playful', 'Quiet, resting well', 'Active and energetic', 'Calm and content'][Math.floor(Math.random() * 4)],
                notes: Math.random() > 0.7 ? 'Ate well, no issues' : '',
                timestamp: logDate.toISOString()
            };
            careLogs.push(log);
        }
    });
    
    // Save to localStorage
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('appointments', JSON.stringify(appointments));
    localStorage.setItem('contactSubmissions', JSON.stringify(contactSubmissions));
    localStorage.setItem('careLogs', JSON.stringify(careLogs));
    localStorage.setItem('checkinData', JSON.stringify(checkinData));
    
    const totalDogs = clients.reduce((sum, c) => sum + (c.dogs ? c.dogs.length : 0), 0);
    const checkedInCount = appointments.filter(apt => apt.checkedIn && !apt.checkedOut).length;
    const todayAppointments = appointments.filter(apt => apt.startDate === today).length;
    
    console.log('✅ Test data generated successfully!');
    console.log(`📋 Clients: ${clients.length} (${clients.length - existingClients.length} new)`);
    console.log(`🐕 Dogs: ${totalDogs} (${totalDogs - existingClients.reduce((sum, c) => sum + (c.dogs ? c.dogs.length : 0), 0)} new)`);
    console.log(`📅 Appointments: ${appointments.length} (${appointments.length - existingAppointments.length} new)`);
    console.log(`📧 Contact Submissions: ${contactSubmissions.length} (${contactSubmissions.length - existingSubmissions.length} new)`);
    console.log(`📝 Care Logs: ${careLogs.length} (${careLogs.length - existingCareLogs.length} new)`);
    console.log(`🏠 Check-ins: ${checkinData.length} (${checkinData.length - existingCheckins.length} new)`);
    console.log(`\n📊 Current Status:`);
    console.log(`   • Checked In: ${checkedInCount} dogs`);
    console.log(`   • Today's Appointments: ${todayAppointments}`);
    console.log('\n🔄 Reload the page to see the data!');
    
    return {
        clients,
        appointments,
        contactSubmissions,
        careLogs,
        checkinData
    };
}

// Clear all test data from localStorage
function clearTestData() {
    const confirmClear = confirm('⚠️ Are you sure you want to clear ALL data?\n\nThis will delete:\n- All clients and dogs\n- All appointments\n- All contact submissions\n- All care logs\n- All check-in records\n\nThis action cannot be undone!');
    
    if (!confirmClear) {
        console.log('❌ Data clearing cancelled');
        return false;
    }
    
    try {
        // Clear all data storage
        localStorage.removeItem('clients');
        localStorage.removeItem('appointments');
        localStorage.removeItem('contactSubmissions');
        localStorage.removeItem('careLogs');
        localStorage.removeItem('checkinData');
        
        // Keep user preferences and databases
        // localStorage.removeItem('medicationsDB');
        // localStorage.removeItem('breedsDB');
        // localStorage.removeItem('theme');
        
        console.log('✅ All test data cleared successfully!');
        console.log('📋 Cleared: Clients, Appointments, Submissions, Care Logs, Check-ins');
        
        return true;
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        alert('Error clearing data: ' + error.message);
        return false;
    }
}

// Auto-run if in console
if (typeof window !== 'undefined') {
    window.generateTestData = generateTestData;
    window.clearTestData = clearTestData;
    console.log('Test data generator loaded! Run generateTestData() in console to populate test data.');
    console.log('Run clearTestData() in console to clear all test data.');
}

