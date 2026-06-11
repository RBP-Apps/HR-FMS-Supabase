# HR-FMS (Human Resource - Force Management System)

A comprehensive **HR Management System** built with React, designed to streamline recruitment, employee management, attendance tracking, payroll processing, and leave management workflows.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## ✨ Features

### Recruitment & Enquiry
- **Indent Management**: Create and track job indents by department, post, and requirements
- **Candidate Enquiry**: Record candidate details, schedule interviews, and track follow-ups
- **Call Tracker**: Monitor HR call activities and candidate interactions
- **Master HR Data**: Manage HR executives, departments, and social site tracking

### Employee Lifecycle
- **Joining Management**: Handle employee onboarding, document collection, and task tracking
- **Leaving Management**: Process resignations, asset handover, and exit formalities
- **Employee Records**: Maintain comprehensive employee information and history

### Attendance & Leave
- **Daily Attendance**: Track and manage daily employee attendance
- **Leave Management**: Submit, approve, and track leave requests
- **My Attendance**: Employee self-service attendance view

### Payroll & Assets
- **Payroll Management**: Generate and manage employee salary slips
- **Asset Tracking**: Assign and monitor company assets (laptops, mobiles, vehicles, etc.)

### Reports & Analytics
- **MIS Reports**: Generate management information system reports
- **Custom Reports**: Export data to Excel/PDF formats
- **Dashboard**: Visual analytics and KPIs

### Additional Features
- **Company Calendar**: Organization-wide event and holiday tracking
- **Gate Pass**: Manage employee gate pass requests
- **User Management**: Role-based access control for different user levels
- **Profile Management**: Employee self-service profile updates

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Recharts** - Data visualization and charts
- **React Icons** / **Font Awesome** - Icon libraries
- **React Hot Toast** - Notification system
- **React Select** - Enhanced select dropdowns

### Utilities
- **jsPDF** + **jsPDF-AutoTable** - PDF generation
- **XLSX** - Excel file handling
- **date-fns** - Date manipulation

### Backend
- **Supabase** - PostgreSQL database and authentication

---

## 🗄 Database Schema

The system uses PostgreSQL (via Supabase) with the following core tables:

| Table | Description |
|-------|-------------|
| `indent` | Job requisition tracking |
| `master_hr` | HR master data and configurations |
| `enquiry` | Candidate enquiry and interview scheduling |
| `follow_up` | Candidate follow-up tracking |
| `joining` | Employee onboarding and joining details |
| `employee_leaving` | Employee exit and resignation tracking |
| `users_hr` | User authentication and role management |
| `assets` | Company asset assignment tracking |

### Key Features
- Auto-calculated delay days between planned and actual dates
- Trigger-based default date calculations
- Cross-table synchronization via database triggers

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase Account** (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HR_FMS_React
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
HR_FMS_React/
├── public/
│   └── RBP.jpg                 # Application logo
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar
│   │   ├── Layout.jsx          # Main layout wrapper
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── ProtectedRoute.jsx  # Auth route protection
│   │   └── NewPayrollModal.jsx # Payroll modal component
│   ├── pages/
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── Login.jsx           # Authentication page
│   │   ├── Indent.jsx          # Indent management
│   │   ├── Master.jsx          # HR master data
│   │   ├── Joining.jsx         # Joining process
│   │   ├── Leaving.jsx         # Leaving process
│   │   ├── Employee.jsx        # Employee records
│   │   ├── Attendance.jsx      # Attendance management
│   │   ├── Attendancedaily.jsx # Daily attendance
│   │   ├── MyAttendance.jsx    # Self-service attendance
│   │   ├── LeaveManagement.jsx # Leave management
│   │   ├── LeaveRequest.jsx    # Leave requests
│   │   ├── Payroll.jsx         # Payroll processing
│   │   ├── MySalary.jsx        # Self-service salary
│   │   ├── CallTracker.jsx     # Call tracking
│   │   ├── FindEnquiry.jsx     # Candidate enquiry
│   │   ├── SocialSite.jsx      # Social site tracking
│   │   ├── Report.jsx          # Report generation
│   │   ├── MisReport.jsx       # MIS reports
│   │   ├── CompanyCalendar.jsx # Company calendar
│   │   ├── GatePass.jsx        # Gate pass management
│   │   ├── GatePassRequest.jsx # Gate pass requests
│   │   ├── MyProfile.jsx       # User profile
│   │   ├── AddUsers.jsx        # User management
│   │   ├── AfterJoiningWork.jsx  # Post-joining tasks
│   │   └── AfterLeavingWork.jsx  # Post-leaving tasks
│   ├── App.jsx                 # Main app component & routing
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── vercel.json                 # Vercel deployment config
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint to check code quality |

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | ✅ Yes |

---

## 🌐 Deployment

### Vercel

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel settings
4. Deploy

The `vercel.json` file is already configured for SPA routing.

### Manual Production Build

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

---

## 👥 User Roles

The system supports role-based access control:
- **Admin**: Full access to all modules and user management
- **HR Manager**: Access to recruitment, employee data, and reports
- **HR Executive**: Limited access to assigned modules
- **Employee**: Self-service access to profile, attendance, and salary

---

## 📝 License

This project is proprietary and confidential.

---

## 📞 Support

For issues or inquiries, contact the development team.

---

**Built with ❤️ using React, Tailwind CSS, and Supabase**
