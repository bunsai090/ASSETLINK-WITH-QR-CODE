/**
 * Demo seed data for local development.
 * Used by the mock Base44 client when no real backend is available.
 */

export const DEMO_USERS = [
    {
        id: 'user_teacher_001',
        email: 'teacher@assetlink.ph',
        full_name: 'Juan Dela Cruz',
        role: 'teacher',
        created_date: '2025-01-15T08:00:00Z',
    },
    {
        id: 'user_principal_001',
        email: 'principal@assetlink.ph',
        full_name: 'Principal Maria',
        role: 'principal',
        created_date: '2025-01-15T08:00:00Z',
    },
    {
        id: 'user_maintenance_001',
        email: 'maintenance@assetlink.ph',
        full_name: 'Maintenance Staff Pedro',
        role: 'maintenance',
        created_date: '2025-01-15T08:00:00Z',
    }
];

// Fallback for mock backend initial setup if needed
export const DEMO_USER = DEMO_USERS[0];

export const SEED_SCHOOLS = [
    { id: 'sch_001', name: 'Mabini Elementary School', address: 'Brgy. Mabini, Quezon City', principal_name: 'Maria Santos', contact_email: 'msantos@deped.gov.ph', contact_number: '0917-123-4567', division: 'NCR - Quezon City', created_date: '2025-01-15T08:00:00Z' },
    { id: 'sch_002', name: 'Rizal National High School', address: 'Brgy. Rizal, Manila', principal_name: 'Jose Reyes', contact_email: 'jreyes@deped.gov.ph', contact_number: '0918-234-5678', division: 'NCR - Manila', created_date: '2025-02-10T08:00:00Z' },
    { id: 'sch_003', name: 'Bonifacio Integrated School', address: 'Brgy. Bonifacio, Makati', principal_name: 'Ana Gomez', contact_email: 'agomez@deped.gov.ph', contact_number: '0919-345-6789', division: 'NCR - Makati', created_date: '2025-03-05T08:00:00Z' },
];

export const SEED_ASSETS = [
    { id: 'ast_001', name: 'Student Armchair (Monoblock)', asset_code: 'CHR-001', category: 'Furniture', condition: 'Good', location: 'Room 101', school_id: 'sch_001', school_name: 'Mabini Elementary School', description: 'Standard student monoblock armchair', is_active: true, created_date: '2025-02-01T08:00:00Z' },
    { id: 'ast_002', name: 'Teacher\'s Desk (Wooden)', asset_code: 'DSK-001', category: 'Furniture', condition: 'Fair', location: 'Room 102', school_id: 'sch_001', school_name: 'Mabini Elementary School', description: 'Wooden teacher desk with drawer', is_active: true, created_date: '2025-02-01T08:00:00Z' },
    { id: 'ast_003', name: 'LCD Projector (Epson)', asset_code: 'PRJ-001', category: 'Electronics', condition: 'Excellent', location: 'AVR', school_id: 'sch_001', school_name: 'Mabini Elementary School', description: 'Epson EB-X51 LCD Projector', is_active: true, created_date: '2025-02-15T08:00:00Z' },
    { id: 'ast_004', name: 'Desktop Computer', asset_code: 'PC-001', category: 'Electronics', condition: 'Good', location: 'Computer Lab', school_id: 'sch_002', school_name: 'Rizal National High School', description: 'Desktop PC for computer lab', is_active: true, created_date: '2025-03-01T08:00:00Z' },
    { id: 'ast_005', name: 'Science Lab Microscope', asset_code: 'MIC-001', category: 'Laboratory Equipment', condition: 'Poor', location: 'Science Lab', school_id: 'sch_002', school_name: 'Rizal National High School', description: 'Compound microscope for biology', is_active: true, created_date: '2025-03-01T08:00:00Z' },
    { id: 'ast_006', name: 'Basketball Goal', asset_code: 'SPT-001', category: 'Sports Equipment', condition: 'Damaged', location: 'Gymnasium', school_id: 'sch_002', school_name: 'Rizal National High School', description: 'Adjustable basketball goal', is_active: true, created_date: '2025-03-10T08:00:00Z' },
    { id: 'ast_007', name: 'Air Conditioning Unit', asset_code: 'AC-001', category: 'Appliances', condition: 'Fair', location: 'Principal Office', school_id: 'sch_003', school_name: 'Bonifacio Integrated School', description: '2HP split-type inverter AC', is_active: true, created_date: '2025-04-01T08:00:00Z' },
    { id: 'ast_008', name: 'Whiteboard (Wall-Mounted)', asset_code: 'WB-001', category: 'Furniture', condition: 'Good', location: 'Room 201', school_id: 'sch_003', school_name: 'Bonifacio Integrated School', description: '4ft x 8ft magnetic whiteboard', is_active: true, created_date: '2025-04-01T08:00:00Z' },
    { id: 'ast_009', name: 'Library Bookshelf', asset_code: 'SHF-001', category: 'Furniture', condition: 'Excellent', location: 'Library', school_id: 'sch_001', school_name: 'Mabini Elementary School', description: 'Steel bookshelf 5-layer', is_active: true, created_date: '2025-04-15T08:00:00Z' },
    { id: 'ast_010', name: 'Ceiling Fan', asset_code: 'FAN-001', category: 'Appliances', condition: 'Condemned', location: 'Room 103', school_id: 'sch_001', school_name: 'Mabini Elementary School', description: 'Industrial ceiling fan', is_active: true, created_date: '2025-05-01T08:00:00Z' },
];

