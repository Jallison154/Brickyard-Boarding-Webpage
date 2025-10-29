# Database Schema - Brickyard Boarding Kennel

## Overview
This document outlines the database structure needed for the Brickyard Boarding Kennel management system, with focus on animal photos/documents storage.

## Current Implementation (LocalStorage)
Currently, the application uses localStorage with the following structure:

### Dogs Data Structure (Current)
```javascript
{
    id: "dog_123",
    name: "Max",
    breed: "Golden Retriever",
    age: "5",
    weight: "65",
    gender: "Male",
    color: "Golden",
    foodRequirements: "2 cups twice daily",
    medications: [{ id: "1", name: "Apoquel", dosage: "10mg", frequency: "Once daily" }],
    notes: "Special needs",
    vaccinations: "Current",
    rabiesExpiration: "2024-12-31",
    documents: [
        {
            name: "Photo_2024-01-15.jpg",
            type: "image/jpeg",
            data: "data:image/jpeg;base64,/9j/4AAQ...", // Base64 encoded
            uploadedDate: "2024-01-15T10:30:00Z"
        }
    ]
}
```

## Recommended Backend Database Structure

### 1. Dogs Table
```sql
CREATE TABLE dogs (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    age INT,
    weight DECIMAL(5,2),
    gender VARCHAR(50),
    color VARCHAR(100),
    food_requirements TEXT,
    medications JSON, -- Store as JSON array
    notes TEXT,
    vaccinations VARCHAR(50),
    rabies_expiration DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_dogs_client_id ON dogs(client_id);
CREATE INDEX idx_dogs_name ON dogs(name);
```

### 2. Dog Documents/Photos Table
```sql
CREATE TABLE dog_documents (
    id VARCHAR(255) PRIMARY KEY,
    dog_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- image/jpeg, image/png, application/pdf
    file_path VARCHAR(500) NOT NULL, -- Path to file in storage (S3, local, etc.)
    file_size INT, -- Size in bytes
    mime_type VARCHAR(100),
    is_primary_photo BOOLEAN DEFAULT FALSE, -- For quick access to main photo
    description TEXT,
    uploaded_by VARCHAR(255), -- User/admin who uploaded
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

CREATE INDEX idx_dog_documents_dog_id ON dog_documents(dog_id);
CREATE INDEX idx_dog_documents_is_primary ON dog_documents(is_primary_photo);
CREATE INDEX idx_dog_documents_type ON dog_documents(file_type);
```

### 3. Alternative: Embedded Documents (Small Files)
If files will always be small (< 1MB), you could store directly in database:
```sql
CREATE TABLE dog_documents (
    id VARCHAR(255) PRIMARY KEY,
    dog_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_data LONGBLOB, -- Binary data (MySQL) or BYTEA (PostgreSQL)
    file_size INT,
    is_primary_photo BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);
```

## File Storage Options

### Option 1: Cloud Storage (Recommended)
**AWS S3 / Azure Blob / Google Cloud Storage**
- Store files in cloud storage
- Store file path in database
- Benefits: Scalable, CDN support, backup included
- Example path: `s3://brickyard-kennel/dogs/{dog_id}/photos/photo_123.jpg`

### Option 2: Local File System
**Organized Directory Structure**
```
/storage
  /dogs
    /{dog_id}
      /photos
        - photo_001.jpg
        - photo_002.jpg
      /documents
        - vaccination_record.pdf
        - medical_history.pdf
```
- Store relative path in database: `dogs/{dog_id}/photos/photo_001.jpg`
- Benefits: Simple, no cloud costs
- Drawbacks: Backup required, scaling issues

### Option 3: Database BLOB (Small files only)
- Store binary data directly in database
- Benefits: Simple, everything in one place
- Drawbacks: Not scalable, slow queries, backup issues

## API Endpoints Needed

### Dog Photo/Document Endpoints

#### Upload Photo
```
POST /api/dogs/{dog_id}/documents
Content-Type: multipart/form-data

Request Body:
- file: (binary)
- description: (optional string)
- is_primary: (optional boolean)

Response:
{
    "id": "doc_123",
    "dog_id": "dog_456",
    "filename": "photo_001.jpg",
    "file_path": "/storage/dogs/dog_456/photos/photo_001.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678,
    "is_primary_photo": false,
    "uploaded_at": "2024-01-15T10:30:00Z",
    "url": "/api/dogs/dog_456/documents/doc_123/view"
}
```

#### Get Dog Photos
```
GET /api/dogs/{dog_id}/documents?type=image&primary_only=false

Response:
{
    "documents": [
        {
            "id": "doc_123",
            "filename": "photo_001.jpg",
            "file_type": "image/jpeg",
            "is_primary_photo": true,
            "uploaded_at": "2024-01-15T10:30:00Z",
            "url": "/api/dogs/dog_456/documents/doc_123/view",
            "thumbnail_url": "/api/dogs/dog_456/documents/doc_123/thumbnail"
        }
    ]
}
```

#### View Photo
```
GET /api/dogs/{dog_id}/documents/{document_id}/view
Response: Binary image data with proper Content-Type headers
```

#### Thumbnail
```
GET /api/dogs/{dog_id}/documents/{document_id}/thumbnail?size=200
Response: Resized image thumbnail
```

#### Delete Document
```
DELETE /api/dogs/{dog_id}/documents/{document_id}
Response: { "success": true }
```

#### Set Primary Photo
```
PATCH /api/dogs/{dog_id}/documents/{document_id}
Body: { "is_primary_photo": true }
Response: Updated document object
```

## Additional Tables Needed

