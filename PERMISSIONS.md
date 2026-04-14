# Authorization & Permissions Matrix

Complete role-based access control for AssetLink.

## Roles

- admin: Full system access
- principal: School-level management & repair approval
- supervisor: Multi-school regional oversight
- teacher: Report damage, verify repairs
- maintenance: Manage assigned tasks, reschedule repairs

---

## Entity Permissions

### Asset
- List: admin, principal, supervisor, teacher (filtered by school)
- Create: admin, supervisor
- Update: admin, supervisor
- Delete: admin only

### RepairRequest
- Create: admin, teacher (own school)
- View: admin, principal, supervisor (filtered), reporter, maintenance (their tasks only)
- Approve: admin, principal
- Reject: admin, principal
- Escalate: admin, principal, supervisor
- Verify (teacher): only original reporter

### MaintenanceTask
- List: admin, principal, supervisor (all); maintenance (own tasks)
- Create: admin, principal (via repair approval)
- Update: assigned maintenance, admin
- Initial Schedule: PRINCIPAL ONLY — set `scheduled_start_date` and `sla_deadline` during approval.
- Reschedule (calendar): MAINTENANCE ONLY — must provide `reschedule_notes`.

### School
- View/List: admin, principal, supervisor (filtered), teacher (own school)
- Create/Update: admin, supervisor
- Delete: admin only

---

## Key Rules (Backend Must Enforce)

1. CALENDAR RESCHEDULE: Only role === 'maintenance' can PUT /tasks/:id/start_date.
   - Requirement: Must provide `reschedule_notes` if new `start_date` > `sla_deadline`.
   - Increment: `reschedule_count` must be incremented.
   - Email: Notify principal of SLA breach via `Core.SendEmail`.

2. INITIAL SCHEDULING: Only role === 'principal' or 'admin' can set `scheduled_start_date` and `sla_deadline`.
   - Maintenance role CANNOT modify these fields after creation.

2. DATA FILTERING:
   - Teachers: see own school assets + own repair requests only
   - Maintenance: see assigned tasks only
   - Principal: see own school data only  
   - Supervisor: see assigned division only

3. STATUS TRANSITIONS:
   - RepairRequest: Pending -> Approved -> In Progress -> Completed|Rejected|Escalated
   - MaintenanceTask: Assigned -> In Progress -> Completed|Pending Teacher Verification

4. TEACHER VERIFICATION:
   - Only original reporter can verify repair
   - Task must be in 'Pending Teacher Verification' status
   - Teacher can approve (mark Completed) or reject (back to In Progress with feedback)

5. EMAIL NOTIFICATIONS:
   - Critical damage -> Principal
   - Status changes -> Reporter
   - Task completion -> Teacher
   - Rework request -> Maintenance

6. AUDIT LOGGING:
   - Log: who, what, when, IP address for all entity changes
   - Store in audit_logs table
   - Use for compliance + fraud prevention

---

## Testing Checklist

- [ ] Unauthorized role gets 403
- [ ] Data filtering works (no cross-school/region leakage)
- [ ] Status transitions enforced
- [ ] Calendar reschedule blocks non-maintenance
- [ ] Emails sent to correct recipients
- [ ] Audit logs record changes
- [ ] Teacher verification blocks other users

See API_SPECIFICATION.md for complete endpoint details.
