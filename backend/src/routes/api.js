import express from 'express';
import admin from 'firebase-admin';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const db = admin.firestore();

// 1. Analytics Placeholder
router.post('/apps/:appId/analytics/track/batch', (req, res) => {
    // console.log(`[Analytics] Received batch for app: ${req.params.appId}`);
    res.status(200).json({ success: true });
});

// 2. Auth: Get Current User (GET /entities/User/me)
router.get('/apps/:appId/entities/User/me', authMiddleware, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found in Firestore' });
        }
        res.json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Generic Entity CRUD
// GET /apps/:appId/entities/:entityName
router.get('/apps/:appId/entities/:entityName', authMiddleware, async (req, res) => {
    const { entityName } = req.params;
    // Map SDK entity names to Firestore collection names
    const collectionMap = {
        'Asset': 'assets',
        'RepairRequest': 'repair_requests',
        'MaintenanceTask': 'maintenance_tasks',
        'School': 'schools',
        'User': 'users'
    };

    const collectionName = collectionMap[entityName] || entityName.toLowerCase() + 's';

    try {
        const snapshot = await db.collection(collectionName).get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (error) {
        console.error(`Error fetching entities (${entityName}):`, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /apps/:appId/entities/:entityName/:id
router.get('/apps/:appId/entities/:entityName/:id', authMiddleware, async (req, res) => {
    const { entityName, id } = req.params;
    const collectionMap = {
        'Asset': 'assets',
        'RepairRequest': 'repair_requests',
        'MaintenanceTask': 'maintenance_tasks',
        'School': 'schools',
        'User': 'users'
    };
    const collectionName = collectionMap[entityName] || entityName.toLowerCase() + 's';

    try {
        const doc = await db.collection(collectionName).doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