### Clients Table
```sql
CREATE TABLE clients (
    id VARCHAR(255) PRIMARY KEY,
    family_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    vet_name VARCHAR(255),
    vet_phone VARCHAR(50),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_family_name ON clients(family_name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
```

### Appointments Table
```sql
CREATE TABLE appointments (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    dog_id VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    dog_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- boarding, grooming, both
    status VARCHAR(50) NOT NULL, -- scheduled, confirmed, in-progress, completed, cancelled
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE NOT NULL,
    end_time TIME,
    notes TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_out BOOLEAN DEFAULT FALSE,
    checkin_datetime DATETIME,
    checkout_datetime DATETIME,
    checkin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE),
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_dog_id ON appointments(dog_id);
CREATE INDEX idx_appointments_dates ON appointments(start_date, end_date);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### Contact Submissions Table
```sql
CREATE TABLE contact_submissions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service VARCHAR(100),
    message TEXT NOT NULL,
    contacted BOOLEAN DEFAULT FALSE,
    contacted_at DATETIME,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_submissions_contacted ON contact_submissions(contacted);
CREATE INDEX idx_contact_submissions_submitted_at ON contact_submissions(submitted_at);
```

### Care Logs Table
```sql
CREATE TABLE care_logs (
    id VARCHAR(255) PRIMARY KEY,
    appointment_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    breakfast BOOLEAN DEFAULT FALSE,
    dinner BOOLEAN DEFAULT FALSE,
    medications TEXT,
    walks TEXT,
    behavior TEXT,
    notes TEXT,
    logged_by VARCHAR(255),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_logs_appointment_id ON care_logs(appointment_id);
CREATE INDEX idx_care_logs_date ON care_logs(date);
```

### Medications Database Table
```sql
CREATE TABLE medications (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    common_dosages JSON, -- Array of common dosages
    common_frequencies JSON, -- Array of common frequencies
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dog Breeds Database Table
```sql
CREATE TABLE dog_breeds (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    average_weight DECIMAL(5,2),
    average_lifespan INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Photo/Document Processing

### Image Optimization
When uploading photos, automatically:
1. **Resize** large images (max 1920x1920px)
2. **Compress** JPEG files (quality 80-85%)
3. **Generate thumbnails** (200x200px, 400x400px)
4. **Validate** file type and size (max 10MB for photos)
5. **Sanitize** filename

### Storage Limits
- Max file size: 10MB per photo, 5MB per document
- Max photos per dog: 50
- Recommended thumbnail sizes: 200px, 400px, 800px
- Keep original + generate optimized versions

## Migration from LocalStorage

### Migration Script Logic
```javascript
// Pseudocode for migrating from localStorage to backend

async function migrateToBackend() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    for (const client of clients) {
        // Create client in database
        const clientId = await createClient(client);
        
        for (const dog of client.dogs || []) {
            // Create dog in database
            const dogId = await createDog(clientId, dog);
            
            // Upload documents/photos
            if (dog.documents && dog.documents.length > 0) {
                for (const doc of dog.documents) {
                    if (doc.type.startsWith('image/')) {
                        // Convert base64 to file
                        const file = base64ToFile(doc.data, doc.name);
                        // Upload to storage
                        await uploadDogPhoto(dogId, file, {
                            description: doc.name,
                            is_primary: false
                        });
                    }
                }
            }
        }
    }
}
```

## Security Considerations

### File Upload Security
1. **Validate file types** - Only allow: jpg, jpeg, png, gif, pdf
2. **Scan for malware** - Virus scan uploaded files
3. **Rate limiting** - Max uploads per user per hour
4. **File size limits** - Enforce max file sizes
5. **Sanitize filenames** - Remove special characters
6. **Access control** - Verify user has permission to upload

### Access Control
- Photos should only be accessible to:
  - Dog owner (via client portal)
  - Admin/kennel staff
  - Veterinarians (if shared)

### Data Privacy
- Comply with data protection regulations
- Encrypt sensitive documents
- Secure deletion of old/unused photos
- Backup and recovery procedures

## Recommended Tech Stack

### Backend Options

#### Option 1: Node.js/Express
- **Database**: PostgreSQL or MySQL
- **Storage**: AWS S3 or local filesystem
- **File Processing**: Sharp (image optimization)
- **ORM**: Sequelize or Prisma

#### Option 2: Python/Django
- **Database**: PostgreSQL
- **Storage**: Django Storage (S3, local)
- **File Processing**: Pillow (PIL)
- **ORM**: Django ORM

#### Option 3: PHP/Laravel
- **Database**: MySQL/PostgreSQL
- **Storage**: Laravel Storage (S3, local)
- **File Processing**: Intervention Image
- **ORM**: Eloquent

## Environment Variables Needed
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/brickyard_kennel

# File Storage
STORAGE_TYPE=s3  # or 'local'
AWS_S3_BUCKET=brickyard-kennel-photos
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# File Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif
ALLOWED_DOC_TYPES=pdf,jpg,jpeg,png

# Photo Processing
PHOTO_MAX_WIDTH=1920
PHOTO_MAX_HEIGHT=1920
PHOTO_QUALITY=85
THUMBNAIL_SIZE=200,400,800
```

## Summary

For proper backend implementation:
1. Store file paths/URLs in database, not binary data
2. Use cloud storage (S3, etc.) for scalability
3. Generate thumbnails for faster loading
4. Implement proper access control
5. Optimize images on upload
6. Support multiple photo sizes (thumbnail, medium, full)
7. Track which photo is the "primary" photo for quick access
8. Implement cleanup procedures for old files

This structure will scale well and support the photo display features throughout the application.

