import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Helper for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key
const serviceAccountPath = path.join(__dirname, '../../asset-link-f903b-firebase-adminsdk-fbsvc-184d2dc8e9.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

const usersToCreate = [
    { email: 'admin@assetlink.ph', password: 'Assetlink123!', role: 'admin', full_name: 'System Administrator' },
    { email: 'teacher@assetlink.ph', password: 'Assetlink123!', role: 'teacher', full_name: 'Janice Teacher' },
    { email: 'principal@assetlink.ph', password: 'Assetlink123!', role: 'principal', full_name: 'Principal Santos' },
    { email: 'supervisor@assetlink.ph', password: 'Assetlink123!', role: 'supervisor', full_name: 'Regional Supervisor' },
    { email: 'maintenance@assetlink.ph', password: 'Assetlink123!', role: 'maintenance', full_name: 'Maintenance Staff Roy' },
];

async function seed() {
    console.log('🚀 Starting Firebase Seeding...');

    for (const u of usersToCreate) {
        try {
            let userRecord;
            try {
                // Check if user already exists in Auth
                userRecord = await auth.getUserByEmail(u.email);
                console.log(`ℹ️ User ${u.email} already exists in Auth.`);
            } catch (e) {
                // Create user if not exists
                userRecord = await auth.createUser({
                    email: u.email,
                    password: u.password,
                    displayName: u.full_name,
                });
                console.log(`✅ Created Auth account for: ${u.email}`);
            }

            // Create or Update Firestore Document
            await db.collection('users').doc(userRecord.uid).set({
                full_name: u.full_name,
                role: u.role,
                email: u.email,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`🏠 Firestore document set for ${u.role} (UID: ${userRecord.uid})`);
        } catch (error) {
            console.error(`❌ Error seeding ${u.email}:`, error.message);
        }
    }

    console.log('✨ Seeding Completed!');
    process.exit(0);
}

seed();
