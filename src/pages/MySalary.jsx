// app/salary-management/page.jsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Calendar,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Ban,
  Unlock,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Mail,
  Printer,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Shield,
  Banknote,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  DollarSign,
  Clock,
  Briefcase,
  MapPin,
  Building,
  User,
  Hash,
  Landmark,
  Home,
  CalendarDays,
  Clock as ClockIcon,
  Coins,
  Gift,
  Receipt,
  BookOpen,
  ThumbsUp,
  UserCog,
  CalendarCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ----------------------------- DUMMY DATA GENERATORS -----------------------------

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const departments = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing', 'Admin'];
const employeeTypes = ['Permanent', 'Contract', 'Trainee', 'Consultant'];
const payrollStatuses = ['Pending', 'Processed', 'Approved', 'Paid', 'Hold'];
const bankNames = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank'];

// Generate dummy employees
const generateDummyEmployees = () => {
  const employees = [];
  const designations = {
    'IT': ['Software Engineer', 'Senior Developer', 'Tech Lead', 'System Analyst'],
    'HR': ['HR Executive', 'HR Manager', 'Recruiter', 'Training Coordinator'],
    'Finance': ['Accountant', 'Finance Manager', 'Tax Analyst', 'Payroll Specialist'],
    'Operations': ['Operations Manager', 'Project Coordinator', 'Team Lead', 'Process Executive'],
    'Sales': ['Sales Executive', 'Sales Manager', 'Business Development', 'Account Manager'],
    'Marketing': ['Marketing Specialist', 'Digital Marketer', 'Brand Manager', 'SEO Analyst'],
    'Admin': ['Administrator', 'Office Manager', 'Receptionist', 'Facility Executive']
  };

  for (let i = 1; i <= 50; i++) {
    const dept = departments[i % departments.length];
    const basicSalary = 20000 + (i * 1500);
    
    employees.push({
      id: `EMP${String(i).padStart(4, '0')}`,
      employee_code: `E${String(i).padStart(4, '0')}`,
      employee_name: `Employee ${i}`,
      department: dept,
      designation: designations[dept][i % designations[dept].length],
      joining_date: `202${i % 3 + 1}-${String((i % 12) + 1).padStart(2, '0')}-01`,
      employee_type: employeeTypes[i % employeeTypes.length],
      uan_number: `UAN${String(i).padStart(10, '0')}`,
      esic_number: `ESIC${String(i).padStart(10, '0')}`,
      bank_name: bankNames[i % bankNames.length],
      account_number: `ACC${String(i).padStart(12, '0')}`,
      ifsc_code: `IFSC${String(i % 10)}${String(i).padStart(4, '0')}`,
      basic_salary: basicSalary,
      hra_percent: 30 + (i % 20),
      conveyance_allowance: 1600 + (i % 500),
      washing_allowance: 600 + (i % 200),
      medical_allowance: 1250 + (i % 500),
      special_allowance: 2000 + (i % 1000),
      other_allowance: 500 + (i % 300),
      daily_wage: Math.round(basicSalary / 26)
    });
  }
  return employees;
};

// Generate dummy attendance for a month
const generateDummyAttendance = (employees, month, year) => {
  return employees.map(emp => {
    const workingDays = 26;
    const presentDays = 18 + Math.floor(Math.random() * 8);
    const absentDays = workingDays - presentDays - Math.floor(Math.random() * 3);
    const halfDays = Math.floor(Math.random() * 3);
    const leaveWithoutPay = Math.floor(Math.random() * 2);
    const otHours = Math.floor(Math.random() * 12);
    const lateCount = Math.floor(Math.random() * 6);
    
    let attendanceStatus = 'Present';
    if (absentDays > 5) attendanceStatus = 'Poor';
    else if (absentDays > 2) attendanceStatus = 'Average';
    else if (absentDays === 0) attendanceStatus = 'Perfect';
    
    return {
      employee_id: emp.id,
      month: month + 1,
      year: year,
      working_days: workingDays,
      present_days: presentDays,
      week_off: 4,
      holidays: 2,
      paid_leave: Math.floor(Math.random() * 2),
      leave_without_pay: leaveWithoutPay,
      absent_days: absentDays,
      half_days: halfDays,
      ot_hours: otHours,
      late_count: lateCount,
      attendance_status: attendanceStatus
    };
  });
};