export const SEED_REPAIR_REQUESTS = [
    { id: 'rr_001', request_number: 'RR-100001', asset_id: 'ast_002', asset_name: 'Teacher\'s Desk (Wooden)', asset_code: 'DSK-001', school_name: 'Mabini Elementary School', reported_by_email: 'teacher@assetlink.ph', reported_by_name: 'Juan Dela Cruz', description: 'Drawer handle broken, difficult to open. Splinters on the edge.', priority: 'Medium', status: 'Pending', created_date: '2025-11-20T08:00:00Z' },
    { id: 'rr_002', request_number: 'RR-100002', asset_id: 'ast_005', asset_name: 'Science Lab Microscope', asset_code: 'MIC-001', school_name: 'Rizal National High School', reported_by_email: 'teacher1@deped.gov.ph', reported_by_name: 'Ana Reyes', description: 'Focus knob is stuck and the eyepiece lens has scratches.', priority: 'High', status: 'In Progress', created_date: '2025-11-18T08:00:00Z' },
    { id: 'rr_003', request_number: 'RR-100003', asset_id: 'ast_006', asset_name: 'Basketball Goal', asset_code: 'SPT-001', school_name: 'Rizal National High School', reported_by_email: 'coach@deped.gov.ph', reported_by_name: 'Mark Rivera', description: 'Backboard cracked during PE class. Rim is bent.', priority: 'Critical', status: 'Pending', created_date: '2025-11-22T08:00:00Z' },
    { id: 'rr_004', request_number: 'RR-100004', asset_id: 'ast_010', asset_name: 'Ceiling Fan', asset_code: 'FAN-001', school_name: 'Mabini Elementary School', reported_by_email: 'teacher@assetlink.ph', reported_by_name: 'Juan Dela Cruz', description: 'Fan making loud grinding noise, blades wobbling dangerously. Safety hazard for students.', priority: 'Critical', status: 'Escalated', created_date: '2025-11-10T08:00:00Z', escalated_reason: 'Requires budget approval for replacement' },
    { id: 'rr_005', request_number: 'RR-100005', asset_id: 'ast_007', asset_name: 'Air Conditioning Unit', asset_code: 'AC-001', school_name: 'Bonifacio Integrated School', reported_by_email: 'staff@deped.gov.ph', reported_by_name: 'Lisa Garcia', description: 'AC not cooling properly, leaking water from indoor unit.', priority: 'High', status: 'Completed', created_date: '2025-10-15T08:00:00Z', completed_date: '2025-10-25T08:00:00Z' },
    { id: 'rr_006', request_number: 'RR-100006', asset_id: 'ast_001', asset_name: 'Student Armchair (Monoblock)', asset_code: 'CHR-001', school_name: 'Mabini Elementary School', reported_by_email: 'teacher@assetlink.ph', reported_by_name: 'Juan Dela Cruz', description: 'Armrest snapped off, chair is unstable.', priority: 'Low', status: 'Completed', created_date: '2025-09-12T08:00:00Z', completed_date: '2025-09-18T08:00:00Z' },
    // EXAMPLES: Awaiting teacher verification and another escalation
    { id: 'rr_007', request_number: 'RR-100007', asset_id: 'ast_003', asset_name: 'LCD Projector (Epson)', asset_code: 'PRJ-001', school_name: 'Mabini Elementary School', reported_by_email: 'teacher2@deped.gov.ph', reported_by_name: 'Maria Reyes', description: 'Projector light bulb burned out. No display output.', priority: 'High', status: 'In Progress', created_date: '2025-12-01T08:00:00Z', teacher_confirmation: false },
    { id: 'rr_008', request_number: 'RR-100008', asset_id: 'ast_004', asset_name: 'Desktop Computer', asset_code: 'PC-001', school_name: 'Rizal National High School', reported_by_email: 'teacher3@deped.gov.ph', reported_by_name: 'Carlo Santos', description: 'Computer won\'t start. Possible power supply failure. Needed for IT class.', priority: 'Critical', status: 'Escalated', created_date: '2025-11-28T08:00:00Z', escalated_reason: 'Critical - supplier requires PO for replacement parts. Exceeds school maintenance budget.' },
];

