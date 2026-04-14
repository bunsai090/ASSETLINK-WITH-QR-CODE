# End-to-End Workflow Validation Guide

**Purpose:** Verify all 7 core workflows function correctly before backend handoff.

**Prerequisites:**
- App running: `npm run dev` ? http://localhost:5173
- Mock mode enabled (no real Base44 backend needed)
- Demo logins available (any password)

---

## Workflow 1: QR Code Asset Identification

**Test Steps:**
1. Login as `teacher@school.local`
2. Navigate to **Report Damage**
3. Click "Scan QR Code" button
4. Verify camera placeholder appears with guidance text
5. ? Expected: UI shows camera frame + "Point camera at asset QR code" text

**Status:** ? Frontend complete (camera integration pending for backend)

---

## Workflow 2: Automated Repair Ticket Generation

**Test Steps:**
1. Login as `teacher@school.local`
2. Go to **Report Damage**
3. Fill form:
   - Asset: Select any asset from dropdown
   - School: Auto-populated to teacher's school
   - Damage Type: "Structural Damage"
   - Priority: "High"
   - Description: "Broken classroom door"
4. Click **"Submit Repair Request"**
5. Verify redirect to **Repair Requests** page
6. ? Expected: New repair ticket visible in list with status "Pending"

**Status:** ? Frontend complete (backend saves to database)

---

## Workflow 3: Real-Time Notifications to Principals

**Test Steps:**
1. With teacher logged in, submit a repair request (see Workflow 2)
2. Check browser console (F12 ? Console tab)
3. Note log: `SendEmail: Sent to principal...`
4. Login as `principal@school.local`
5. Go to **Repair Requests** ? Should see the new ticket
6. ? Expected: Principal sees notification ticket appeared in their list

**Status:** ? Frontend logs notification trigger (backend sends actual email)

---

## Workflow 4: Structured Workflow + Escalation

**Test Steps:**

### Part A: Status Transitions (Pending ? Approved)
1. Login as `principal@school.local`
2. Go to **Repair Requests**
3. Find a "Pending" ticket
4. Click ticket ? see "Approve" button
5. Click **Approve**
6. ? Expected: Status changes to "Approved", task created for maintenance

### Part B: Escalation Queue
1. Go to **Supervisor** (admin/supervisor only)
2. Check if any repairs show priority "Critical"
3. If critical repairs exist, look for **Escalation Queue** section (red box)
4. ? Expected: Critical/escalated repairs appear in red-highlighted section at bottom

### Part C: Verify Escalation Works
1. Seed data includes 2 escalated repairs
2. Login as `supervisor@barangay.local`
3. Go to **Oversight**
4. See "Escalation Queue" with items showing reasons
5. ? Expected: Each escalated repair shows reason (e.g., "Requires budget approval")

**Status:** ? Workflow implemented with escalation logic

---

## Workflow 5: Teacher Verification System

**Test Steps:**

### Part A: Maintenance Completes Task
1. Login as `maintenance@school.local`
2. Go to **My Tasks**
3. Find an "In Progress" task
4. Click **"Mark as Completed"**
5. ? Expected: Status changes to **"Pending Teacher Verification"** (NOT "Completed")
6. Check console: Should log `SendEmail: Sent to teacher...`

### Part B: Teacher Verifies/Rejects
1. Login as `teacher@school.local`
2. Go to **Repair Requests** ? find "Pending Teacher Verification" ticket
3. Click ticket ? see **"Verify Repair Completion"** dialog
4. Option A: Click **"Approve"** ? Status becomes "Completed" ?
5. Option B: Click **"Reject"** ? Dialog for rejection reason appears
6. If rejected: Enter feedback + click **"Reject"** ? Status returns to "In Progress" ?
7. Check console: Should log `SendEmail: Sent to maintenance with rejection reason`

**Status:** ? Teacher verification workflow fully implemented

---

## Workflow 6: Multi-Level Monitoring & Supervisor Access

**Test Steps:**

### Part A: Dashboard Access Control
1. Login as `teacher@school.local`
2. Verify **"Oversight"** menu item NOT visible ?
3. Logout, login as `admin@admin.local`
4. Verify **"Oversight"** menu item IS visible ?
5. Login as `supervisor@barangay.local`
6. Verify **"Oversight"** menu item IS visible ?

### Part B: Supervisor Dashboard Features
1. Login as `supervisor@barangay.local`
2. Go to **Oversight**
3. Verify elements visible:
   - 4 KPI cards: Total, Escalated, Avg Resolution, Critical ?
   - Status pie chart ?
   - Per-school metrics bar chart ?
   - School filter buttons ?
   - Timeline chart (14-day activity) ?
   - Resource allocation chart (costs by school) ?
4. Click school filter button ? Dashboard updates to show only that school ?

