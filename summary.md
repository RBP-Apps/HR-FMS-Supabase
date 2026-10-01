# RBP HR-FMS (Human Resources & Facility Management System)
## End-to-End System Flow, Business Logic & Architecture Documentation

---

### Document Overview & Purpose
This document provides a comprehensive, reverse-engineered specification of the **RBP HR-FMS** software system based strictly on the active codebase (`HR-FMS-Supabase-main`). It details the operational journeys, data models, state transitions, business rules, calculations, role authorizations, and inter-module dependencies without assumptions or modifications to the existing codebase.

---

# Table of Contents
1. [System Architecture & Technology Stack](#1-system-architecture--technology-stack)
2. [Complete System Flow (Master Workflows)](#2-complete-system-flow-master-workflows)
   - 2.1 [Recruitment & Onboarding Journey](#21-recruitment--onboarding-journey)
   - 2.2 [Time & Attendance Tracking Lifecycle](#22-time--attendance-tracking-lifecycle)
   - 2.3 [Leave Management & Approvals Workflow](#23-leave-management--approvals-workflow)
   - 2.4 [Employee Lifecycle, Engagement & Celebrations](#24-employee-lifecycle-engagement--celebrations)
   - 2.5 [Resignation & Offboarding Clearance Workflow](#25-resignation--offboarding-clearance-workflow)
   - 2.6 [Payroll Generation, Processing & Payout Lifecycle](#26-payroll-generation-processing--payout-lifecycle)
   - 2.7 [System Administration, Masters & User Provisioning](#27-system-administration-masters--user-provisioning)
3. [Module-by-Module Deep Dive](#3-module-by-module-deep-dive)
   - [Step 01: Authentication (`Login.jsx`)](#step-01-authentication-loginjsx)
   - [Step 02: Executive Dashboard (`Dashboard.jsx`)](#step-02-executive-dashboard-dashboardjsx)
   - [Step 03: Job Requisition / Indent (`Indent.jsx`)](#step-03-job-requisition--indent-indentjsx)
   - [Step 04: Candidate Enquiry & Applicant Pool (`FindEnquiry.jsx`)](#step-04-candidate-enquiry--applicant-pool-findenquiryjsx)
   - [Step 05: Interview & Call Tracker (`CallTracker.jsx`)](#step-05-interview--call-tracker-calltrackerjsx)
   - [Step 06: Offer & Confirmation Letters (`OfferLetter.jsx`)](#step-06-offer--confirmation-letters-offerletterjsx)
   - [Step 07: Employee Joining / Master Onboarding (`Joining.jsx`)](#step-07-employee-joining--master-onboarding-joiningjsx)
   - [Step 08: Onboarding Checklist & Assets (`AfterJoiningWork.jsx`)](#step-08-onboarding-checklist--assets-afterjoiningworkjsx)
   - [Step 09: Master Employee Directory (`Employee.jsx`)](#step-09-master-employee-directory-employeejsx)
   - [Step 10: Daily Attendance & GPS Field Audit (`Attendancedaily.jsx`)](#step-10-daily-attendance--gps-field-audit-attendancedailyjsx)
   - [Step 11: Monthly Attendance Grid & Finalization (`AttendancedailyManagement.jsx`)](#step-11-monthly-attendance-grid--finalization-attendancedailymanagementjsx)
   - [Step 12: Approvals Center (`LeaveManagement.jsx`)](#step-12-approvals-center-leavemanagementjsx)
   - [Step 13: Resignation Approval (`ResignationApproval.jsx`)](#step-13-resignation-approval-resignationapprovaljsx)
   - [Step 14: Offboarding Checklist (`AfterResignationWork.jsx`)](#step-14-offboarding-checklist-afterresignationworkjsx)
   - [Step 15: Monthly Payroll Processing & Payslips (`Payroll.jsx`)](#step-15-monthly-payroll-processing--payslips-payrolljsx)
   - [Step 16: Post-Disbursement / After Payment Grid (`AfterPayment.jsx`)](#step-16-post-disbursement--after-payment-grid-afterpaymentjsx)
   - [Step 17: WhatsApp Birthday Wishes (`BirthdayWish.jsx`)](#step-17-whatsapp-birthday-wishes-birthdaywishjsx)
   - [Step 18: WhatsApp Work Anniversary Wishes (`WorkAnniversary.jsx`)](#step-18-whatsapp-work-anniversary-wishes-workanniversaryjsx)
   - [Step 19: Master Data Management (`Master.jsx`)](#step-19-master-data-management-masterjsx)
   - [Step 20: User Management & Portal Access (`AddUsers.jsx`)](#step-20-user-management--portal-access-addusersjsx)
   - [Step 21: Reports Dashboard (`Report.jsx`)](#step-21-reports-dashboard-reportjsx)
4. [Inter-Page Relationships & ID Propagation](#4-inter-page-relationships--id-propagation)
5. [Business Logic & Mathematical Formulations](#5-business-logic--mathematical-formulations)
6. [Role-Based Access Control (RBAC) Matrix](#6-role-based-access-control-rbac-matrix)
7. [Comprehensive Data Dictionary](#7-comprehensive-data-dictionary)
8. [Special Technical Logic & Automated Integrations](#8-special-technical-logic--automated-integrations)
9. [Page Index & Navigation Route Map](#9-page-index--navigation-route-map)
10. [Master System Flow Diagram](#10-master-system-flow-diagram)

---

# 1. System Architecture & Technology Stack

### Frontend Architecture
- **Framework & Core**: React 18 SPA bundled with Vite.
- **Routing**: React Router v6 (`react-router-dom`) with client-side session checks via `ProtectedRoute.jsx`.
- **Styling**: Tailwind CSS, Lucide React icons, and selected Ant Design components (`antd`).
- **State Management**: Local React state (`useState`, `useEffect`, `useMemo`) combined with Zustand (`authStore.js`) and Browser LocalStorage (`localStorage.getItem('user')`).
- **Data Export & Document Generation**:
  - `xlsx` for Excel parsing and formatted workbooks.
  - `jspdf` and `html2canvas` for dynamic PDF generation (Offer Letters, Confirmation Letters, Payslips).
  - HTML5 Canvas 2D Rendering Engine for automated greeting cards.
- **External Communications**:
  - **EmailJS** (`@emailjs/browser`) for dispatching PDF offer and confirmation letters directly to candidate email addresses.
  - **Supabase Edge Functions** for Meta WhatsApp Cloud API greeting dispatches.

### Backend & Persistence Layer
- **BaaS Platform**: Supabase (PostgreSQL 15+).
- **Client Protocol**: Supabase JS SDK (`@supabase/supabase-js`) connecting directly via project URL and public Anon key.
- **Storage Buckets**:
  - `candidate-files`: Candidate resumes, identity proofs, and interview documentation.
  - `letter`: Generated PDF Offer Letters and Confirmation Letters.
  - `joining-documents`: Employee KYC identity docs (Aadhar, PAN, Bank Passbook, Cheques, Driving License, Photo).
  - `assets`: Employee onboarding and offboarding clearance documents, signed handover receipts, and PDC scans.
  - `birthday-wishes`: Dynamically generated PNG greeting cards for birthday and work anniversary WhatsApp dispatches.
- **Database Triggers**:
  - `prevent_inactive_leave_ledger_insert`: Trigger on table `leave_ledger` preventing ledger credit/debit inserts if employee status in `joining` is `'Inactive'`.
  - `cleanup_leave_ledger_on_inactive`: Trigger on table `joining` executing after update to `'Inactive'`, purging future unfinalized leave ledger records.

---

# 2. Complete System Flow (Master Workflows)

The RBP HR-FMS system orchestrates the entire employment lifecycle across seven interdependent tracks:

```text
               RECRUITMENT & ONBOARDING
                     (Steps 03-08)
                          │
                          ▼
               EMPLOYEE MASTER DIRECTORY
                        (Step 09)
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ATTENDANCE         LEAVES          ENGAGEMENT
   (Steps 10-11)    (Steps 12-13)    (Steps 17-18)
         │                │
         └────────┬───────┘
                  ▼
               PAYROLL
            (Steps 15-16)
                  │
                  ▼
             OFFBOARDING
            (Steps 13-14)
```

---

## 2.1 Recruitment & Onboarding Journey

```text
[ Department Need / HOD ]
            │
            ▼
[ Indent.jsx ] ── (Generates REC-xx) ──> Stored in `indent` table
            │
            ▼
[ FindEnquiry.jsx ] ── (Source candidate / Form submission)
   ├── Generates Candidate Enquiry (ENQ-xx) or Custom Post Indent (AAP-xx)
   ├── Uploads resume/photo to `candidate-files` bucket
   └── Stored in `enquiry` table (Status: Pending)
            │
            ▼
[ CallTracker.jsx ] ── (HR calls candidate & schedules interview)
   ├── Records call logs, follow-up dates, remarks in `follow_up` table
   └── Changes `enquiry.status`:
         ├── "Call Not Picked / Follow Up" ──> Loops in Call Tracker
         ├── "Rejected / Not Interested" ──> Archive in History
         └── "Selected / Joining" ──> Prompts Offer Letter & Joining
            │
            ▼
[ OfferLetter.jsx ] ── (Optional Step: Formal Offer Issuance)
   ├── Generates 2-Page branded Offer/Confirmation PDF via html2canvas + jsPDF
   ├── Saves record to `offer_letters` / `confirmation_letters`
   └── Dispatches PDF attachment to candidate email via EmailJS
            │
            ▼
[ Joining.jsx ] ── (Candidate arrives on Day 1)
   ├── Generates official Employee ID (RBP-xx)
   ├── Captures personal, family, statutory (PF/ESIC/Bank), salary details
   ├── Uploads KYC docs to `joining-documents` bucket
   ├── Inserts master row into `joining` table (status: 'Active')
   └── Updates source `enquiry.actual_2` with DOJ to move enquiry to history
            │
            ▼
[ AfterJoiningWork.jsx ] ── (9-Item Onboarding Execution Checklist)
   ├── 1. Previous Salary Slip Check
   ├── 2. Offer Letter Handover
   ├── 3. Welcome Meeting Conducted
   ├── 4. Biometric Punch Enrolled (punch_id mapped)
   ├── 5. Official Email ID Generated
   ├── 6. Company Assets Issued (Laptop, Mobile, SIM, Uniform) ──> saved to `assets` table
   ├── 7. PF / ESIC Portal Registration
   ├── 8. Employee Directory Listing Checked
   └── 9. Post-Dated Cheque (PDC) Collected & Cheque Scan Uploaded
            │
            ▼ (When items 1-8 are completed)
   Sets `joining.actual_date` to today's timestamp
   (Candidate is now a 100% verified, active permanent employee)
```

---

## 2.2 Time & Attendance Tracking Lifecycle

The system operates a dual-source attendance model based on `employee_category`:
1. **Office Staff**: Tracked via physical biometric machine (`offline_biometric_punch`).
2. **Field Staff**: Tracked via Mobile GPS check-ins (`attendance`, `location_logs`, `tracking_sessions`).

```text
                  EMPLOYEE CHECK-IN
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    [ Office Staff ]               [ Field Staff ]
  Biometric Machine Punch        Mobile App GPS Check-In
          │                               │
          ▼                               ▼
`offline_biometric_punch`             `attendance`
(punch_time, punch_state)         (punch_in, punch_out, GPS)
          │                               │
          └───────────────┬───────────────┘
                          ▼
           [ useAttendanceData.js Engine ]
  Compiles daily timeline, punches, working durations
  Evaluates 7-tier status priority:
    1. Pre-DOJ / Post-Leaving ──> Excluded ("-")
    2. Manual HR Override ──> Corrected Status
    3. Holiday Calendar ──> "H" (holiday_master)
    4. Approved Leave ──> "CL" (emp_leaving_holiday)
    5. Present vs Half Day:
       ├── IN exists & (OUT >= 16:00 or > 6.5h) ──> "P"
       └── IN exists & (OUT < 16:00 or missing OUT) ──> "HD"
    6. Sunday Rule ──> "WO" (Weekly Off)
    7. Default ──> "A" (Absent)
                          │
                          ▼
           [ Late Arrivals Evaluation ]
  Check-in between 09:46 AM and 12:30 PM:
    ├── Late waiver granted in `late_attendance_approval`? ──> Waived
    └── Unapproved lates counted: Every 4 Lates = 0.5 Day Paid Deduction
                          │
                          ▼
           [ Monthly Finalization Lock ]
  HR verifies grid on AttendancedailyManagement.jsx
  Clicks "Finalize Attendance":
    ├── Inserts summary snapshots into `final_attendance`
    ├── Debits consumed CL leaves into `leave_ledger`
    └── Records lock event in `attendance_finalization_log`
```

---

## 2.3 Leave Management & Approvals Workflow

```text
[ Employee Application via Mobile App ]
                   │
                   ▼
       `emp_leaving_holiday` table
            (status: 'Pending')
                   │
                   ▼
     [ LeaveManagement.jsx (HR Portal) ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [ Rejected ]        [ Approved ]
         │                   │
Updates status = 'Rejected'  ├── Updates status = 'Approved'
                             ├── Calculates leave duration in days
                             └── Automatically inserts DEBIT transaction
                                 into `leave_ledger` table
                                 (Reduces employee's CL balance)
```

---

## 2.4 Employee Lifecycle, Engagement & Celebrations

```text
               DAILY CRON / HR TRIGGER
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[ BirthdayWish.jsx ]             [ WorkAnniversary.jsx ]
Compares today's date with       Compares today's date with
`joining.dob`                    `joining.date_of_joining`
         │                                 │
Filters active employees         Calculates years completed
celebrating today                and remaining milestone days
         │                                 │
         └────────────────┬────────────────┘
                          ▼
               [ Interactive Greeting Modal ]
       ├── Live HTML5 Canvas generates branded greeting card
       ├── Merges corporate logo, recipient name, photo & badges
       ├── Converts Canvas to Blob and uploads PNG to Supabase Storage
       └── Invokes Supabase Edge Function:
             ├── `send-birthday-wish`
             └── `send-work-anniversary-wish`
                          │
                          ▼
               Meta WhatsApp Cloud API
         Dispatches image card + personalized
            message to employee's WhatsApp
                          │
                          ▼
          Logs dispatch record into database
      (`birthday_wish` / `work_anniversary_wish`)
```

---

## 2.5 Resignation & Offboarding Clearance Workflow

```text
[ Employee Submits Resignation ] ──> Stored in `employee_leaving` (resignation_acceptance: false)
                   │
                   ▼
[ ResignationApproval.jsx ] ── (HR / Management Review)
   ├── Management reviews reason, joining date, and department
   ├── Clicks "Approve":
   │     ├── Sets `last_working_date`
   │     ├── Sets `fnf_date` (Full & Final Settlement Date)
   │     ├── Updates `employee_leaving.resignation_acceptance = true`
   │     └── Updates `joining.status = 'Inactive'` and `joining.leaving_date`
   │
   └── DB Trigger Fires: `cleanup_leave_ledger_on_inactive`
         Purges future unfinalized leave allocations for this employee
                   │
                   ▼
[ AfterResignationWork.jsx ] ── (7-Step Offboarding Checklist)
   ├── 1. Resignation Letter on Record
   ├── 2. Acceptance Letter Issued
   ├── 3. Resignation Reason Analyzed
   ├── 4. Official Notice Period Adherence Verified
   ├── 5. Company Assets Returned (Laptop, SIM, ID Card, Files)
   ├── 6. Handover Form Signed by HOD & Stored in `assets` bucket
   └── 7. Post-Dated Cheque (PDC) Returned / Handed Back to Employee
                   │
                   ▼ (When all clearance steps are done)
   Sets `employee_leaving.actual` date
   (Employee profile fully deactivated; ready for F&F settlement)
```

---

## 2.6 Payroll Generation, Processing & Payout Lifecycle

```text
[ Payroll.jsx Initialization ]
       ├── Fetches active employees from `joining` (status: 'Active')
       ├── Fetches approved paid days from `useAttendanceData.js` or `final_attendance`
       └── Loads employee base Gross Salary (`joining.salary`)
                   │
                   ▼
[ Automated Salary Breakdown (payrollCalc.js) ]
       ├── Base Structure (50% Basic, 20% HRA, 10% Conv, 15% Med, 5% Spec)
       ├── Earned Proration: (Component / Total Calendar Days) * Paid Days
       ├── Statutory Contributions:
       │     ├── EPF: Employee 12% | Employer 13% of Earned Basic
       │     └── ESIC: Employee 0.75% of Gross | Employer 3.25% of Basic
       ├── Overtime (OT) Additions
       ├── Deductions (Advances, Security Deposit, Other)
       └── Net Salary Payable = Gross Earned - Total Deductions
                   │
                   ▼
[ Review, Adjustment & Locking ]
       ├── HR edits allowances/deductions directly in interactive grid
       ├── Generates official PDF Payslip via `PayslipModal.jsx`
       ├── Exports payroll sheet to Excel for banking disbursement
       └── Clicks "Finalize Payroll" ──> Saves immutable record to `payroll_history`
                   │
                   ▼
[ AfterPayment.jsx ]
       ├── Imports bank disbursement payout sheet
       └── Maintains live cell-by-cell verification of disbursed salaries
```

---

## 2.7 System Administration, Masters & User Provisioning

```text
[ AddUsers.jsx ]
       ├── HR Portal Users (`users_hr`):
       │     ├── Username, password, department, WhatsApp number
       │     ├── Role assignment ('ADMIN', 'USER', 'MASTER')
       │     └── Page permissions (Comma-separated list or 'ALL')
       └── Employee App Users (`users_employee`):
             ├── Mapped to `joining.rbp_joining_id`
             └── Grants mobile attendance & leave application access
                   │
                   ▼
[ Master.jsx ]
       Maintains central organizational master tables (`master_hr`):
       ├── Departments & Designations
       ├── Corporate Legal Entities (Firms)
       ├── Head of Departments (HODs)
       ├── Sourcing Platforms / Social Sites
       ├── Candidate Follow-up Statuses
       └── Family Relationships
```

---

# 3. Module-by-Module Deep Dive

---

## Step 01: Authentication (`Login.jsx`)

### Purpose
Authenticates administrative and HR personnel, validates active account status, initializes the user session, and enforces role-based entry redirection.

### Entry Point
- URL: `/login` (Default landing page for unauthenticated sessions via `ProtectedRoute.jsx`).

### Input / Data
- `username`: Plaintext identifier matching `users_hr.username`.
- `password`: Plaintext password matching `users_hr.password`.

### Actions
1. **Login Submission**: Form submission via button or Enter key.
2. **Password Visibility Toggle**: Reveals/masks password characters.

### Logic
```text
User enters Username & Password
               │
               ▼
Query `users_hr` table:
.select('*').eq('username', username).eq('password', password).single()
               │
       ┌───────┴───────┐
       ▼               ▼
Record Not Found    Record Found
       │               │
Displays error toast   ├── Checks if `access === false`
                       │     └── If false: Aborts with "Account disabled" toast
                       ├── Formats user session object
                       ├── Writes session to `localStorage.setItem('user', JSON.stringify(userData))`
                       ├── Updates Zustand store: `authStore.login(userData)`
                       └── Redirects:
                             ├── If `role === 'admin'`: Redirects to `/` (Dashboard)
                             └── If `role !== 'admin'`: Redirects to first accessible page from `page` permissions string
```

### Status / State Changes
- Local storage session key `user` populated.
- Zustand store state `isAuthenticated` set to `true`.

### Database / API Operations
- **Table**: `users_hr`
- **Operation**: `SELECT *` with filters on `username` and `password`.

### Next Step
- Admin user lands on `Dashboard.jsx`.
- Restricted user lands on their designated operational page (e.g., `/find-enquiry` or `/call-tracker`).

---

## Step 02: Executive Dashboard (`Dashboard.jsx`)

### Purpose
Serves as the high-level executive control center, visualizing company-wide headcount, hiring velocity, attrition trends, departmental allocations, gender diversity, and daily employee celebrations.

### Entry Point
- URL: `/`
- Sidebar: "Dashboard" icon link.

### Input / Data
- Aggregates records from `joining`, `indent`, `employee_leaving`, and `holiday_master`.

### Actions
1. **Date Range Filter**: Select Start Date and End Date.
2. **Category / Department Filter**: Filters analytics by Field vs Office staff and specific departments.
3. **Export Analytics**: Exports current filtered metrics to CSV/Excel.
4. **Direct Celebration Link**: Click-through button from today's birthday banner to open the WhatsApp greeting modal.

### Logic
- Queries all employees from `joining` and computes:
  - **Total Active Headcount**: Count of rows where `status === 'Active'`.
  - **New Joinees This Month**: Joining dates falling within the active calendar month.
  - **Total Exits**: Count of records in `employee_leaving` with accepted resignations.
  - **Open Requisitions**: Count of rows in `indent` with status `'NeedMore'`.
- Calculates demographic distributions for Recharts visualizations (Bar Charts, Pie Charts, Trend Lines).
- Inspects `joining.dob` against today's day/month to render the "Today's Birthdays" alert list.

### Database / API Operations
- **Tables**: `joining`, `indent`, `employee_leaving`, `holiday_master`.
- **Operations**: `SELECT` queries across all records.

### Next Step
- HR proceeds to recruitment operations (`Indent.jsx` or `FindEnquiry.jsx`) or daily attendance checks.

---

## Step 03: Job Requisition / Indent (`Indent.jsx`)

### Purpose
Enables HR and Department Heads to initiate formal manpower hiring requisitions, defining job requirements, vacancies, experience brackets, and salary budgets.

### Entry Point
- URL: `/indent`
- Sidebar: "Indent" link.

### Input / Data
- **Auto-generated Indent Number**: Format `REC-xx` (Evaluated by querying maximum existing `indent.id` + 1).
- **Form Fields**: Department, Designation, Vacancy Count, Age Criteria, Gender Preference, Minimum Qualification, Experience Required, Monthly Salary Budget, Preferred Sourcing Sites, Job Description / Key Responsibilities.

### Actions
1. **Create Indent**: Opens the requisition creation modal.
2. **Submit Requisition**: Inserts new record into `indent`.
3. **Edit Indent**: Modifies an existing requisition.
4. **Delete Indent**: Deletes an unfulfilled requisition.
5. **Search & Filter**: Searches by Indent Number, Department, or Designation.

### Logic
```text
HR clicks "Add Indent"
          │
          ▼
Fetch latest ID from `indent` table
Generate next Indent No: "REC-" + (nextId)
          │
          ▼
HR fills requisition criteria & clicks Submit
          │
          ▼
Validation: Verifies mandatory fields (Department, Vacancies, Designation)
          │
          ▼
Insert into `indent` table:
{
  indent_no: "REC-xx",
  department: form.department,
  designation: form.designation,
  status: "NeedMore",
  created_at: new Date().toISOString()
}
          │
          ▼
Grid refreshes; requisition now available in Candidate Sourcing (`FindEnquiry.jsx`)
```

### Status / State Changes
- Initial Requisition Status: `'NeedMore'`.
- Status transitions to `'Fulfilled'` or `'Closed'` when requisite candidates join (`joining` table links).

### Database / API Operations
- **Table**: `indent`
- **Operations**: `INSERT`, `UPDATE`, `DELETE`, `SELECT`.

### Next Step
- Sourcing team opens `FindEnquiry.jsx` to map applicant resumes against this Indent Number.

---

## Step 04: Candidate Enquiry & Applicant Pool (`FindEnquiry.jsx`)

### Purpose
Captures inbound job applications and candidate profiles, links applicants to specific Indents, stores applicant resumes/photos, and manages the pre-interview candidate repository.

### Entry Point
- URL: `/find-enquiry`
- Sidebar: "Find Enquiry" (Displays badge counter of pending candidate enquiries).

### Input / Data
- **Enquiry Number**: Auto-generated sequence `ENQ-xx` (or custom post identifier `AAP-xx`).
- **Linked Indent**: Selected from active `indent` records.
- **Candidate Details**: Full Name, Mobile Number, Alternate Number, Email ID, Current Location, Total Experience, Current CTC, Expected CTC, Notice Period, Resume File, Photo File.

### Actions
1. **New Enquiry**: Opens candidate entry drawer/modal.
2. **Resume Upload**: Uploads PDF/Word resume to `candidate-files` storage bucket.
3. **Submit Candidate Profile**: Inserts record into `enquiry`.
4. **View Documents**: Previews uploaded resume in a new tab.
5. **Tab Navigation**: Toggles between "Pending Enquiries" and "History / Converted".

### Logic
- **Pending vs. History Partitioning**:
  - A candidate enquiry is classified as **Pending** if `actual_2` (Date of Joining) is NULL or blank.
  - When a candidate successfully completes onboarding in `Joining.jsx`, `enquiry.actual_2` is populated with the DOJ timestamp, automatically moving the record to the **History** tab.
- **Badge Calculation**: Sidebar badge reflects count of enquiries where `actual_2` is NULL.

### Database / API Operations
- **Table**: `enquiry`
- **Storage Bucket**: `candidate-files`
- **Operations**: `INSERT`, `UPDATE`, `SELECT`.

### Next Step
- Candidates appearing in Find Enquiry immediately populate the call queue in `CallTracker.jsx`.

---

## Step 05: Interview & Call Tracker (`CallTracker.jsx`)

### Purpose
Tracks telephonic screening, interview scheduling, candidate response logs, interview evaluation remarks, and hiring status progressions.

### Entry Point
- URL: `/call-tracker`
- Sidebar: "Call Tracker" (Displays badge count of candidates requiring follow-up).

### Input / Data
- Displays candidate records originating from `enquiry`.
- **Call Interaction Fields**: Call Status (selected from `master_hr.call_tracker_status`), Next Follow-up Date, Interview Scheduled Date & Time, Interviewer Remarks, Candidate Feedback.

### Actions
1. **Log Call / Follow-up**: Opens interaction modal for selected candidate.
2. **Update Status**: Submits new call disposition and sets next follow-up date.
3. **Filter by Status**: Filters by "Interested", "Call Not Picked", "Interview Scheduled", "Selected", "Rejected".
4. **History Log**: Views chronological call audit trail for a candidate.

### Logic
```text
HR clicks "Update Call Log"
             │
             ▼
Selects Call Tracker Status (e.g., "Selected - Joining Pending")
Enters Remarks and Next Action Date
             │
             ▼
1. Inserts chronological audit record into `follow_up` table:
   {
     enquiry_id: candidate.id,
     status: selectedStatus,
     follow_up_date: nextDate,
     remarks: remarksText,
     created_at: new Date()
   }
             │
             ▼
2. Updates parent `enquiry` table:
   {
     status: selectedStatus,
     follow_up_date: nextDate
   }
             │
             ▼
Condition Check on Status:
├── If status contains "Selected" or "Joining":
│     Candidate is qualified for Offer Letter (`OfferLetter.jsx`) and Onboarding (`Joining.jsx`)
└── If status is "Rejected" or "Not Interested":
      Candidate interaction terminates; archived in History
```

### Status / State Changes
- Status transitions driven by `master_hr.call_tracker_status` (e.g., `New Enquiry` $\rightarrow$ `Call Scheduled` $\rightarrow$ `Interview Scheduled` $\rightarrow$ `Interview Cleared` $\rightarrow$ `Selected`).

### Database / API Operations
- **Tables**: `enquiry`, `follow_up`, `master_hr`.
- **Operations**: `INSERT` to `follow_up`, `UPDATE` to `enquiry`, `SELECT` from `master_hr`.

### Next Step
- If candidate is selected: Proceed to `OfferLetter.jsx` (optional) and `Joining.jsx` (mandatory).

---

## Step 06: Offer & Confirmation Letters (`OfferLetter.jsx`)

### Purpose
Generates official, customized corporate Offer Letters and Confirmation Letters, exports high-resolution 2-page PDFs, and dispatches them directly to the candidate's email via EmailJS.

### Entry Point
- URL: `/offer-letter`
- Sidebar: "Offer Letter" link.

### Input / Data
- **Wizard Steps**:
  - **Step 1: Basic Info**: Letter Type ("Offer Letter" vs. "Confirmation Letter"), Candidate Name, Designation, Department, Date of Joining, Office Work Location, Reporting Manager.
  - **Step 2: Compensation Structure**: Monthly Gross Salary, Annual CTC, Basic, HRA, Conveyance, Special Allowance breakdown.
  - **Step 3: Terms & Clauses**: Probation Period (months), Notice Period (days), Working Hours, Confidentiality Terms.

### Actions
1. **Interactive Preview**: Renders real-time DOM representation of Page 1 and Page 2 of the formal letter.
2. **Download PDF**: Invokes `html2canvas` and `jspdf` to compile a 2-page print-ready PDF document.
3. **Send via Email**: Transmits generated letter directly to candidate email via EmailJS integration.
4. **Save Record**: Writes letter metadata to `offer_letters` or `confirmation_letters` table and uploads PDF to `letter` storage bucket.

### Logic
- **PDF Generation Algorithm**:
  - Captures DOM element `#offer-letter-page-1` via `html2canvas` at 2x scale $\rightarrow$ adds to `jsPDF` instance.
  - Adds new PDF page $\rightarrow$ captures `#offer-letter-page-2` $\rightarrow$ adds to `jsPDF`.
  - Converts compiled PDF to Blob $\rightarrow$ uploads to Supabase storage bucket `letter`.
- **Email Dispatch**: Calls `emailjs.send()` using configured Service ID, Template ID, and Public Key, injecting candidate name, joining date, and public download URL of the letter.

### Database / API Operations
- **Tables**: `offer_letters`, `confirmation_letters`.
- **Storage Bucket**: `letter`.
- **Operations**: `INSERT`, `SELECT`, Storage `UPLOAD`.

### Next Step
- Candidate accepts offer and reports on Day 1 $\rightarrow$ HR navigates to `Joining.jsx`.

---

## Step 07: Employee Joining / Master Onboarding (`Joining.jsx`)

### Purpose
Creates the official master employment record on Day 1, assigns the unique permanent Employee ID (`RBP-xx`), collects all statutory/KYC details, and activates the employee in the database.

### Entry Point
- URL: `/joining`
- Sidebar: "Joining" (Displays badge counter of candidates ready for onboarding).

### Input / Data
- **Auto-generated Employee Code**: `RBP-xx` (Calculated from maximum numeric sequence in `joining.rbp_joining_id`).
- **Personal Details**: Name as per Aadhar, Father's Name, Date of Birth, Gender, Blood Group, Marital Status, Mobile Number, Alternate Number, Personal Email, Current Address, Permanent Address.
- **Family Details**: Family Contact Person Name, Relationship, Contact Number.
- **Statutory & Banking**: Aadhar Number, PAN Number, Bank Name, Bank Account Number, IFSC Code, UAN (PF) Number, ESIC Number.
- **Employment Specifics**: Firm Name, Department, Designation, Employee Category ("Office Staff" vs. "Field Staff"), Date of Joining, Shift, Probation Months, Monthly Gross Salary, Company PF Provided ("Yes"/"No"), Company ESIC Provided ("Yes"/"No").
- **Document Scans**: Aadhar Front, Aadhar Back, PAN Card, Bank Passbook / Cancelled Cheque, Candidate Photo, Driving License.

### Actions
1. **Auto-Fill from Enquiry**: Pre-populates candidate fields from selected `enquiry` record.
2. **Document Uploads**: Uploads image files to `joining-documents` storage bucket.
3. **Submit Master Record**: Inserts row into `joining` table with status `'Active'`.
4. **Sync Enquiry Closure**: Updates `enquiry.actual_2` with the joining date timestamp.

### Logic
```text
HR completes Onboarding Form & clicks "Submit Joining"
                         │
                         ▼
Uploads image files to Supabase Bucket `joining-documents`
Retrieves public URLs for all uploaded KYC documents
                         │
                         ▼
Insert record into `joining` table:
{
  rbp_joining_id: "RBP-xx",
  name_as_per_aadhar: form.name,
  status: "Active",
  date_of_joining: form.doj,
  company_pf_provided: form.pfProvided,
  company_esic_provided: form.esicProvided,
  actual_date: null, // Pending completion of After Joining Work
  ...allKYCFields
}
                         │
                         ▼
Update source `enquiry` record:
.update({ actual_2: form.doj }).eq('id', sourceEnquiryId)
                         │
                         ▼
Enquiry automatically moves from "Pending" to "History"
Employee record created; ready for 9-step Onboarding Checklist (`AfterJoiningWork.jsx`)
```

### Database / API Operations
- **Tables**: `joining`, `enquiry`.
- **Storage Bucket**: `joining-documents`.
- **Operations**: `INSERT` into `joining`, `UPDATE` on `enquiry`.

### Next Step
- HR immediately transitions to `AfterJoiningWork.jsx` to complete the statutory 9-step onboarding checklist.

---

## Step 08: Onboarding Checklist & Assets (`AfterJoiningWork.jsx`)

### Purpose
Enforces compliance and governance during the new employee's first week through a strict 9-step operational checklist, asset assignments, and Post-Dated Cheque (PDC) security collection.

### Entry Point
- URL: `/after-joining-work`
- Sidebar: "On Boarding" (Displays badge counter of active employees with incomplete checklists).

### Input / Data
- Displays all employees from `joining` where `status === 'Active'`.
- **The 9 Compliance Milestones**:
  1. `previous_salary_slip`: Verified previous employer salary proof ("Done" / "Pending").
  2. `offer_letter_issued`: Physical offer letter handed over and signed copy received.
  3. `welcome_meeting`: Formal orientation conducted by HR / Management.
  4. `biometric_enrolled`: Biometric punch ID registered on device and mapped in system (`punch_id`).
  5. `email_id_created`: Official company email address created and issued.
  6. `assets_issued`: Laptop, Mobile, SIM card, Identity Card, Uniform issued.
  7. `pf_esic_portal_registered`: UAN / ESIC portal mapping verified.
  8. `directory_listing`: Added to corporate phone directory and communication groups.
  9. `pdc_cheque`: Post-Dated Cheque collected for asset security (Cheque Number, Bank, Scan Upload).

### Actions
1. **Checklist Toggles**: Updates individual milestone status ("Done" / "Pending").
2. **Issue Assets**: Opens asset allocation drawer to record Serial Numbers and descriptions.
3. **Upload PDC Cheque**: Uploads image scan of security cheque to `assets` storage bucket.
4. **Save Checklist State**: Updates corresponding columns in `joining` and inserts allocated items into `assets` table.

### Logic
```text
HR updates checklist milestones for an employee
                      │
                      ▼
Update `joining` table columns:
{
  previous_salary_slip: status1,
  offer_letter: status2,
  welcome_meeting: status3,
  biometric_done: status4,
  email_created: status5,
  assets_assigned: status6,
  pf_esic_done: status7,
  directory_done: status8,
  pdc_collected: status9
}
                      │
                      ▼
Verification Algorithm:
Inspects if all core 8 milestones (items 1 through 8) are marked "Done"
                      │
              ┌───────┴───────┐
              ▼               ▼
        All 8 Done     Any Item Pending
              │               │
Sets `joining.actual_date`    `joining.actual_date` remains NULL
to current timestamp          (Badge counter in Sidebar remains active)
              │
Employee onboarding marked 100% completed
```

### Database / API Operations
- **Tables**: `joining`, `assets`.
- **Storage Bucket**: `assets`.
- **Operations**: `UPDATE` on `joining`, `INSERT` / `UPDATE` on `assets`.

### Next Step
- Employee is fully onboarded; daily records are tracked in `Employee.jsx` and `Attendancedaily.jsx`.

---

## Step 09: Master Employee Directory (`Employee.jsx`)

### Purpose
Serves as the centralized repository for all active and inactive company personnel, supporting advanced search, profile audits, KYC document inspection, and status toggles.

### Entry Point
- URL: `/employee`
- Sidebar: "Employee" link.

### Input / Data
- Reads all records from `joining` table.
- Displays Employee ID, Name, Photo, Designation, Department, Category, Mobile Number, Joining Date, Gross Salary, and Employment Status.

### Actions
1. **Search & Multi-Column Filter**: Filters by Name, Employee ID, Department, Designation, and Firm Name.
2. **Active vs. Inactive Filter**: Toggles view between current workforce and separated employees.
3. **View Full Profile**: Opens modal displaying personal, bank, and statutory information.
4. **Document Lightbox**: Views full-resolution uploaded Aadhar, PAN, and Bank documents.
5. **Direct Status Toggle**: Allows authorized admins to toggle employee status between `'Active'` and `'Inactive'`.

### Logic
- **Database Trigger Warning on Status Change**:
  - When an employee is toggled to `'Inactive'` in `joining`, PostgreSQL trigger `cleanup_leave_ledger_on_inactive` automatically fires, purging unfinalized future leave records.
  - PostgreSQL trigger `prevent_inactive_leave_ledger_insert` blocks any future leave transactions for this employee.

### Database / API Operations
- **Table**: `joining`.
- **Operations**: `SELECT`, `UPDATE`.

### Next Step
- Monitor daily operations via Attendance modules (`Attendancedaily.jsx` and `AttendancedailyManagement.jsx`).

---

## Step 10: Daily Attendance & GPS Field Audit (`Attendancedaily.jsx`)

### Purpose
Provides real-time, same-day visibility into workforce check-ins, tracking biometric office punches and mobile GPS field locations with route trail visualization.

### Entry Point
- URL: `/attendancedaily`
- Sidebar: "Daily Attendance" link.

### Input / Data
- Reads records from `attendance`, `offline_biometric_punch`, `location_logs`, `tracking_sessions`, and `joining`.
- Displays Punch-in Time, Punch-out Time, Work Duration, Battery Level, Network Status, and GPS Coordinates.

### Actions
1. **Live GPS Map View**: Opens interactive modal plotting employee field travel coordinates and stops.
2. **Date Picker**: Audits historical daily attendance for any chosen calendar date.
3. **Department / Category Filter**: Filters by Office Staff vs. Field Staff.
4. **Manual Punch Override**: Allows HR to manually inject or correct punch-in/out timestamps.

### Logic
- Joins mobile `attendance` check-in records with biometric `offline_biometric_punch` by matching `employee_id` and `punch_id`.
- Computes real-time elapsed working hours: `out_time - in_time`.
- Flags anomalous punches (e.g., check-ins after 09:45 AM highlighted in Amber as Late; check-outs before 16:00 highlighted in Red).

### Database / API Operations
- **Tables**: `attendance`, `offline_biometric_punch`, `location_logs`, `tracking_sessions`, `joining`.
- **Operations**: `SELECT`, `INSERT` / `UPDATE` for manual overrides.

### Next Step
- End-of-month consolidation handled in `AttendancedailyManagement.jsx`.

---

## Step 11: Monthly Attendance Grid & Finalization (`AttendancedailyManagement.jsx`)

### Purpose
The core time-and-attendance engine of the enterprise. Computes comprehensive monthly day-by-day matrices, enforces late arrival penalties, calculates Casual Leave (CL) ledger balances, and locks records for payroll.

### Entry Point
- URL: `/attendance-management`
- Sidebar: "Attendance Management" link.

### Input / Data
- **Inputs**: Selected Month and Year.
- **Sources**: `joining` (active staff), `offline_biometric_punch`, `attendance`, `holiday_master`, `emp_leaving_holiday`, `leave_ledger`, `late_attendance_approval`, `final_attendance`.

### Actions
1. **Month / Year Selector**: Loads matrix for specified calendar month.
2. **Late Approval Modal**: Authorizes management to waive specific late arrival occurrences.
3. **Manual Status Override**: HR can click any day cell to manually toggle status (`P`, `HD`, `A`, `CL`, `WO`, `H`).
4. **Export Grid**: Exports complete 31-day attendance sheet to styled Excel workbook.
5. **Finalize Attendance**: Locks attendance for the month, writes snapshots to `final_attendance`, debits leaves in `leave_ledger`, and records lock audit log in `attendance_finalization_log`.

### Logic & Formulations
See [Section 5: Business Logic & Mathematical Formulations](#5-business-logic--mathematical-formulations) for exact status priority, late deduction rules, and CL ledger accrual mechanics.

### Database / API Operations
- **Tables**: `offline_biometric_punch`, `attendance`, `holiday_master`, `emp_leaving_holiday`, `leave_ledger`, `late_attendance_approval`, `final_attendance`, `attendance_finalization_log`.
- **Operations**: `SELECT`, `INSERT`, `UPDATE`.

### Next Step
- Approved attendance days feed directly into monthly salary processing in `Payroll.jsx`.

---

## Step 12: Approvals Center (`LeaveManagement.jsx`)

### Purpose
Centralized administrative authorization desk handling three distinct approval workflows: Leave Applications, Biometric Punch Corrections, and Resignation Requests.

### Entry Point
- URL: `/leave-management`
- Sidebar: "Approval" link.

### Input / Data
- **Tab 1: Leave Requests**: Fetches from `emp_leaving_holiday` (Employee ID, Leave Type, From Date, To Date, Reason, Status).
- **Tab 2: Biometric Corrections**: Fetches from `offline_biometric_punch` where `approved_status = 'pending'`.
- **Tab 3: Resignation Requests**: Fetches from `employee_leaving` where `resignation_acceptance = false`.

### Actions
1. **Approve / Reject Leave**: Authorizes or denies employee leave requests.
2. **Approve / Reject Biometric Correction**: Validates missed punch correction claims.
3. **Direct Navigation to Resignation Modal**: Redirects to `ResignationApproval.jsx` for full offboarding clearance.

### Logic
```text
HR clicks "Approve" on Leave Request
                │
                ▼
1. Updates `emp_leaving_holiday`:
   .update({ status: 'Approved', approved_by: currentUser, updated_at: new Date() })
                │
                ▼
2. Computes total leave duration (e.g., 2 days)
                │
                ▼
3. Automatically inserts DEBIT entry into `leave_ledger`:
   {
     employee_id: record.employee_id,
     transaction_type: 'DEBIT',
     leave_type: 'CL',
     days: leaveDays,
     narration: 'Leave Approved via HR Portal',
     created_at: new Date()
   }
                │
                ▼
Leave ledger balance immediately decreases for the employee
```

### Database / API Operations
- **Tables**: `emp_leaving_holiday`, `leave_ledger`, `offline_biometric_punch`, `employee_leaving`.
- **Operations**: `UPDATE`, `INSERT`, `SELECT`.

### Next Step
- Approved leaves automatically reflect as `CL` in `AttendancedailyManagement.jsx`.

---

## Step 13: Resignation Approval (`ResignationApproval.jsx`)

### Purpose
Provides dedicated governance for employee resignation processing, establishing official Last Working Dates and Full & Final Settlement (F&F) targets.

### Entry Point
- URL: `/leaving-approval`
- Navigated from Sidebar or Approvals Center Tab 3.

### Input / Data
- Reads from `employee_leaving` table.
- Displays Employee ID, Name, Department, Designation, Joining Date, Date of Resignation, Reason for Leaving.

### Actions
1. **Review Resignation**: Examines resignation letter and employee tenure.
2. **Approve Resignation**: Opens modal requiring mandatory input of **Last Working Date** and **F&F Date**.
3. **Reject Resignation**: Retains employee as active.

### Logic
```text
HR clicks "Approve" & enters Last Working Date + F&F Date
                         │
                         ▼
1. Update `employee_leaving`:
   .update({
     resignation_acceptance: true,
     last_working_date: lastWorkingDate,
     fnf_date: fnfDate,
     actual: lastWorkingDate
   }).eq('id', selectedRowId)
                         │
                         ▼
2. Update `joining` table:
   .update({
     status: 'Inactive',
     leaving_date: lastWorkingDate
   }).eq('rbp_joining_id', employeeId)
                         │
                         ▼
3. PostgreSQL Trigger Executes: `cleanup_leave_ledger_on_inactive`
   Purges unfinalized leave ledger records for this employee
                         │
                         ▼
Employee status becomes Inactive; record moves to Offboarding Checklist (`AfterResignationWork.jsx`)
```

### Database / API Operations
- **Tables**: `employee_leaving`, `joining`, `leave_ledger`.
- **Operations**: `UPDATE` on `employee_leaving`, `UPDATE` on `joining`.

### Next Step
- HR proceeds to `AfterResignationWork.jsx` to complete physical handover and clearance tasks.

---

## Step 14: Offboarding Checklist (`AfterResignationWork.jsx`)

### Purpose
Governs the exit clearance procedure, ensuring recovery of company assets, revocation of system access, handover of responsibilities, and return of security cheques.

### Entry Point
- URL: `/after-resignation-work`
- Sidebar: "Off Boarding" (Displays badge counter of separated employees with pending exit clearances).

### Input / Data
- Reads from `employee_leaving` where `resignation_acceptance = true`.
- **The 7 Clearance Milestones**:
  1. `resignation_letter`: Formal written resignation on file.
  2. `acceptance_letter`: Management acceptance letter delivered to employee.
  3. `reason_leaving`: Exit interview conducted; root cause documented.
  4. `resignation_time_or_not`: Notice period adherence verified.
  5. `company_things_taken`: Company property (Laptop, SIM, ID badge, keys) recovered.
  6. `handover_form_complete`: Handover sign-off document signed by HOD and uploaded to `assets` bucket.
  7. `cheque_return`: Security Post-Dated Cheque (PDC) returned to employee.

### Actions
1. **Toggle Clearance Steps**: Marks clearance milestones as "Done" or "Pending".
2. **Upload Handover Form**: Uploads signed clearance document to `assets` storage bucket.
3. **Save Clearance State**: Updates columns in `employee_leaving`.

### Logic
- When all core clearance items (1 through 6) are marked "Done", `employee_leaving.actual` is timestamped, completing the offboarding cycle and removing the employee from the pending sidebar badge.

### Database / API Operations
- **Tables**: `employee_leaving`, `assets`.
- **Storage Bucket**: `assets`.
- **Operations**: `UPDATE`, `SELECT`, Storage `UPLOAD`.

### Next Step
- Employee file archived; final compensation disbursed via Accounts / F&F settlement.

---

## Step 15: Monthly Payroll Processing & Payslips (`Payroll.jsx`)

### Purpose
Calculates statutory and pro-rated monthly compensation, generates corporate PDF payslips, supports salary adjustments, and locks payroll history.

### Entry Point
- URL: `/payroll`
- Sidebar: "Payroll" link.

### Input / Data
- **Sources**: `joining` (Active employees, base salary, PF/ESIC eligibility), `useAttendanceData.js` or `final_attendance` (Paid days, working days, overtime days).
- **Interactive Adjustments**: Advance Deductions, Security Deposits, Other Deductions, Overtime Additions, Arrears, Reimbursements, TA/DA Allowances.

### Actions
1. **Salary Calculation**: Runs real-time mathematical breakdown via `payrollCalc.js`.
2. **Edit Row / Modal**: Allows HR to override earnings or deductions for any specific employee.
3. **Generate Payslip PDF**: Opens `PayslipModal.jsx` and generates high-resolution, branded PDF payslip via `html2canvas` + `jspdf`.
4. **Export Excel**: Exports complete salary sheet for corporate banking disbursement.
5. **Finalize Payroll**: Writes locked payroll records to `payroll_history`.

### Logic & Formulations
See [Section 5: Business Logic & Mathematical Formulations](#5-business-logic--mathematical-formulations) for complete salary component formulas, PF/ESIC percentages, and net payable equations.

### Database / API Operations
- **Tables**: `joining`, `final_attendance`, `payroll_history`.
- **Operations**: `SELECT`, `INSERT` into `payroll_history`.

### Next Step
- Payout file uploaded to bank; post-disbursement audits tracked in `AfterPayment.jsx`.

---

## Step 16: Post-Disbursement / After Payment Grid (`AfterPayment.jsx`)

### Purpose
Maintains post-payout banking verification, tracking payment realization, bank transaction references, and disbursement discrepancies through an interactive, live-editable spreadsheet interface.

### Entry Point
- URL: `/after-payment`
- Sidebar: "After Payment Work" link.

### Input / Data
- Reads and writes to `after_payment_work` table.
- Accepts bulk Excel (.xlsx) file uploads containing banking transaction logs.

### Actions
1. **Import Excel Sheet**: Parses `.xlsx` payout file and bulk-inserts rows into `after_payment_work`.
2. **Live Cell Editing**: Double-click any table cell to update payment status, transaction reference, or remarks with auto-save to Supabase on blur.
3. **Delete Record**: Removes an erroneous entry.
4. **Search & Filter**: Searches across Employee ID, Name, Bank, or Transaction Reference.

### Database / API Operations
- **Table**: `after_payment_work`.
- **Operations**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

### Next Step
- Completed payout cycle reconciled with corporate financial ledgers.

---

## Step 17: WhatsApp Birthday Wishes (`BirthdayWish.jsx`)

### Purpose
Automates employee birthday recognition by generating personalized high-resolution graphical greeting cards and dispatching them via Meta WhatsApp Cloud API.

### Entry Point
- URL: `/birthday-wish`
- Sidebar: "Birthday Wish" link.

### Input / Data
- Filters active employees from `joining` whose `dob` (Date of Birth) matches today's calendar date.
- Displays upcoming birthdays within the next 15 days in an auxiliary tab.

### Actions
1. **Preview Card**: Renders custom HTML5 Canvas card featuring corporate branding, employee photo, celebratory badge, and personalized text.
2. **Custom Message Input**: Allows HR to personalize the greeting text.
3. **Send WhatsApp Wish**: Generates image blob, uploads to Supabase storage `birthday-wishes`, and triggers Edge Function `send-birthday-wish`.
4. **View / Delete History**: Audits past dispatches logged in `birthday_wish` table.

### Logic
```text
HR clicks "Send Wish" for an employee celebrating today
                          │
                          ▼
1. HTML5 Canvas draws 1000x1300 high-res card:
   Draws background, borders, corporate logo, employee photo, celebratory text
                          │
                          ▼
2. Converts Canvas to PNG Blob
                          │
                          ▼
3. Uploads image to Supabase Bucket `birthday-wishes`
   Retrieves public URL: `https://.../birthday_name_timestamp.png`
                          │
                          ▼
4. Invokes Supabase Edge Function:
   supabase.functions.invoke('send-birthday-wish', {
     body: {
       phone: employeeMobile,
       name: employeeName,
       message: customMessage,
       imageUrl: publicImageUrl
     }
   })
                          │
                          ▼
5. Edge Function transmits message via Meta WhatsApp Cloud API
                          │
                          ▼
6. Inserts dispatch log into `birthday_wish` table
```

### Database / API Operations
- **Tables**: `joining`, `birthday_wish`.
- **Storage Bucket**: `birthday-wishes`.
- **Edge Function**: `send-birthday-wish`.
- **Operations**: `SELECT`, `INSERT`, Storage `UPLOAD`.

---

## Step 18: WhatsApp Work Anniversary Wishes (`WorkAnniversary.jsx`)

### Purpose
Recognizes and celebrates employee career milestones by calculating years of service, generating gold-embossed milestone celebration cards, and dispatching greetings via WhatsApp.

### Entry Point
- URL: `/work-anniversary`
- Sidebar: "Work Anniversary" link.

### Input / Data
- Inspects `joining.date_of_joining` for active employees.
- Evaluates if joining month and day match today's date.
- Computes `yearsCompleted = today.getFullYear() - doj.getFullYear()`.

### Actions
1. **Interactive Card Canvas**: Draws an Ivory and Gold metallic certificate of service featuring Sunburst rays, gold emblem seal, employee name, and tenure years.
2. **Custom Tenure & Message**: Allows HR to override milestone years or greeting text.
3. **Dispatch WhatsApp Wish**: Uploads generated canvas image and invokes Supabase Edge Function `send-work-anniversary-wish`.
4. **Audit History**: Audits sent anniversary wishes stored in `work_anniversary_wish`.

### Database / API Operations
- **Tables**: `joining`, `work_anniversary_wish` (with fallback to `birthday_wish`).
- **Storage Bucket**: `birthday-wishes` (fallback to `joining-documents`).
- **Edge Function**: `send-work-anniversary-wish`.
- **Operations**: `SELECT`, `INSERT`, Storage `UPLOAD`.

---

## Step 19: Master Data Management (`Master.jsx`)

### Purpose
Administers the centralized dropdown choices, organizational taxonomies, legal entities, and operational parameters utilized across the entire software application.

### Entry Point
- URL: `/master`
- Sidebar: "Master" link.

### Input / Data
- Manages records in `master_hr` table.
- **Fields**: HOD Name, Firm Name, Department, Social Site, Call Tracker Status, Family Relationship, Attendance Type, Employee Name, Mobile Number, Designation.

### Actions
1. **Create Master Record**: Adds a new configuration row.
2. **Edit Master Record**: Modifies existing names, categories, or designations.
3. **Delete Master Record**: Removes unused parameters.
4. **Multi-Column Filtering**: Filters master records by Firm, Department, or Designation.

### Database / API Operations
- **Table**: `master_hr`.
- **Operations**: `INSERT`, `UPDATE`, `DELETE`, `SELECT`.

### Next Step
- Updated values immediately populate dropdown selectors across Indent, Candidate Enquiry, Call Tracker, and Joining forms.

---

## Step 20: User Management & Portal Access (`AddUsers.jsx`)

### Purpose
Manages administrative authentication credentials, defines role-based authorizations, controls page-level access permissions, and provisions mobile employee app credentials.

### Entry Point
- URL: `/add-user`
- Sidebar: "Add User" link.

### Input / Data
- **Tab 1: HR Portal Users (`users_hr`)**:
  - Username, Password, Name, Department, Given By, Email ID, WhatsApp Number, Role (`ADMIN`, `USER`, `MASTER`), Page Permissions (List of permitted page routes or `'ALL'`), Access Status (Boolean `true`/`false`).
- **Tab 2: Mobile App Users (`users_employee`)**:
  - Linked to `joining.rbp_joining_id`, Employee Name, Password, Access Status (`"True"`/`"False"`), Department Field.

### Actions
1. **Create HR User**: Adds a new portal operator and configures their permitted page routes.
2. **Toggle Portal Access**: Enables or disables access for an existing user account.
3. **Create / Edit Employee Mobile Login**: Generates mobile app credentials for field or office personnel.
4. **Delete User**: Removes user account from database.

### Database / API Operations
- **Tables**: `users_hr`, `users_employee`, `joining`, `master_hr`.
- **Operations**: `INSERT`, `UPDATE`, `DELETE`, `SELECT`.

---

## Step 21: Reports Dashboard (`Report.jsx`)

### Purpose
Provides a multi-tab analytical reporting interface designed for attendance trends, day-end audits, WhatsApp delivery tracking, leave distributions, and overtime analyses.

### Entry Point
- URL: `/report`
- Sidebar: "Report" link.

### Current Implementation Status
> [!NOTE]
> **Codebase Implementation Status**: `Partially static mockup / Mock data with hardcoded samples; real-time DB queries for these specific report tabs are not implemented in this component`.
> The page renders functional tab navigation, search bars, date range pickers, and export button outlines, but displays hardcoded sample statistics and placeholder tables for Attendance Day End, Analysis, WhatsApp Day End, Leave, Late Cutoff, and Overtime reports.

---

# 4. Inter-Page Relationships & ID Propagation

The integrity of the RBP HR-FMS platform relies on the strict sequential propagation of primary identifiers across modules:

```text
       INDENT MODULE                        CANDIDATE MODULE
 ┌───────────────────────┐            ┌───────────────────────────┐
 │ `indent`              │            │ `enquiry`                 │
 │ Primary Key: `id`     │            │ Primary Key: `id`         │
 │ Identifier: `REC-xx`  │───────────>│ Identifier: `ENQ-xx`      │
 └───────────────────────┘            │ Links: `indent_no`        │
                                      └─────────────┬─────────────┘
                                                    │
                                                    ▼
    EMPLOYEE MASTER                        INTERVIEW MODULE
 ┌───────────────────────┐            ┌───────────────────────────┐
 │ `joining`             │            │ `follow_up`               │
 │ Primary Key: `id`     │<───────────│ Primary Key: `id`         │
 │ Identifier: `RBP-xx`  │            │ Foreign Key: `enquiry_id` │
 └───────────┬───────────┘            └───────────────────────────┘
             │
             ├──────────────────────────┬─────────────────────────┐
             ▼                          ▼                         ▼
      ASSETS & ONBOARDING          TIME & ATTENDANCE          PAYROLL
 ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
 │ `assets`              │  │ `attendance` /        │  │ `payroll_history`     │
 │ Identifier: `RBP-xx`  │  │ `leave_ledger`        │  │ Identifier: `RBP-xx`  │
 │ (Hardware, PDC scan)  │  │ Identifier: `RBP-xx`  │  │ (Locked salary record)│
 └───────────────────────┘  └───────────────────────┘  └───────────────────────┘
             │
             ▼
        OFFBOARDING
 ┌───────────────────────┐
 │ `employee_leaving`    │
 │ Foreign Key:          │
 │ `employee_id` (RBP-xx)│
 └───────────────────────┘
```

### Critical Linkage Trace
1. **Requisition to Candidate**:
   - `indent.indent_no` (`REC-xx`) is stored in `enquiry.indent_no`.
2. **Candidate to Interview Tracking**:
   - `enquiry.id` serves as the foreign key in `follow_up.enquiry_id`.
3. **Candidate to Employee Onboarding**:
   - When candidate joins, new row is created in `joining` with `rbp_joining_id` (`RBP-xx`).
   - Source `enquiry.actual_2` is updated with `joining.date_of_joining`, transferring the record to History.
4. **Employee to Compliance & Assets**:
   - `joining.rbp_joining_id` is stored in `assets.employee_id`.
5. **Employee to Attendance & Leave Ledger**:
   - `joining.rbp_joining_id` matches `attendance.employee_id`, `offline_biometric_punch.punch_id` (via `joining.punch_id`), and `leave_ledger.employee_id`.
6. **Employee to Payroll**:
   - `joining.rbp_joining_id` + `joining.salary` combined with attendance paid days to generate `payroll_history`.
7. **Employee to Resignation & Separation**:
   - `employee_leaving.employee_id` maps to `joining.rbp_joining_id`.
   - On approval, `joining.status` updates to `'Inactive'`, firing PostgreSQL database triggers.

---

# 5. Business Logic & Mathematical Formulations

## 5.1 Attendance Classification Algorithm (`useAttendanceData.js`)

For any given calendar date $D$ and employee $E$, daily attendance status is determined through a strict **7-tier hierarchical evaluation**:

```text
Priority 1: Date Boundaries
   ├── If D < E.date_of_joining: Status = "-" (Excluded)
   └── If E.status == 'Inactive' and D > E.leaving_date: Status = "-" (Excluded)

Priority 2: Manual HR Override
   └── If manual override exists with `approved_status == 'corrected'`:
       Status = override.status (P / HD / A / CL / WO / H)

Priority 3: Corporate Holiday
   └── If D matches any holiday in `holiday_master`:
       Status = "H" (Holiday)

Priority 4: Approved Leave
   └── If D falls within an approved range in `emp_leaving_holiday` OR
       a DEBIT transaction exists in `leave_ledger`:
       Status = "CL" (Casual Leave)

Priority 5: Working Punch Evaluation (Office Biometric or Field Check-in)
   └── If In-Punch exists:
         ├── If Out-Punch exists AND (Out-Time >= 16:00 OR Duration >= 6.5 hours):
         │     Status = "P" (Present)
         └── If Out-Punch < 16:00 OR Out-Punch is missing:
               Status = "HD" (Half Day)

Priority 6: Weekly Off Rule
   └── If D is a Sunday:
       Status = "WO" (Weekly Off)

Priority 7: Default Fallback
   └── Status = "A" (Absent)
```

---

## 5.2 Late Arrival Penalty Formulation

### Late Threshold
A morning arrival is classified as **Late** if:
$$\text{Check-In Time} \in [09:46\text{ AM}, 12:30\text{ PM}] \quad (586 \text{ to } 750 \text{ minutes from midnight})$$
Arrivals after 12:30 PM are automatically classified as **Half Day (HD)**.

### Unapproved Late Accumulation & Deduction
1. The system checks `late_attendance_approval` for authorized waivers.
2. For all unapproved late arrivals in the calendar month:
$$\text{Unapproved Late Count} = N_{\text{late}}$$
$$\text{Late Salary Deduction Days} = \left\lfloor \frac{N_{\text{late}}}{4} \right\rfloor \times 0.5$$

> **Rule**: Every 4 unapproved late arrivals result in a **0.5 day deduction** from the employee's total paid days.

---

## 5.3 Casual Leave (CL) Accrual & Balance Ledger

The system maintains a double-entry ledger in `leave_ledger`:
- **Credit (Accrual)**:
  - Active employees accrue **1.0 CL per month** starting from their Month of Joining within the Indian Financial Year (April 1 to March 31).
- **Debit (Consumption)**:
  - When an HR manager approves a leave request in `LeaveManagement.jsx` or finalizes attendance in `AttendancedailyManagement.jsx`, a `DEBIT` row is inserted.
- **Real-Time Available Balance**:
$$\text{Available CL Balance} = \sum \text{Days}_{\text{CREDIT}} - \sum \text{Days}_{\text{DEBIT}}$$

---

## 5.4 Payroll Salary Engine (`payrollCalc.js`)

### Fixed Real Salary Breakdown (from Base Gross $G_{\text{real}}$)
$$\text{Basic + DA}_{\text{real}} = G_{\text{real}} \times 50\%$$
$$\text{HRA}_{\text{real}} = G_{\text{real}} \times 20\%$$
$$\text{Conveyance}_{\text{real}} = G_{\text{real}} \times 10\%$$
$$\text{Medical Allowance}_{\text{real}} = G_{\text{real}} \times 15\%$$
$$\text{Special Allowance}_{\text{real}} = G_{\text{real}} \times 5\%$$

### Pro-Rated Earned Salary Calculation
Let $D_{\text{cal}}$ be the total calendar days in the month (e.g., 28, 30, or 31), and $P_{\text{paid}}$ be the employee's total paid days (computed as $\text{Present Days} + \text{Paid Leaves} + \text{Holidays} + \text{Week Offs} - \text{Late Deductions}$):

$$\text{Earned Component} = \left( \frac{\text{Component}_{\text{real}}}{D_{\text{cal}}} \right) \times P_{\text{paid}}$$
$$\text{Gross Earned } (G_{\text{earned}}) = \sum \text{All Earned Components}$$

### Statutory Deductions
- **Employee EPF**:
  - If `company_pf_provided == 'Yes'`: $\text{EPF}_{\text{ded}} = \text{Basic Earned} \times 12\%$
  - Else: $\text{EPF}_{\text{ded}} = 0$
- **Employee ESIC**:
  - If `company_esic_provided == 'Yes'`: $\text{ESIC}_{\text{ded}} = G_{\text{earned}} \times 0.75\%$
  - Else: $\text{ESIC}_{\text{ded}} = 0$
- **Total Deductions**:
$$\text{Total Deductions} = \text{EPF}_{\text{ded}} + \text{ESIC}_{\text{ded}} + \text{Advance} + \text{Security Deposit} + \text{Other Deductions}$$

### Net Salary & Total Payable
$$\text{Net Salary} = G_{\text{earned}} - \text{Total Deductions}$$
$$\text{Total Payable} = \text{Net Salary} + \text{TA/DA} + \text{Reimbursements} + \text{Salary Arrears} + \text{OT Amount}$$

### Employer Contributions & Cost to Company (CTC)
$$\text{Employer EPF} = \text{Basic Earned} \times 13\%$$
$$\text{Employer ESIC} = \text{Basic Earned} \times 3.25\%$$
$$\text{Total CTC} = G_{\text{earned}} + \text{Employer EPF} + \text{Employer ESIC}$$

---

# 6. Role-Based Access Control (RBAC) Matrix

Portal authorization is governed by `users_hr.role` and `users_hr.page`:

| Page / Route | Component | Admin (`role === 'admin'`) | HR / Ops User (`role === 'USER'`) | Mobile Employee (`users_employee`) |
| :--- | :--- | :---: | :---: | :---: |
| `/login` | `Login.jsx` | Full Access | Full Access | No Access (Web Portal) |
| `/` | `Dashboard.jsx` | Full Access | If included in `page` permissions | No Access |
| `/indent` | `Indent.jsx` | Full Access | If included in `page` permissions | No Access |
| `/find-enquiry` | `FindEnquiry.jsx` | Full Access | If included in `page` permissions | No Access |
| `/call-tracker` | `CallTracker.jsx` | Full Access | If included in `page` permissions | No Access |
| `/offer-letter` | `OfferLetter.jsx` | Full Access | If included in `page` permissions | No Access |
| `/joining` | `Joining.jsx` | Full Access | If included in `page` permissions | No Access |
| `/after-joining-work` | `AfterJoiningWork.jsx` | Full Access | If included in `page` permissions | No Access |
| `/employee` | `Employee.jsx` | Full Access | If included in `page` permissions | No Access |
| `/attendancedaily` | `Attendancedaily.jsx` | Full Access | If included in `page` permissions | View Own Records (via App) |
| `/attendance-management` | `AttendancedailyManagement.jsx`| Full Access | If included in `page` permissions | No Access |
| `/leave-management` | `LeaveManagement.jsx` | Full Access | If included in `page` permissions | Apply via App |
| `/leaving-approval` | `ResignationApproval.jsx` | Full Access | If included in `page` permissions | Apply via App |
| `/after-resignation-work` | `AfterResignationWork.jsx` | Full Access | If included in `page` permissions | No Access |
| `/payroll` | `Payroll.jsx` | Full Access | If included in `page` permissions | View Own Payslip |
| `/after-payment` | `AfterPayment.jsx` | Full Access | If included in `page` permissions | No Access |
| `/birthday-wish` | `BirthdayWish.jsx` | Full Access | If included in `page` permissions | Receive Wishes |
| `/work-anniversary` | `WorkAnniversary.jsx` | Full Access | If included in `page` permissions | Receive Wishes |
| `/master` | `Master.jsx` | Full Access | If included in `page` permissions | No Access |
| `/add-user` | `AddUsers.jsx` | Full Access | Prohibited / Admin Only | No Access |
| `/report` | `Report.jsx` | Full Access | If included in `page` permissions | No Access |

---

# 7. Comprehensive Data Dictionary

### Core Tables & Schemas

#### 1. `users_hr`
- `id` (bigint, PK): Internal record identifier.
- `username` (text, UNIQUE): Operator login identifier.
- `password` (text): Operator authentication secret.
- `name` (text): Operator full name.
- `department` (text): Operational department.
- `given_by` (text): Authorizing manager name.
- `email_id` (text): Work email address.
- `wa_number` (text): WhatsApp contact digits.
- `role` (text): Access role (`'admin'`, `'USER'`, `'MASTER'`).
- `page` (text): Comma-separated list of permitted route names or `'ALL'`.
- `access` (boolean): Master active account toggle (`true`/`false`).

#### 2. `indent`
- `id` (bigint, PK): Internal sequence.
- `indent_no` (text, UNIQUE): Requisition identifier (`REC-xx`).
- `department` (text): Requesting department.
- `designation` (text): Target position title.
- `status` (text): Lifecycle status (`'NeedMore'`, `'Fulfilled'`, `'Closed'`).

#### 3. `enquiry`
- `id` (bigint, PK): Internal sequence.
- `enquiry_no` (text): Candidate identifier (`ENQ-xx` or `AAP-xx`).
- `indent_no` (text): Foreign link to `indent.indent_no`.
- `name` (text): Candidate full name.
- `mobile_number` (text): Candidate primary telephone.
- `resume` (text): Public URL in `candidate-files` bucket.
- `status` (text): Current interview disposition.
- `actual_2` (timestamp): Date of Joining timestamp (marks completion & moves to History).

#### 4. `follow_up`
- `id` (bigint, PK): Internal sequence.
- `enquiry_id` (bigint, FK): Reference to `enquiry.id`.
- `status` (text): Call outcome.
- `follow_up_date` (date): Scheduled next contact date.
- `remarks` (text): Detailed notes.

#### 5. `joining`
- `id` (bigint, PK): Internal sequence.
- `rbp_joining_id` (text, UNIQUE): Master Employee Identifier (`RBP-xx`).
- `name_as_per_aadhar` (text): Legal full name.
- `status` (text): Employment status (`'Active'` / `'Inactive'`).
- `date_of_joining` (date): Official employment start date.
- `leaving_date` (date): Official employment separation date.
- `dob` (date): Date of Birth.
- `salary` (numeric): Monthly Base Gross Salary.
- `company_pf_provided` (text/boolean): PF eligibility indicator.
- `company_esic_provided` (text/boolean): ESIC eligibility indicator.
- `punch_id` (text): Biometric device mapped identifier.
- `actual_date` (timestamp): Timestamp when all 8 core onboarding tasks are complete.

#### 6. `assets`
- `id` (bigint, PK): Internal sequence.
- `employee_id` (text, FK): Reference to `joining.rbp_joining_id`.
- `asset_name` (text): Hardware/item description.
- `serial_number` (text): Hardware identification code.
- `pdc_cheque_no` (text): Post-Dated Cheque number.
- `pdc_cheque_image` (text): Public URL in `assets` bucket.

#### 7. `employee_leaving`
- `id` (bigint, PK): Internal sequence.
- `employee_id` (text, FK): Reference to `joining.rbp_joining_id`.
- `resignation_acceptance` (boolean): Management approval flag (`true`/`false`).
- `last_working_date` (date): Authorized final work date.
- `fnf_date` (date): Full and Final settlement target date.
- `actual` (timestamp): Timestamp when offboarding clearance is complete.

#### 8. `leave_ledger`
- `id` (bigint, PK): Internal sequence.
- `employee_id` (text, FK): Reference to `joining.rbp_joining_id`.
- `transaction_type` (text): `'CREDIT'` or `'DEBIT'`.
- `leave_type` (text): Leave classification (`'CL'`).
- `days` (numeric): Number of days accrued or consumed.
- `narration` (text): Audit description.

#### 9. `final_attendance`
- `id` (bigint, PK): Internal sequence.
- `employee_id` (text, FK): Reference to `joining.rbp_joining_id`.
- `month` (integer): Calendar month (1-12).
- `year` (integer): Calendar year.
- `present_days` (numeric): Total approved payable days.
- `working_days` (numeric): Standard working days in month.
- `late_days` (numeric): Count of unapproved late arrivals.

#### 10. `payroll_history`
- `id` (bigint, PK): Internal sequence.
- `employee_id` (text, FK): Reference to `joining.rbp_joining_id`.
- `month` (integer): Payroll month.
- `year` (integer): Payroll year.
- `gross_earned` (numeric): Total pro-rated earned gross.
- `net_salary` (numeric): Net compensation payable.
- `total_payable` (numeric): Final bank disbursement amount.
- `locked_at` (timestamp): Finalization timestamp.

---

# 8. Special Technical Logic & Automated Integrations

### 1. PostgreSQL Database Triggers
- **`prevent_inactive_leave_ledger_insert`**:
  - Enforces ledger data integrity by blocking any insert into `leave_ledger` if the target employee's status in `joining` is `'Inactive'`.
- **`cleanup_leave_ledger_on_inactive`**:
  - Automatically triggers when `joining.status` updates to `'Inactive'`, deleting unfinalized future leave ledger allocations.

### 2. HTML5 Canvas Card Rendering Engines
- Dedicated 2D canvas drawing algorithms inside `BirthdayWish.jsx` and `WorkAnniversary.jsx` generate 1000x1300 pixel cards in memory, combining corporate watermarks, sunburst vectors, multi-layered borders, employee portraits, and personalized typography, converting directly to PNG blobs for CDN upload.

### 3. Meta WhatsApp Cloud API Edge Functions
- Secure serverless Edge Functions (`send-birthday-wish` and `send-work-anniversary-wish`) execute on Supabase infrastructure, transforming client requests into authenticated Meta WhatsApp Cloud API template dispatches with attached image headers.

### 4. Client-Side Document Compilers (jsPDF + html2canvas)
- Offer Letters, Confirmation Letters, and Payslips compile dynamically in the client browser at 2x resolution scale, generating professional vector-bordered PDFs without relying on server-side rendering binaries.

### 5. Live-Editable Grid Architecture (`AfterPayment.jsx`)
- Implements custom cell-level state tracking that persists edits directly to PostgreSQL via Supabase `UPDATE` queries on element blur, providing an Excel-like user experience inside the browser.

---

# 9. Page Index & Navigation Route Map

| Sequence | Route URL | Page / Module Name | Primary Responsibility | Upstream Dependency | Downstream Dependency |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | `/login` | `Login.jsx` | User Authentication | Database (`users_hr`) | Access to authorized pages |
| **02** | `/` | `Dashboard.jsx` | Executive Analytics | Aggregated DB records | Operational pages |
| **03** | `/indent` | `Indent.jsx` | Manpower Requisitions | Department demand | `FindEnquiry.jsx` |
| **04** | `/find-enquiry` | `FindEnquiry.jsx` | Candidate Sourcing Pool | `Indent.jsx` (`REC-xx`) | `CallTracker.jsx` |
| **05** | `/call-tracker` | `CallTracker.jsx` | Interview Call Tracking | `FindEnquiry.jsx` (`ENQ-xx`) | `OfferLetter.jsx` / `Joining.jsx` |
| **06** | `/offer-letter` | `OfferLetter.jsx` | Offer & Confirmation PDFs | `CallTracker.jsx` | `Joining.jsx` |
| **07** | `/joining` | `Joining.jsx` | Employee Day-1 Onboarding | `CallTracker.jsx` / `OfferLetter.jsx` | `AfterJoiningWork.jsx` |
| **08** | `/after-joining-work` | `AfterJoiningWork.jsx` | 9-Step Onboarding Checklist | `Joining.jsx` (`RBP-xx`) | `Employee.jsx` (Active Status) |
| **09** | `/employee` | `Employee.jsx` | Master Employee Directory | `Joining.jsx` | Daily tracking & Operations |
| **10** | `/attendancedaily` | `Attendancedaily.jsx` | Daily Biometric & GPS Audit | Biometric punches & Mobile GPS | `AttendancedailyManagement.jsx` |
| **11** | `/attendance-management`| `AttendancedailyManagement.jsx`| Monthly Attendance Matrix | `Attendancedaily.jsx` & Leaves | `Payroll.jsx` |
| **12** | `/leave-management` | `LeaveManagement.jsx` | Approvals (Leave/Punch/Exit)| Employee mobile applications | `leave_ledger` & Attendance |
| **13** | `/leaving-approval` | `ResignationApproval.jsx` | Resignation Governance | Employee resignation requests | `AfterResignationWork.jsx` |
| **14** | `/after-resignation-work`| `AfterResignationWork.jsx`| 7-Step Exit Clearance | `ResignationApproval.jsx` | Full & Final Settlement |
| **15** | `/payroll` | `Payroll.jsx` | Monthly Salary Computation | `AttendancedailyManagement.jsx`| `AfterPayment.jsx` |
| **16** | `/after-payment` | `AfterPayment.jsx` | Post-Disbursement Tracking | Bank payout statement | Final Accounting Closure |
| **17** | `/birthday-wish` | `BirthdayWish.jsx` | WhatsApp Birthday Greetings | `joining.dob` | WhatsApp Cloud API |
| **18** | `/work-anniversary` | `WorkAnniversary.jsx` | WhatsApp Milestone Greetings| `joining.date_of_joining` | WhatsApp Cloud API |
| **19** | `/master` | `Master.jsx` | Central Taxonomies & Masters | Administrative setup | Dropdowns across system |
| **20** | `/add-user` | `AddUsers.jsx` | User Credential Provisioning | Administrative setup | System access for all users |
| **21** | `/report` | `Report.jsx` | Analytical Reports (Mock) | Conceptual DB metrics | Management review |

---

# 10. Master System Flow Diagram

```text
====================================================================================================
                                      MASTER SYSTEM FLOW
====================================================================================================

                                          [ LOGIN ]
                                              │
                                              ▼
                                       [ DASHBOARD ]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         [ RECRUITMENT PIPELINE ]                             [ SYSTEM CONFIGURATION ]
                    │                                                   │
             [ 03. Indent ] ── (REC-xx)                            [ 19. Master ]
                    │                                            (Taxonomies/Firms)
                    ▼                                                   │
          [ 04. Find Enquiry ] ── (ENQ-xx)                         [ 20. Add Users ]
                    │                                            (Portal & App Users)
                    ▼
          [ 05. Call Tracker ]
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   (Not Selected)         (Selected)
         │                     │
    [ Archive ]                ├────────────────────────┐
                               ▼                        ▼
                      [ 06. Offer Letter ]      [ 07. Joining ] ── (RBP-xx)
                     (Optional Email PDF)               │
                                                        ▼
                                             [ 08. After Joining Work ]
                                             (9 Compliance Milestones)
                                                        │
                                                        ▼
                                             [ 09. Employee Directory ]
                                                        │
         ┌──────────────────────────────────────────────┼────────────────────────────────────────┐
         ▼                                              ▼                                        ▼
[ TIME & ATTENDANCE ]                         [ LEAVE & APPROVALS ]                    [ ENGAGEMENT & WISHES ]
         │                                              │                                        │
[ 10. Daily Attendance ]                    [ 12. Approvals Center ]                    [ 17. Birthday Wish ]
  ├── Biometric Machine                       ├── Leave Requests ──> (Debits CL)        [ 18. Anniversary Wish ]
  └── Mobile GPS Trail                        ├── Biometric Punch Corrections                    │
         │                                    └── Resignations                                   ▼
         ▼                                              │                               (Meta WhatsApp API)
[ 11. Attendance Management ]                           ▼
  ├── Late Penalties (4 Lates = 0.5D)       [ 13. Resignation Approval ]
  ├── CL Ledger Accrual / Deductions          ├── Sets Last Working Date
  └── Finalize Attendance Lock                ├── Sets F&F Date
         │                                    └── Updates status = 'Inactive'
         │                                              │
         │                                              ▼
         │                                  [ 14. After Resignation ]
         │                                    ├── 7-Item Exit Clearance
         │                                    └── Assets & PDC Returned
         │                                              │
         └──────────────────────┬───────────────────────┘
                                ▼
                       [ 15. Payroll ]
                         ├── Base Salary Breakdown (50/20/10/15/5)
                         ├── Pro-Rated Paid Days
                         ├── Statutory EPF & ESIC Deductions
                         ├── PDF Payslip Generation
                         └── Finalize to Payroll History
                                │
                                ▼
                    [ 16. After Payment Work ]
                      ├── Bank File Excel Import
                      └── Live Cell Payout Audit
                                │
                                ▼
                     [ PROCESS COMPLETED ]
====================================================================================================
```
