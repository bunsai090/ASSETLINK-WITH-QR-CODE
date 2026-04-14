/// <reference types="vite/client" />

import { mockBase44 } from './mockBase44';

// Use mock client for local development.
// To connect to a real Base44 backend, set VITE_BASE44_REAL_BACKEND=true
// in your .env file and ensure VITE_BASE44_APP_BASE_URL points to the real server.
const useRealBackend = import.meta.env.VITE_BASE44_REAL_BACKEND === 'true';

let base44Instance;

if (useRealBackend) {
    // Dynamic import only when needed — avoids errors when no real backend exists
    const { createClient } = await import('@base44/sdk');
    const { appParams } = await import('@/lib/app-params');
    const { appId, token, functionsVersion, appBaseUrl } = appParams;
    base44Instance = createClient({
        appId,
        token,
        functionsVersion,
        serverUrl: '',
        requiresAuth: false,
        appBaseUrl,
    });
} else {
    console.log('[AssetLink] Running in local mode with mock data');
    base44Instance = mockBase44;
}

/**
 * @typedef {Object} EntityMethods
 * @property {(sort?: string, limit?: number, skip?: number, fields?: string | string[]) => Promise<any[]>} list
 * @property {(query: object, sort?: string, limit?: number, skip?: number, fields?: string | string[]) => Promise<any[]>} filter
 * @property {(id: string) => Promise<any>} get
 * @property {(data: object) => Promise<any>} create
 * @property {(id: string, data: object) => Promise<any>} update
 * @property {(id: string) => Promise<any>} delete
 * @property {(query: object) => Promise<any>} deleteMany
 * @property {(data: any[]) => Promise<any[]>} bulkCreate
 * @property {(query: object, data: object) => Promise<any>} updateMany
 * @property {(data: any[]) => Promise<any>} bulkUpdate
 */

/**
 * @typedef {Object} Base44Auth
 * @property {function(): Promise<any>} me
 * @property {function(object): Promise<any>} updateMe
 * @property {function(string=): void} redirectToLogin
 * @property {function(string, string=): void} loginWithProvider
 * @property {function(string=): void} logout
 * @property {function(string): void} setToken
 * @property {function(string, string): Promise<any>} loginViaEmailPassword
 * @property {function(): Promise<boolean>} isAuthenticated
 */

/**
 * @typedef {Object} Base44Client
 * @property {Base44Auth} auth
 * @property {Object} entities
 * @property {EntityMethods} entities.Asset
 * @property {EntityMethods} entities.RepairRequest
 * @property {EntityMethods} entities.MaintenanceTask
 * @property {EntityMethods} entities.School
 * @property {Object} integrations
 * @property {Object} integrations.Core
 * @property {function({file: File}): Promise<{file_url: string}>} integrations.Core.UploadFile
 * @property {function({to: string, subject: string, body: string}): Promise<{success: boolean}>} integrations.Core.SendEmail
 */

/** @type {Base44Client} */
export const base44 = /** @type {any} */ (base44Instance);