// Calculate salary based on attendance
const calculateSalary = (employee, attendance, existingBonus = 0, existingIncentive = 0) => {
  const workingDays = attendance?.working_days || 26;
  const presentDays = attendance?.present_days || 0;
  const halfDays = attendance?.half_days || 0;
  const otHours = attendance?.ot_hours || 0;
  const leaveWithoutPay = attendance?.leave_without_pay || 0;
  const lateCount = attendance?.late_count || 0;
  
  const dailyWage = employee.daily_wage || (employee.basic_salary / workingDays);
  const effectivePresentDays = presentDays + (halfDays * 0.5);
  
  // Earned components
  const earnedBasic = (employee.basic_salary / workingDays) * effectivePresentDays;
  const earnedHRA = (employee.basic_salary * (employee.hra_percent / 100) / workingDays) * effectivePresentDays;
  
  const earnedConveyance = (employee.conveyance_allowance / workingDays) * effectivePresentDays;
  const earnedWashing = (employee.washing_allowance / workingDays) * effectivePresentDays;
  const earnedMedical = (employee.medical_allowance / workingDays) * effectivePresentDays;
  const earnedSpecial = (employee.special_allowance / workingDays) * effectivePresentDays;
  const earnedOther = (employee.other_allowance / workingDays) * effectivePresentDays;
  const earnedAllowance = earnedConveyance + earnedWashing + earnedMedical + earnedSpecial + earnedOther;
  
  // OT calculation (1.5x hourly rate)
  const otRate = (dailyWage / 8) * 1.5;
  const otAmount = otHours * otRate;
  
  // Late deduction (₹50 per late)
  const lateDeduction = lateCount * 50;
  
  // LWP deduction
  const lwpDeduction = dailyWage * leaveWithoutPay;
  
  const bonus = existingBonus || Math.min(employee.basic_salary * 0.0833, 7000);
  const incentive = existingIncentive;
  
  const earnedGrossSalary = earnedBasic + earnedHRA + earnedAllowance + otAmount + bonus + incentive;
  
  // PF Calculation (12% of basic, max 1800)
  const employeePf = Math.min(earnedBasic * 0.12, 1800);
  const employerPf = Math.min(earnedBasic * 0.13, 1950);
  
  // ESIC Calculation (0.75% for employee, 3.25% for employer, for salary < 21000)
  const employeeEsic = earnedGrossSalary < 21000 ? earnedGrossSalary * 0.0075 : 0;
  const employerEsic = earnedGrossSalary < 21000 ? earnedGrossSalary * 0.0325 : 0;
  
  // PT Deduction
  let ptDeduction = 0;
  if (earnedGrossSalary <= 3000) ptDeduction = 0;
  else if (earnedGrossSalary <= 6000) ptDeduction = 80;
  else if (earnedGrossSalary <= 9000) ptDeduction = 150;
  else if (earnedGrossSalary <= 12000) ptDeduction = 200;
  else ptDeduction = 300;
  
  // TDS (10% above 50000)
  const tds = earnedGrossSalary > 50000 ? (earnedGrossSalary - 50000) * 0.1 : 0;
  
  const totalDeduction = employeePf + employeeEsic + ptDeduction + tds + lateDeduction + lwpDeduction;
  const netSalary = earnedGrossSalary - totalDeduction;
  const netPayableSalary = netSalary;
  
  return {
    earnedBasic,
    earnedHRA,
    earnedAllowance,
    earnedGrossSalary,
    otAmount,
    bonus,
    incentive,
    employeePf,
    employerPf,
    employeeEsic,
    employerEsic,
    ptDeduction,
    tds,
    lateDeduction,
    lwpDeduction,
    totalDeduction,
    netSalary,
    netPayableSalary,
    dailyWage,
    perDaySalary: dailyWage
  };
};

