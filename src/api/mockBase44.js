/**
 * Mock Base44 client for local development.
 * Replaces the real @base44/sdk with localStorage-based CRUD and mock auth.
 */

import { DEMO_USERS, DEMO_USER, SEED_SCHOOLS, SEED_ASSETS, SEED_REPAIR_REQUESTS, SEED_TASKS } from './seedData';

// ── LocalStorage Helper ──────────────────────────────────────────────
const STORE_PREFIX = 'assetlink_mock_';

function getStore(entityName) {
    const key = `${STORE_PREFIX}${entityName}`;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setStore(entityName, data) {
    localStorage.setItem(`${STORE_PREFIX}${entityName}`, JSON.stringify(data));
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Seed data on first run ───────────────────────────────────────────
const SEED_MAP = {
    School: SEED_SCHOOLS,
    Asset: SEED_ASSETS,
    RepairRequest: SEED_REPAIR_REQUESTS,
    MaintenanceTask: SEED_TASKS,
};

function ensureSeeded() {
    for (const [entity, seedRows] of Object.entries(SEED_MAP)) {
        if (!getStore(entity)) {
            setStore(entity, seedRows);
        }
    }
}

// Run seed check immediately
ensureSeeded();

// ── Mock Entity Handler ──────────────────────────────────────────────
// BACKEND: This mock handler implements basic CRUD. Backend should add:
//   1. Input validation (required fields, type checking, enums)
//   2. Permission checks (role-based authorization per entity/action)
//   3. Audit logging (who, what, when)
//   4. Status transition validation (prevent invalid state changes)
//   5. Relationship integrity (e.g., task can only reference valid repair request)
function createMockEntityHandler(entityName) {
    return {
        async list(sort, limit) {
            let items = getStore(entityName) || [];
            // Basic sort support (e.g. '-created_date')
            if (sort && typeof sort === 'string') {
                const desc = sort.startsWith('-');
                const field = desc ? sort.slice(1) : sort;
                items = [...items].sort((a, b) => {
                    const va = a[field] || '';
                    const vb = b[field] || '';
                    return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
                });
            }
            if (limit) items = items.slice(0, limit);
            return items;
        },

        async filter(query, sort, limit) {
            let items = getStore(entityName) || [];
            // Basic query matching
            if (query && typeof query === 'object') {
                items = items.filter(item =>
                    Object.entries(query).every(([k, v]) => item[k] === v)
                );
            }
            if (sort && typeof sort === 'string') {
                const desc = sort.startsWith('-');
                const field = desc ? sort.slice(1) : sort;
                items = [...items].sort((a, b) => {
                    const va = a[field] || '';
                    const vb = b[field] || '';
                    return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
                });
            }
            if (limit) items = items.slice(0, limit);
            return items;
        },

        async get(id) {
            const items = getStore(entityName) || [];
            const found = items.find(i => i.id === id);
            if (!found) throw new Error(`${entityName} not found: ${id}`);
            return found;
        },

        async create(data) {
            const items = getStore(entityName) || [];
            const newItem = {
                ...data,
                id: generateId(entityName.toLowerCase().slice(0, 3)),
                created_date: new Date().toISOString(),
            };
            items.push(newItem);
            setStore(entityName, items);
            return newItem;
        },

        async update(id, data) {
            const items = getStore(entityName) || [];
            const idx = items.findIndex(i => i.id === id);
            if (idx === -1) throw new Error(`${entityName} not found: ${id}`);
            items[idx] = { ...items[idx], ...data };
            setStore(entityName, items);
            return items[idx];
        },

        async delete(id) {
            let items = getStore(entityName) || [];
            items = items.filter(i => i.id !== id);
            setStore(entityName, items);
            return { success: true };
        },

        async deleteMany(query) {
            let items = getStore(entityName) || [];
            if (query && typeof query === 'object') {
                items = items.filter(item =>
                    !Object.entries(query).every(([k, v]) => item[k] === v)
                );
            }
            setStore(entityName, items);
            return { success: true };
        },

        async bulkCreate(data) {
            const items = getStore(entityName) || [];
            const newItems = data.map(d => ({
                ...d,
                id: generateId(entityName.toLowerCase().slice(0, 3)),
                created_date: new Date().toISOString(),
            }));
            items.push(...newItems);
            setStore(entityName, items);
            return newItems;
        },

        async updateMany(query, data) {
            const items = getStore(entityName) || [];
            let count = 0;
            for (const item of items) {
                const matches = Object.entries(query).every(([k, v]) => item[k] === v);
                if (matches) {
                    Object.assign(item, data);
                    count++;
                }
            }
            setStore(entityName, items);
            return { modifiedCount: count };
        },

        async bulkUpdate(data) {
            const items = getStore(entityName) || [];
            for (const { id, ...update } of data) {
                const idx = items.findIndex(i => i.id === id);
                if (idx !== -1) items[idx] = { ...items[idx], ...update };
            }
            setStore(entityName, items);
            return { success: true };
        },

        subscribe(callback) {
            // No-op for local dev — no real-time updates
            return () => {};
        },
    };
}

// ── Mock Entities Proxy ──────────────────────────────────────────────
const mockEntities = new Proxy({}, {
    get(_target, entityName) {
        if (typeof entityName !== 'string' || entityName === 'then' || entityName.startsWith('_')) {
            return undefined;
        }
        return createMockEntityHandler(entityName);
    },
});

// ── Mock Auth ────────────────────────────────────────────────────────
const MOCK_USER_KEY = `${STORE_PREFIX}current_user`;

function getMockUser() {
    try {
        const raw = localStorage.getItem(MOCK_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

const mockAuth = {
    async me() {
        const user = getMockUser();
        if (!user) throw { status: 401, message: 'Unauthorized' };
        return user;
    },

    async updateMe(data) {
        const user = { ...getMockUser(), ...data };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        return user;
    },

    redirectToLogin(nextUrl) {
        // In local mode, just reload — no external login page
        console.log('[MockBase44] redirectToLogin called, reloading...');
        window.location.href = nextUrl || '/';
    },

    loginWithProvider(provider, fromUrl = '/') {
        console.log(`[MockBase44] loginWithProvider(${provider}) — no-op in local mode`);
        window.location.href = fromUrl;
    },

    logout(redirectUrl) {
        // Clear mock user and token, reload
        localStorage.removeItem(MOCK_USER_KEY);
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
        console.log('[MockBase44] Logged out');
        window.location.href = redirectUrl || '/';
    },

    setToken(token) {
        if (token) localStorage.setItem('base44_access_token', token);
    },

    async loginViaEmailPassword(email, password) {
        const user = DEMO_USERS.find(u => u.email === email) || { ...DEMO_USER, email };
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        const token = 'mock_token_' + Date.now();
        this.setToken(token);
        return { access_token: token, user };
    },

    async isAuthenticated() {
        return true; // Always authenticated in local mode
    },

    inviteUser(email, role) {
        console.log(`[MockBase44] inviteUser(${email}, ${role}) — no-op`);
        return Promise.resolve({ success: true });
    },

    register(payload) {
        return this.loginViaEmailPassword(payload.email, payload.password);
    },

    verifyOtp() { return Promise.resolve({ success: true }); },
    resendOtp() { return Promise.resolve({ success: true }); },
    resetPasswordRequest() { return Promise.resolve({ success: true }); },
    resetPassword() { return Promise.resolve({ success: true }); },
    changePassword() { return Promise.resolve({ success: true }); },
};

// ── Mock Integrations ────────────────────────────────────────────────
const mockIntegrations = {
    Core: {
        async UploadFile({ file }) {
            // Create a local object URL for the file
            const url = URL.createObjectURL(file);
            return { file_url: url };
        },
        async SendEmail({ to, subject, body }) {
            console.log(`[MockBase44] SendEmail → ${to}\nSubject: ${subject}\n${body}`);
            return { success: true };
        },
    },
};

// ── Assembled Mock Client ────────────────────────────────────────────
export const mockBase44 = {
    entities: mockEntities,
    auth: mockAuth,
    integrations: mockIntegrations,
};
