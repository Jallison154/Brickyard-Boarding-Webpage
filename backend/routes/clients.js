import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const router = Router();

// Helpers
const now = () => new Date().toISOString();

// Prepared statements
const insertClient = db.prepare(`INSERT INTO clients (id,familyName,contactName,email,phone,address,emergencyContact,emergencyPhone,notes,createdAt,updatedAt)
VALUES (@id,@familyName,@contactName,@email,@phone,@address,@emergencyContact,@emergencyPhone,@notes,@createdAt,@updatedAt)`);

const updateClient = db.prepare(`UPDATE clients SET familyName=@familyName,contactName=@contactName,email=@email,phone=@phone,address=@address,emergencyContact=@emergencyContact,emergencyPhone=@emergencyPhone,notes=@notes,updatedAt=@updatedAt WHERE id=@id`);

const deleteClient = db.prepare(`DELETE FROM clients WHERE id = ?`);

const selectClients = db.prepare(`SELECT * FROM clients ORDER BY updatedAt DESC LIMIT ? OFFSET ?`);
const countClients = db.prepare(`SELECT COUNT(*) as cnt FROM clients`);
const selectClientById = db.prepare(`SELECT * FROM clients WHERE id = ?`);

const insertAnimal = db.prepare(`INSERT INTO animals (id,clientId,name,animalType,breed,age,weight,gender,color,foodRequirements,medications,notes,createdAt,updatedAt)
VALUES (@id,@clientId,@name,@animalType,@breed,@age,@weight,@gender,@color,@foodRequirements,@medications,@notes,@createdAt,@updatedAt)`);

const selectAnimalsByClient = db.prepare(`SELECT * FROM animals WHERE clientId = ? ORDER BY updatedAt DESC`);
const deleteAnimalsByClient = db.prepare(`DELETE FROM animals WHERE clientId = ?`);

// Routes
router.get('/clients', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  const rows = selectClients.all(limit, offset);
  const total = countClients.get().cnt;
  res.json({ total, rows });
});

router.get('/clients/:id', (req, res) => {
  const client = selectClientById.get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const animals = selectAnimalsByClient.all(req.params.id);
  res.json({ ...client, animals });
});

router.post('/clients', (req, res) => {
  const id = uuid();
  const createdAt = now();
  const payload = {
    id,
    familyName: req.body.familyName || '',
    contactName: req.body.contactName || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    address: req.body.address || '',
    emergencyContact: req.body.emergencyContact || '',
    emergencyPhone: req.body.emergencyPhone || '',
    notes: req.body.notes || '',
    createdAt,
    updatedAt: createdAt
  };
  if (!payload.familyName || !payload.contactName) return res.status(400).json({ error: 'familyName and contactName required' });
  const tx = db.transaction((client, animals) => {
    insertClient.run(client);
    for (const a of animals || []) {
      insertAnimal.run({
        id: uuid(),
        clientId: id,
        name: a.name || '',
        animalType: a.animalType || 'Dog',
        breed: a.breed || '',
        age: a.age || '',
        weight: a.weight || '',
        gender: a.gender || '',
        color: a.color || '',
        foodRequirements: a.foodRequirements || '',
        medications: JSON.stringify(a.medications || []),
        notes: a.notes || '',
        createdAt,
        updatedAt: createdAt
      });
    }
  });
  tx(payload, req.body.animals || []);
  res.status(201).json({ id });
});

router.put('/clients/:id', (req, res) => {
  const existing = selectClientById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = {
    id: req.params.id,
    familyName: req.body.familyName ?? existing.familyName,
    contactName: req.body.contactName ?? existing.contactName,
    email: req.body.email ?? existing.email,
    phone: req.body.phone ?? existing.phone,
    address: req.body.address ?? existing.address,
    emergencyContact: req.body.emergencyContact ?? existing.emergencyContact,
    emergencyPhone: req.body.emergencyPhone ?? existing.emergencyPhone,
    notes: req.body.notes ?? existing.notes,
    updatedAt: now()
  };
  updateClient.run(updated);
  res.json({ ok: true });
});

router.delete('/clients/:id', (req, res) => {
  const tx = db.transaction((id) => {
    deleteAnimalsByClient.run(id);
    deleteClient.run(id);
  });
  tx(req.params.id);
  res.json({ ok: true });
});

export default router;