// Generate payroll records for all employees
const generatePayrollRecords = (employees, month, year, existingRecords = []) => {
  const attendances = generateDummyAttendance(employees, month, year);
  const payrollStatusesList = ['Pending', 'Processed', 'Approved', 'Paid', 'Hold'];
  
  return employees.map((emp, idx) => {
    const attendance = attendances.find(a => a.employee_id === emp.id);
    const existing = existingRecords.find(r => r.employee_id === emp.id);
    const calculations = calculateSalary(emp, attendance, existing?.bonus, existing?.incentive);
    const payrollStatus = payrollStatusesList[idx % payrollStatusesList.length];
    const isPaid = payrollStatus === 'Paid';
    const isApproved = payrollStatus === 'Approved' || payrollStatus === 'Paid';
    
    return {
      id: `${emp.id}_${month}_${year}`,
      employee_id: emp.id,
      month: month + 1,
      year: year,
      employee: emp,
      attendance: attendance,
      // Structure columns
      basic_da: emp.basic_salary,
      hra: emp.basic_salary * (emp.hra_percent / 100),
      conveyance_allowance: emp.conveyance_allowance,
      washing_allowance: emp.washing_allowance,
      medical_allowance: emp.medical_allowance,
      special_allowance: emp.special_allowance,
      other_allowance: emp.other_allowance,
      gross_salary: emp.basic_salary + (emp.basic_salary * (emp.hra_percent / 100)) + emp.conveyance_allowance + emp.washing_allowance + emp.medical_allowance + emp.special_allowance + emp.other_allowance,
      per_day_salary: calculations.perDaySalary,
      daily_wage: calculations.dailyWage,
      // Earned
      earned_basic: calculations.earnedBasic,
      earned_hra: calculations.earnedHRA,
      earned_allowance: calculations.earnedAllowance,
      earned_gross_salary: calculations.earnedGrossSalary,
      ot_amount: calculations.otAmount,
      bonus: calculations.bonus,
      incentive: calculations.incentive,
      reimbursement: existing?.reimbursement || 0,
      arrear: existing?.arrear || 0,
      extra_earnings: existing?.extra_earnings || 0,
      // Deductions
      employee_pf: calculations.employeePf,
      employer_pf: calculations.employerPf,
      employee_esic: calculations.employeeEsic,
      employer_esic: calculations.employerEsic,
      pt_deduction: calculations.ptDeduction,
      tds: calculations.tds,
      advance_deduction: existing?.advance_deduction || 0,
      loan_deduction: existing?.loan_deduction || 0,
      other_deduction: existing?.other_deduction || 0,
      total_deduction: calculations.totalDeduction + (existing?.advance_deduction || 0) + (existing?.loan_deduction || 0) + (existing?.other_deduction || 0),
      // Final
      net_salary: calculations.netSalary,
      paid_amount: isPaid ? calculations.netSalary : 0,
      balance_amount: isPaid ? 0 : calculations.netSalary,
      salary_hold_amount: payrollStatus === 'Hold' ? calculations.netSalary : 0,
      net_payable_salary: payrollStatus === 'Hold' ? 0 : calculations.netSalary,
      payment_status: isPaid ? 'Paid' : 'Pending',
      payment_date: isPaid ? new Date().toISOString() : null,
      salary_transfer_status: isPaid ? 'Transferred' : 'Pending',
      payroll_status: payrollStatus,
      hr_remarks: existing?.hr_remarks || '',
      accounts_remarks: existing?.accounts_remarks || '',
      approval_status: isApproved ? 'Approved' : 'Pending',
      approved_by: isApproved ? 'Admin User' : '',
      approved_date: isApproved ? new Date().toISOString() : null
    };
  });
};

// ----------------------------- MAIN COMPONENT -----------------------------