### Part C: Escalation Queue Visibility
1. On Oversight dashboard
2. If escalated > 0, see red "Escalation Queue" section ?
3. Escalated repairs list shows: asset, school, priority, reason ?

**Status:** ? Multi-level monitoring fully accessible and functional

---

## Workflow 7: Analytics & Reporting

**Test Steps:**

### Part A: Supervisor Analytics
1. Login as `supervisor@barangay.local`
2. Go to **Oversight**
3. Check KPI cards calculate correctly:
   - **Total Repairs** = count of all repairs ?
   - **Escalated** = count where status = "Escalated" ?
   - **Avg Resolution** = (completed_date - created_date) / count ?
   - **Critical Open** = count where priority = "Critical" + status ? "Completed" ?

### Part B: Chart Accuracy
1. **Status Distribution (Pie)**: Count matches totals by status ?
2. **Per-School Metrics (Bar)**: Stacked bars show pending/approved/in-progress/completed breakdown ?
3. **Timeline (Line)**: Shows new repairs vs completed over 14 days ?
4. **Costs (Bar)**: Shows estimated costs per school ?

### Part C: Admin Analytics
1. Login as `admin@admin.local`
2. Go to **Analytics** page
3. Verify admin sees same metrics + system-wide totals ?

**Status:** ? Analytics fully functional and accurate

---

## Permission Enforcement Tests

### Calendar Reschedule (Maintenance Only)

**Test Steps:**
1. Login as `teacher@school.local`
2. Go to **Calendar**
3. Verify all tasks show **"View Only"** banner ?
4. Attempt to drag task ? Drag disabled, shows blue banner ?
5. Logout, login as `maintenance@school.local`
6. Go to **Calendar**
7. Verify drag-and-drop ENABLED ?
8. Drag a task to different day ? Status updates ?

**Status:** ? Permission enforcement working

---

## Integration Checklist

- [x] QR scanner UI placeholder created (camera integration for backend)
- [x] Repair tickets auto-generated from damage reports
- [x] Principal notifications triggered on new report
- [x] Status transitions follow defined workflow (Pending ? Approved ? In Progress)
- [x] Escalation logic identifies critical/budget-requiring repairs
- [x] Teacher verification requires approval before completion
- [x] Supervisor dashboard shows multi-school overview
- [x] Calendar reschedule restricted to maintenance only
- [x] Analytics calculate correct metrics
- [x] Email notifications logged (backend implements actual sending)
- [x] Role-based filtering prevents cross-school data leakage
- [x] All navigation items visible/hidden per role

---

## Known Limitations (Backend To-Do)

1. **QR Scanner Camera**: Currently a placeholder. Backend should integrate `react-qr-reader` library to activate actual camera input.

2. **Real Asset Lookup**: QR decode returns asset_id, but backend must validate asset exists and return details to auto-populate form.

3. **Email Sending**: Frontend logs `.SendEmail()` calls. Backend must implement actual email service integration.

4. **Database Persistence**: Mock data stored in localStorage. Backend must implement persistent database with schema matching /entities folder.

5. **Real-Time Updates**: Supervisor dashboard fetches data on mount. Backend should implement WebSocket or polling for live updates.

6. **Audit Logging**: All changes logged in frontend. Backend must persist audit logs to database.

---

## Test Completion Criteria

? **All workflows pass**: All 7 workflows execute without errors
? **Permission enforcement**: Role-based access and data filtering prevents unauthorized access
? **Status transitions**: Repair status follows defined workflow (no skipped states)
? **Teacher verification**: Repairs cannot be marked complete without teacher approval
? **Supervisor visibility**: Oversight dashboard shows correct metrics and escalations
? **Analytics accuracy**: KPI calculations match manual counts
? **No console errors**: Browser console F12 shows no JavaScript errors
? **All pages load**: All navigation items work and display correctly

---

## Browser Testing

Open http://localhost:5173 in:
- ? Chrome/Edge (tested)
- ?? Firefox (should work, responsive design browser-agnostic)
- ?? Mobile Safari (responsive layout in place, test on device)

---

## Demo User Logins

Use any password (e.g., `password`):

| Role | Email | Access |
|------|-------|--------|
| Teacher | teacher@school.local | Report, Verify, View Requests |
| Principal | principal@school.local | Report, Approve, View Analytics |
| Maintenance | maintenance@school.local | View Calendar, Complete Tasks |
| Supervisor | supervisor@barangay.local | Oversight Dashboard |
| Admin | admin@admin.local | All features |

---

## Next Steps After Validation

? **If all tests pass**: Frontend is ready for backend handoff
   - Backend team implements API endpoints per API_SPECIFICATION.md
   - Backend team enforces permissions per PERMISSIONS.md
   - Backend implements database schema per /entities folder

?? **If tests fail**: Fix identified issues before backend starts
   - Check error messages in browser console (F12)
   - Verify seed data has required fields
   - Confirm authentication context is configured correctly
