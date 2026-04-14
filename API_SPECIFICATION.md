# API Specification for AssetLink Backend

This document defines all REST endpoints the backend must implement for AssetLink.

## Base URL
`
Production: https://api.assetlink.ph/v1
Development: http://localhost:3000/api/v1
`

## Authentication
All endpoints require Authorization: Bearer {JWT_TOKEN} header.

---

## Entities

### 1. Asset - School assets requiring maintenance

GET /assets              - List all (paginated)
GET /assets/:id          - Get single asset
POST /assets             - Create new (required: name, asset_code, category, school_id, condition)
PUT /assets/:id          - Update asset
DELETE /assets/:id       - Delete asset (soft delete recommended)

### 2. RepairRequest - Damage reports by teachers

GET /repair-requests     - List all (filter: status, priority, school_id)
POST /repair-requests    - Create new damage report
PUT /repair-requests/:id - Update status (Approved/Rejected/Escalated/Completed)

Valid statuses: Pending -> Approved -> In Progress -> Completed|Rejected|Escalated

### 3. MaintenanceTask - Work orders for maintenance staff

GET /tasks               - List (maintenance: only own tasks, others: all)
POST /tasks              - Create task (auto from repair approval)
PUT /tasks/:id           - Update status/progress
PUT /tasks/:id/start_date - Reschedule task (MAINTENANCE ONLY - enforce 403)

Valid statuses: Assigned -> In Progress|On Hold -> Completed|Pending Teacher Verification

### 4. School - Master data

GET /schools             - List schools
POST /schools            - Create school
PUT /schools/:id         - Update school

---

## Key Validation Requirements

1. Status transitions must be enforced (cannot skip states)
2. Role-based authorization on EVERY endpoint
3. Data filtering (teachers see own school only, maintenance see own tasks only)
4. Email notifications for status changes
5. Audit logging for all changes
6. Task start_date update only for maintenance staff

---

## Error Responses

All errors return:
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "status": 400
}

Common codes: UNAUTHORIZED (401), FORBIDDEN (403), NOT_FOUND (404), VALIDATION_ERROR (400)

---

## See Also
- PERMISSIONS.md - Complete role-based access control matrix
- Entity schemas in /entities folder
- Mock implementation in src/api/mockBase44.js (reference data flow)