export const SEED_TASKS = [
    { id: 'tsk_001', asset_id: 'ast_002', asset_name: 'Teacher\'s Desk (Wooden)', asset_code: 'DSK-001', school_name: 'Mabini Elementary School', repair_request_id: 'rr_001', assigned_to_email: 'maintenance@assetlink.ph', assigned_to_name: 'Maintenance Staff Pedro', status: 'Assigned', priority: 'Medium', notes: 'Replace drawer handle and sand down splinters', created_date: '2025-11-21T08:00:00Z' },
    { id: 'tsk_002', asset_id: 'ast_005', asset_name: 'Science Lab Microscope', asset_code: 'MIC-001', school_name: 'Rizal National High School', repair_request_id: 'rr_002', assigned_to_email: 'tech@deped.gov.ph', assigned_to_name: 'Pedro Santos', status: 'In Progress', priority: 'High', notes: 'Need to order replacement eyepiece', created_date: '2025-11-19T08:00:00Z' },
    { id: 'tsk_003', asset_id: 'ast_007', asset_name: 'Air Conditioning Unit', asset_code: 'AC-001', school_name: 'Bonifacio Integrated School', repair_request_id: 'rr_005', assigned_to_email: 'maintenance@assetlink.ph', assigned_to_name: 'Maintenance Staff Pedro', status: 'Completed', priority: 'High', notes: 'Refilled refrigerant and fixed drain pipe', created_date: '2025-10-16T08:00:00Z', completed_date: '2025-10-25T08:00:00Z' },
    { id: 'tsk_004', asset_id: 'ast_001', asset_name: 'Student Armchair (Monoblock)', asset_code: 'CHR-001', school_name: 'Mabini Elementary School', repair_request_id: 'rr_006', assigned_to_email: 'maintenance@assetlink.ph', assigned_to_name: 'Maintenance Staff Pedro', status: 'Completed', priority: 'Low', notes: 'Replaced with spare chair from storage', created_date: '2025-09-13T08:00:00Z', completed_date: '2025-09-18T08:00:00Z' },
    // EXAMPLE: Task awaiting teacher verification (new feature)
    { id: 'tsk_005', asset_id: 'ast_003', asset_name: 'LCD Projector (Epson)', asset_code: 'PRJ-001', school_name: 'Mabini Elementary School', repair_request_id: 'rr_007', assigned_to_email: 'maintenance@assetlink.ph', assigned_to_name: 'Maintenance Staff Pedro', status: 'Pending Teacher Verification', priority: 'High', notes: 'Replaced light bulb and tested connectivity', created_date: '2025-12-01T08:00:00Z', verified_by_email: null, teacher_confirmation: false },
];
