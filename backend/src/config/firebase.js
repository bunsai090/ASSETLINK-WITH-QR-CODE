import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account key
const serviceAccountPath = path.resolve(__dirname, '../../asset-link-f903b-firebase-adminsdk-fbsvc-184d2dc8e9.json');

// Initialize Firebase Admin synchronously
try {
  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  // Verify connection by attempting to list collections
  admin.firestore().listCollections()
    .then(() => {
      console.log('✅ Firebase Admin SDK: Connected to Firestore successfully');
    })
    .catch((err) => {
      console.error('❌ Firebase Admin SDK: Failed to connect to Firestore:', err.message);
    });

  console.log('🚀 Firebase Admin SDK initialized for project:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Firebase Admin SDK Error:', error.message);
  process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