export default function SalaryManagement() {
  // State
  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('All');
  const [employeeSearch, setEmployeeSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  // UI State
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Summary State
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalGrossSalary: 0,
    totalDeduction: 0,
    totalNetSalary: 0,
    totalPF: 0,
    totalESIC: 0,
    totalPayableSalary: 0
  });
  
  const [footerSummary, setFooterSummary] = useState({
    totalGrossSalary: 0,
    totalBonus: 0,
    totalPF: 0,
    totalESIC: 0,
    totalDeduction: 0,
    totalNetSalary: 0,
    totalPayableSalary: 0
  });

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Initialize dummy data
  const initializeData = useCallback(() => {
    setLoading(true);
    try {
      const dummyEmployees = generateDummyEmployees();
      setEmployees(dummyEmployees);
      
      const dummyPayroll = generatePayrollRecords(dummyEmployees, selectedMonth, selectedYear);
      setPayrollRecords(dummyPayroll);
    } catch (err) {
      console.error('Error initializing data:', err);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Process/Generate Salary
  const processSalary = () => {
    setProcessing(true);
    setTimeout(() => {
      const newPayroll = generatePayrollRecords(employees, selectedMonth, selectedYear, payrollRecords);
      setPayrollRecords(newPayroll);
      showNotification('Salary processed successfully!', 'success');
      setProcessing(false);
    }, 1000);
  };

  // Approve salary
  const approveSalary = (recordId) => {
    setPayrollRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, payroll_status: 'Approved', approval_status: 'Approved', approved_by: 'Admin User', approved_date: new Date().toISOString() }
        : record
    ));
    showNotification('Salary approved successfully', 'success');
  };

  // Hold salary
  const holdSalary = (recordId) => {
    setPayrollRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, payroll_status: 'Hold', salary_hold_amount: record.net_salary, net_payable_salary: 0 }
        : record
    ));
    showNotification('Salary put on hold', 'success');
  };

  // Release salary
  const releaseSalary = (recordId) => {
    setPayrollRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, payroll_status: 'Processed', salary_hold_amount: 0, net_payable_salary: record.net_salary }
        : record
    ));
    showNotification('Salary released', 'success');
  };

  // Update bonus/incentive
  const updateEarnings = () => {
    if (!editingRecord) return;
    setPayrollRecords(prev => prev.map(record => 
      record.id === editingRecord.id 
        ? { ...record, bonus: editingRecord.bonus, incentive: editingRecord.incentive, reimbursement: editingRecord.reimbursement, arrear: editingRecord.arrear, extra_earnings: editingRecord.extra_earnings,
            advance_deduction: editingRecord.advance_deduction, loan_deduction: editingRecord.loan_deduction, other_deduction: editingRecord.other_deduction }
        : record
    ));
    setEditingRecord(null);
    showNotification('Salary details updated', 'success');
  };

  // Get filtered records
  const getFilteredRecords = () => {
    let filtered = [...payrollRecords];
    
    if (departmentFilter !== 'All') {
      filtered = filtered.filter(r => r.employee?.department === departmentFilter);
    }
    if (employeeTypeFilter !== 'All') {
      filtered = filtered.filter(r => r.employee?.employee_type === employeeTypeFilter);
    }
    if (payrollStatusFilter !== 'All') {
      filtered = filtered.filter(r => r.payroll_status === payrollStatusFilter);
    }
    if (employeeSearch) {
      const searchLower = employeeSearch.toLowerCase();
      filtered = filtered.filter(r => 
        r.employee?.employee_code?.toLowerCase().includes(searchLower) ||
        r.employee?.employee_name?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  };

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const filtered = getFilteredRecords();
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [payrollRecords, currentPage, rowsPerPage, departmentFilter, employeeTypeFilter, employeeSearch, payrollStatusFilter]);

  const totalPages = Math.ceil(getFilteredRecords().length / rowsPerPage);

  // Update summaries
  const updateSummaries = useCallback(() => {
    const filtered = getFilteredRecords();
    
    const totalEmployees = filtered.length;
    const totalPresent = filtered.reduce((sum, r) => sum + (r.attendance?.present_days || 0), 0);
    const totalAbsent = filtered.reduce((sum, r) => sum + (r.attendance?.absent_days || 0), 0);
    const totalGrossSalary = filtered.reduce((sum, r) => sum + (r.gross_salary || 0), 0);
    const totalDeduction = filtered.reduce((sum, r) => sum + (r.total_deduction || 0), 0);
    const totalNetSalary = filtered.reduce((sum, r) => sum + (r.net_salary || 0), 0);
    const totalPF = filtered.reduce((sum, r) => sum + (r.employee_pf || 0), 0);
    const totalESIC = filtered.reduce((sum, r) => sum + (r.employee_esic || 0), 0);
    const totalPayableSalary = filtered.reduce((sum, r) => sum + (r.net_payable_salary || 0), 0);
    
    setSummary({
      totalEmployees, totalPresent, totalAbsent, totalGrossSalary,
      totalDeduction, totalNetSalary, totalPF, totalESIC, totalPayableSalary
    });
    
    setFooterSummary({
      totalGrossSalary,
      totalBonus: filtered.reduce((sum, r) => sum + (r.bonus || 0), 0),
      totalPF,
      totalESIC,
      totalDeduction,
      totalNetSalary,
      totalPayableSalary
    });
  }, [payrollRecords, departmentFilter, employeeTypeFilter, employeeSearch, payrollStatusFilter]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    updateSummaries();
  }, [payrollRecords, departmentFilter, employeeTypeFilter, employeeSearch, payrollStatusFilter, updateSummaries]);

  // Export to Excel
  const exportToExcel = () => {
    const filtered = getFilteredRecords();
    const exportData = filtered.map((r, idx) => ({
      'Sr No': idx + 1,
      'Employee ID': r.employee?.id,
      'Employee Code': r.employee?.employee_code,
      'Employee Name': r.employee?.employee_name,
      'Department': r.employee?.department,
      'Designation': r.employee?.designation,
      'Basic + DA': r.basic_da,
      'HRA': r.hra,
      'Conveyance': r.conveyance_allowance,
      'Medical': r.medical_allowance,
      'Gross Salary': r.gross_salary,
      'Earned Basic': r.earned_basic,
      'Earned Gross': r.earned_gross_salary,
      'OT Amount': r.ot_amount,
      'Bonus': r.bonus,
      'Incentive': r.incentive,
      'PF': r.employee_pf,
      'ESIC': r.employee_esic,
      'PT Deduction': r.pt_deduction,
      'TDS': r.tds,
      'Total Deduction': r.total_deduction,
      'Net Salary': r.net_salary,
      'Net Payable': r.net_payable_salary,
      'Payroll Status': r.payroll_status,
      'Payment Status': r.payment_status
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Salary_${monthsList[selectedMonth]}_${selectedYear}`);
    XLSX.writeFile(wb, `salary_report_${selectedYear}_${selectedMonth + 1}.xlsx`);
    showNotification('Exported to Excel successfully', 'success');
  };

  // Generate PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.text(`Salary Report - ${monthsList[selectedMonth]} ${selectedYear}`, 20, 15);
    
    const filtered = getFilteredRecords();
    const tableData = filtered.map((r, idx) => [
      idx + 1,
      r.employee?.employee_code || '',
      r.employee?.employee_name || '',
      r.employee?.department || '',
      `₹${(r.net_salary || 0).toLocaleString()}`,
      r.payroll_status || ''
    ]);
    
    autoTable(doc, {
      head: [['#', 'Code', 'Name', 'Department', 'Net Salary', 'Status']],
      body: tableData,
      startY: 25,
    });
    
    doc.save(`salary_report_${selectedYear}_${selectedMonth + 1}.pdf`);
    showNotification('PDF exported successfully', 'success');
  };

  // Generate payslip
  const generatePayslip = (record) => {
    setSelectedRecord(record);
    setShowPayslipModal(true);
  };

  // Send email
  const sendEmailPayslip = (record) => {
    showNotification(`Payslip sent to ${record.employee?.employee_name}`, 'success');
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processed: 'bg-blue-100 text-blue-800',
      Approved: 'bg-green-100 text-green-800',
      Paid: 'bg-emerald-100 text-emerald-800',
      Hold: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceBadge = (status) => {
    const styles = {
      Perfect: 'bg-green-100 text-green-800',
      Present: 'bg-blue-100 text-blue-800',
      Average: 'bg-yellow-100 text-yellow-800',
      Poor: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'
        } border`}>
          {notification.message}
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
              Salary Management
            </h1>
            <p className="text-gray-500 mt-1">Complete HRMS payroll & salary processing system</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={processSalary}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Process Salary
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Employees</p><p className="text-2xl font-bold">{summary.totalEmployees}</p></div>
              <Users className="w-8 h-8 text-blue-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Present</p><p className="text-2xl font-bold">{summary.totalPresent}</p></div>
              <UserCheck className="w-8 h-8 text-green-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Absent</p><p className="text-2xl font-bold">{summary.totalAbsent}</p></div>
              <UserX className="w-8 h-8 text-red-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Gross Salary</p><p className="text-2xl font-bold">₹{summary.totalGrossSalary.toLocaleString()}</p></div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Deduction</p><p className="text-2xl font-bold">₹{summary.totalDeduction.toLocaleString()}</p></div>
              <TrendingDown className="w-8 h-8 text-orange-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Net Salary</p><p className="text-2xl font-bold">₹{summary.totalNetSalary.toLocaleString()}</p></div>
              <CreditCard className="w-8 h-8 text-emerald-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total PF</p><p className="text-2xl font-bold">₹{summary.totalPF.toLocaleString()}</p></div>
              <PiggyBank className="w-8 h-8 text-indigo-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total ESIC</p><p className="text-2xl font-bold">₹{summary.totalESIC.toLocaleString()}</p></div>
              <Shield className="w-8 h-8 text-cyan-500 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Payable Salary</p><p className="text-2xl font-bold">₹{summary.totalPayableSalary.toLocaleString()}</p></div>
              <Banknote className="w-8 h-8 text-rose-500 opacity-75" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
                {monthsList.map((month, idx) => (<option key={month} value={idx}>{month}</option>))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
                {[2023, 2024, 2025, 2026].map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option>All</option>{departments.map(d => (<option key={d}>{d}</option>))}
            </select>
            <select value={employeeTypeFilter} onChange={(e) => setEmployeeTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option>All</option>{employeeTypes.map(t => (<option key={t}>{t}</option>))}
            </select>
            <select value={payrollStatusFilter} onChange={(e) => setPayrollStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option>All</option>{payrollStatuses.map(s => (<option key={s}>{s}</option>))}
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search employee..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={processSalary} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Generate Salary</button>
          </div>
        </div>

        {/* Salary Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-xs font-medium text-gray-500 uppercase">
                    <th className="px-3 py-3">#</th><th className="px-3 py-3">Emp ID</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Dept</th><th className="px-3 py-3">Designation</th><th className="px-3 py-3">Joining</th><th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">UAN</th><th className="px-3 py-3">ESIC</th><th className="px-3 py-3">Bank</th><th className="px-3 py-3">Account</th>
                    <th className="px-3 py-3">IFSC</th><th className="px-3 py-3">Working Days</th><th className="px-3 py-3">Present</th><th className="px-3 py-3">Week Off</th>
                    <th className="px-3 py-3">Holidays</th><th className="px-3 py-3">Paid Leave</th><th className="px-3 py-3">LWP</th><th className="px-3 py-3">Absent</th>
                    <th className="px-3 py-3">Half Days</th><th className="px-3 py-3">OT Hours</th><th className="px-3 py-3">Late Count</th><th className="px-3 py-3">Attendance Status</th>
                    <th className="px-3 py-3">Basic+DA</th><th className="px-3 py-3">HRA</th><th className="px-3 py-3">Conveyance</th><th className="px-3 py-3">Washing</th>
                    <th className="px-3 py-3">Medical</th><th className="px-3 py-3">Special</th><th className="px-3 py-3">Other</th><th className="px-3 py-3">Gross</th>
                    <th className="px-3 py-3">Per Day</th><th className="px-3 py-3">Daily Wage</th><th className="px-3 py-3">Earned Basic</th><th className="px-3 py-3">Earned HRA</th>
                    <th className="px-3 py-3">Earned Allow</th><th className="px-3 py-3">Earned Gross</th><th className="px-3 py-3">OT Amount</th><th className="px-3 py-3">Bonus</th>
                    <th className="px-3 py-3">Incentive</th><th className="px-3 py-3">Reimburse</th><th className="px-3 py-3">Arrear</th><th className="px-3 py-3">Extra Earn</th>
                    <th className="px-3 py-3">Emp PF 12%</th><th className="px-3 py-3">Emp PF 13%</th><th className="px-3 py-3">Emp ESIC</th><th className="px-3 py-3">Er ESIC</th>
                    <th className="px-3 py-3">PT Ded</th><th className="px-3 py-3">TDS</th><th className="px-3 py-3">Adv Ded</th><th className="px-3 py-3">Loan Ded</th>
                    <th className="px-3 py-3">Other Ded</th><th className="px-3 py-3">Total Ded</th><th className="px-3 py-3">Net Salary</th><th className="px-3 py-3">Paid Amt</th>
                    <th className="px-3 py-3">Balance</th><th className="px-3 py-3">Hold Amt</th><th className="px-3 py-3">Net Payable</th><th className="px-3 py-3">Payment Status</th>
                    <th className="px-3 py-3">Pay Date</th><th className="px-3 py-3">Transfer Status</th><th className="px-3 py-3">Payroll Status</th><th className="px-3 py-3">HR Remarks</th>
                    <th className="px-3 py-3">Accounts Remarks</th><th className="px-3 py-3">Approval</th><th className="px-3 py-3">Approved By</th><th className="px-3 py-3">Approved Date</th>
                    <th className="px-3 py-3 sticky right-0 bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRecords.map((record, idx) => {
                    const emp = record.employee;
                    const att = record.attendance;
                    if (!emp) return null;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{(currentPage-1)*rowsPerPage+idx+1}</td>
                        <td className="px-3 py-2">{emp.id}</td>
                        <td className="px-3 py-2 font-mono text-xs">{emp.employee_code}</td>
                        <td className="px-3 py-2 font-medium">{emp.employee_name}</td>
                        <td className="px-3 py-2">{emp.department}</td>
                        <td className="px-3 py-2">{emp.designation}</td>
                        <td className="px-3 py-2">{emp.joining_date}</td>
                        <td className="px-3 py-2">{emp.employee_type}</td>
                        <td className="px-3 py-2">{emp.uan_number}</td>
                        <td className="px-3 py-2">{emp.esic_number}</td>
                        <td className="px-3 py-2">{emp.bank_name}</td>
                        <td className="px-3 py-2">{emp.account_number}</td>
                        <td className="px-3 py-2">{emp.ifsc_code}</td>
                        <td className="px-3 py-2">{att?.working_days || '-'}</td>
                        <td className="px-3 py-2">{att?.present_days || '-'}</td>
                        <td className="px-3 py-2">{att?.week_off || '-'}</td>
                        <td className="px-3 py-2">{att?.holidays || '-'}</td>
                        <td className="px-3 py-2">{att?.paid_leave || '-'}</td>
                        <td className="px-3 py-2">{att?.leave_without_pay || '-'}</td>
                        <td className="px-3 py-2">{att?.absent_days || '-'}</td>
                        <td className="px-3 py-2">{att?.half_days || '-'}</td>
                        <td className="px-3 py-2">{att?.ot_hours || '-'}</td>
                        <td className="px-3 py-2">{att?.late_count || '-'}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${getAttendanceBadge(att?.attendance_status)}`}>{att?.attendance_status || '-'}</span></td>
                        <td className="px-3 py-2">₹{record.basic_da?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.hra?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.conveyance_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.washing_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.medical_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.special_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.other_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2 font-medium">₹{record.gross_salary?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.per_day_salary?.toFixed(2)}</td>
                        <td className="px-3 py-2">₹{record.daily_wage?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.earned_basic?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.earned_hra?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.earned_allowance?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.earned_gross_salary?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.ot_amount?.toLocaleString()}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.bonus} onChange={(e) => setEditingRecord({...editingRecord, bonus: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.bonus?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.incentive} onChange={(e) => setEditingRecord({...editingRecord, incentive: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.incentive?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.reimbursement} onChange={(e) => setEditingRecord({...editingRecord, reimbursement: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.reimbursement?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2">₹{record.arrear?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.extra_earnings?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.employee_pf?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.employer_pf?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.employee_esic?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.employer_esic?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.pt_deduction?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.tds?.toLocaleString()}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.advance_deduction} onChange={(e) => setEditingRecord({...editingRecord, advance_deduction: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.advance_deduction?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.loan_deduction} onChange={(e) => setEditingRecord({...editingRecord, loan_deduction: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.loan_deduction?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2">{editingRecord?.id === record.id ? <input type="number" value={editingRecord.other_deduction} onChange={(e) => setEditingRecord({...editingRecord, other_deduction: parseFloat(e.target.value)||0})} className="w-20 px-1 border rounded text-sm" /> : <span>₹{record.other_deduction?.toLocaleString()}</span>}</td>
                        <td className="px-3 py-2 font-medium">₹{record.total_deduction?.toLocaleString()}</td>
                        <td className="px-3 py-2 font-bold text-green-700">₹{record.net_salary?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.paid_amount?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.balance_amount?.toLocaleString()}</td>
                        <td className="px-3 py-2">₹{record.salary_hold_amount?.toLocaleString()}</td>
                        <td className="px-3 py-2 font-bold text-blue-700">₹{record.net_payable_salary?.toLocaleString()}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${record.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.payment_status}</span></td>
                        <td className="px-3 py-2">{record.payment_date ? new Date(record.payment_date).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2">{record.salary_transfer_status}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(record.payroll_status)}`}>{record.payroll_status}</span></td>
                        <td className="px-3 py-2 max-w-[150px] truncate">{record.hr_remarks || '-'}</td>
                        <td className="px-3 py-2 max-w-[150px] truncate">{record.accounts_remarks || '-'}</td>
                        <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${record.approval_status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.approval_status}</span></td>
                        <td className="px-3 py-2">{record.approved_by || '-'}</td>
                        <td className="px-3 py-2">{record.approved_date ? new Date(record.approved_date).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2 sticky right-0 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => generatePayslip(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => setEditingRecord(record)} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                            {record.payroll_status === 'Processed' && <button onClick={() => approveSalary(record.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve"><CheckCircle className="w-4 h-4" /></button>}
                            <button onClick={() => generatePayslip(record)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Generate"><FileText className="w-4 h-4" /></button>
                            <button onClick={() => sendEmailPayslip(record)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Email"><Mail className="w-4 h-4" /></button>
                            {record.payroll_status !== 'Hold' ? <button onClick={() => holdSalary(record.id)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Hold"><Ban className="w-4 h-4" /></button> : <button onClick={() => releaseSalary(record.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Release"><Unlock className="w-4 h-4" /></button>}
                          </div>
                          {editingRecord?.id === record.id && <div className="mt-1 flex gap-1"><button onClick={updateEarnings} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingRecord(null)} className="px-2 py-0.5 text-xs bg-gray-400 text-white rounded">Cancel</button></div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr><td colSpan={31} className="px-3 py-2 text-right">Totals:</td>
                    <td className="px-3 py-2">₹{footerSummary.totalGrossSalary.toLocaleString()}</td><td colSpan={7}></td>
                    <td className="px-3 py-2">₹{footerSummary.totalBonus.toLocaleString()}</td><td colSpan={3}></td>
                    <td className="px-3 py-2">₹{footerSummary.totalPF.toLocaleString()}</td><td className="px-3 py-2"></td>
                    <td className="px-3 py-2">₹{footerSummary.totalESIC.toLocaleString()}</td><td className="px-3 py-2"></td><td colSpan={3}></td>
                    <td className="px-3 py-2">₹{footerSummary.totalDeduction.toLocaleString()}</td>
                    <td className="px-3 py-2 font-bold text-green-700">₹{footerSummary.totalNetSalary.toLocaleString()}</td><td colSpan={3}></td>
                    <td className="px-3 py-2 font-bold text-blue-700">₹{footerSummary.totalPayableSalary.toLocaleString()}</td><td colSpan={10}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-500">Showing {((currentPage-1)*rowsPerPage)+1} to {Math.min(currentPage*rowsPerPage, getFilteredRecords().length)} of {getFilteredRecords().length} entries</div>
            <div className="flex gap-2"><button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="p-2 border rounded disabled:opacity-50"><ChevronLeft className="w-4 h-4"/></button><span className="px-3 py-1 border rounded bg-gray-50">{currentPage} / {totalPages||1}</span><button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages||totalPages===0} className="p-2 border rounded disabled:opacity-50"><ChevronRight className="w-4 h-4"/></button><select value={rowsPerPage} onChange={(e)=>{setRowsPerPage(parseInt(e.target.value));setCurrentPage(1);}} className="border rounded px-2 text-sm">{[10,20,50,100].map(rows=>(<option key={rows} value={rows}>{rows} rows</option>))}</select></div>
          </div>
        </div>
      </div>

      {/* Payslip Modal */}
      {showPayslipModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Salary Payslip</h2><button onClick={() => setShowPayslipModal(false)}><XCircle className="w-6 h-6 text-gray-500"/></button></div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4"><h3 className="text-lg font-bold">{selectedRecord.employee?.employee_name}</h3><p className="text-gray-500">{selectedRecord.employee?.designation} - {selectedRecord.employee?.department}</p><p className="text-sm">Employee Code: {selectedRecord.employee?.employee_code}</p></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-gray-500">Pay Period</p><p className="font-medium">{monthsList[selectedMonth]} {selectedYear}</p></div><div><p className="text-sm text-gray-500">Payment Date</p><p className="font-medium">{selectedRecord.payment_date || 'Not Paid'}</p></div></div>
              <div className="border-t pt-4"><h4 className="font-semibold mb-2">Earnings</h4><div className="space-y-1 text-sm"><div className="flex justify-between"><span>Basic + DA</span><span>₹{selectedRecord.earned_basic?.toLocaleString()}</span></div><div className="flex justify-between"><span>HRA</span><span>₹{selectedRecord.earned_hra?.toLocaleString()}</span></div><div className="flex justify-between"><span>Allowances</span><span>₹{selectedRecord.earned_allowance?.toLocaleString()}</span></div><div className="flex justify-between"><span>OT Amount</span><span>₹{selectedRecord.ot_amount?.toLocaleString()}</span></div><div className="flex justify-between"><span>Bonus</span><span>₹{selectedRecord.bonus?.toLocaleString()}</span></div><div className="flex justify-between"><span>Incentive</span><span>₹{selectedRecord.incentive?.toLocaleString()}</span></div><div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Gross Salary</span><span>₹{selectedRecord.gross_salary?.toLocaleString()}</span></div></div></div>
              <div className="border-t pt-4"><h4 className="font-semibold mb-2">Deductions</h4><div className="space-y-1 text-sm"><div className="flex justify-between"><span>PF</span><span>₹{selectedRecord.employee_pf?.toLocaleString()}</span></div><div className="flex justify-between"><span>ESIC</span><span>₹{selectedRecord.employee_esic?.toLocaleString()}</span></div><div className="flex justify-between"><span>Professional Tax</span><span>₹{selectedRecord.pt_deduction?.toLocaleString()}</span></div><div className="flex justify-between"><span>TDS</span><span>₹{selectedRecord.tds?.toLocaleString()}</span></div><div className="flex justify-between"><span>Advance</span><span>₹{selectedRecord.advance_deduction?.toLocaleString()}</span></div><div className="flex justify-between"><span>Loan</span><span>₹{selectedRecord.loan_deduction?.toLocaleString()}</span></div><div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total Deductions</span><span>₹{selectedRecord.total_deduction?.toLocaleString()}</span></div></div></div>
              <div className="border-t pt-4"><div className="flex justify-between text-lg font-bold"><span>Net Salary</span><span className="text-green-700">₹{selectedRecord.net_salary?.toLocaleString()}</span></div><div className="flex justify-between text-sm text-gray-500 mt-1"><span>Net Payable</span><span>₹{selectedRecord.net_payable_salary?.toLocaleString()}</span></div></div>
              <div className="text-xs text-gray-400 text-center">This is a computer generated document. No signature required. (Demo Data)</div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2"><button onClick={() => showNotification('Payslip PDF generated', 'success')} className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Printer className="w-4 h-4 inline mr-1"/> Print</button><button onClick={() => sendEmailPayslip(selectedRecord)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg"><Mail className="w-4 h-4 inline mr-1"/> Email</button></div>
          </div>
        </div>
      )}
    </div>
  );
}