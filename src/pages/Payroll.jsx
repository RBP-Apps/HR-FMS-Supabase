import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import supabase from '../utils/supabase';
import { MONTHS, fmt } from './payroll/payrollConstants';
import { calcSalary } from './payroll/payrollCalc';
import PayrollCards from './payroll/PayrollCards';
import PayrollFilters from './payroll/PayrollFilters';
import PayrollTable from './payroll/PayrollTable';
import PayrollEditModal from './payroll/PayrollEditModal';
import PayslipModal from './payroll/PayslipModal';

// ─── Toast ──────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold
            pointer-events-auto transition-all duration-300
            ${t.type === 'error'
              ? 'bg-red-600 text-white'
              : t.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
        >
          {t.type === 'error' ? '✕' : '✓'} {t.message}
        </div>
      ))}
    </div>
  );
}

const DEFAULT_FILTERS = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  search: '',
  department: 'All',
  designation: 'All',
  payrollStatus: 'All',
  pfEnabled: 'All',
  esicEnabled: 'All',
  hasAdvance: 'All',
  minGross: '',
  maxGross: '',
  minPresent: '',
};

export default function PayrollPage() {
  // ─── Core data ────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  // edits: { [recordId]: { advance, security_deposit, other_deduction, reimbursement, salary_arrears, ta_da, ot, remark } }
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);

  // ─── Filters ──────────────────────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [cardFilter, setCardFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const searchTimer = useRef(null);

  // ─── Pagination ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ─── Modals ───────────────────────────────────────────────────────
  const [editRecord, setEditRecord] = useState(null);
  const [payslipRecord, setPayslipRecord] = useState(null);

  // ─── Toast ────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ─── Fetch employees ──────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('joining')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });
    if (error) { addToast('Failed to load employees', 'error'); return []; }
    return data.map(emp => ({
      id: emp.id,
      rbp_joining_id: emp.rbp_joining_id || '',
      employee_name: emp.name_as_per_aadhar || '',
      father_name: emp.father_name || '',
      department: emp.department || 'Not Assigned',
      designation: emp.designation || '',
      joining_date: emp.date_of_joining || '',
      uan_number: emp.past_pf_id || '',
      esic_number: emp.past_esic_number || '',
      gross_salary: Number(emp.salary || 0),
      bank_account_number: emp.bank_account_number || '',
      ifsc_code: emp.ifsc_code || '',
      mobile_number: emp.mobile_number || '',
      official_email_id: emp.official_email_id || '',
      attendance_type: emp.attendance_type || 'Field',
      employee_category: emp.employee_category ? emp.employee_category.trim() : '',
    }));
  }, [addToast]);

  // ─── Fetch attendances ────────────────────────────────────────────
  const fetchAttendances = useCallback(async (empList, month, year) => {
    const mVal = Number(month);
    const yVal = Number(year);
    const monthNum = mVal + 1;
    const daysInMonth = new Date(yVal, monthNum, 0).getDate();
    const prefix = `${yVal}-${String(monthNum).padStart(2, '0')}`;

    const [{ data: bioLogs }, { data: attLogs }] = await Promise.all([
      supabase.from('offline_biometric_punch')
        .select('employee_id,employee_name,attendance_date,in_time,out_time')
        .gte('attendance_date', `${prefix}-01`)
        .lte('attendance_date', `${prefix}-${daysInMonth}`),
      supabase.from('attendance')
        .select('person_name,employee_code,date,status,approved_status')
        .gte('date', `${prefix}-01`)
        .lte('date', `${prefix}-${daysInMonth}`),
    ]);

    return empList.map(emp => {
      let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${prefix}-${String(d).padStart(2, '0')}`;
        const isSunday = new Date(yVal, mVal, d).getDay() === 0;
        let status = isSunday ? 'WO' : 'A';

        const manual = (attLogs || []).find(a =>
          (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
           a.employee_code === emp.rbp_joining_id) &&
          a.date === dayStr && a.approved_status === 'corrected'
        );
        if (manual) {
          status = (manual.status === 'P' || manual.status === 'IN') ? 'P' : 'A';
        } else {
          const leave = (attLogs || []).find(a =>
            (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
             a.employee_code === emp.rbp_joining_id) &&
            a.date === dayStr && a.status === 'CL'
          );
          if (leave) {
            status = 'CL';
          } else {
            const bio = (bioLogs || []).some(b =>
              (b.employee_id === emp.rbp_joining_id ||
               b.employee_name?.trim().toLowerCase() === emp.employee_name?.trim().toLowerCase()) &&
              b.attendance_date === dayStr &&
              (b.in_time || b.out_time)
            );
            if (bio) {
              status = 'P';
            } else {
              const field = (attLogs || []).some(a =>
                (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
                  a.employee_code === emp.rbp_joining_id) &&
                a.date === dayStr && a.status !== 'CL'
              );
              if (field) status = 'P';
            }
          }
        }

        if (status === 'P') presentDays++;
        else if (status === 'WO') weekOffCount++;
        else if (status === 'CL') paidLeaves++;
        else absentDays++;
      }

      return {
        employee_id: emp.id,
        working_days: daysInMonth - weekOffCount,
        present_days: presentDays,
        week_off: weekOffCount,
        paid_leave: paidLeaves,
        absent_days: absentDays,
      };
    });
  }, []);

  // ─── Load data ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const emps = await fetchEmployees();
      setEmployees(emps);
      if (emps.length) {
        const atts = await fetchAttendances(emps, filters.month, filters.year);
        setAttendances(atts);
      }
    } catch (err) {
      addToast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, fetchAttendances, filters.month, filters.year, addToast]);

  useEffect(() => { loadData(); }, [filters.month, filters.year]);

  // ─── Build enriched records ───────────────────────────────────────
  const allRecords = useMemo(() => {
    return employees.map((emp, idx) => {
      const att = attendances.find(a => a.employee_id === emp.id) || {
        working_days: 26, present_days: 0, week_off: 4, absent_days: 26
      };
      const recordId = `PR${String(idx + 1).padStart(4, '0')}`;
      const empEdits = edits[recordId] || {};
      const c = calcSalary(emp.gross_salary, att, empEdits, Number(filters.month), Number(filters.year));
      return {
        id: recordId,
        employee: emp,
        attendance: att,
        calc: c,
        edits: empEdits,
        payroll_status: 'Processed',
      };
    });
  }, [employees, attendances, edits, filters.month, filters.year]);

  // ─── Filtered records ─────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let list = [...allRecords];

    // Tab filter
    if (activeTab === 'biometric') {
      list = list.filter(r => 
        r.employee.employee_category === 'Office Staff'
      );
    } else if (activeTab === 'field') {
      list = list.filter(r => 
        r.employee.employee_category === 'Field Staff'
      );
    }

    // Card filter
    if (cardFilter === 'pf') list = list.filter(r => r.calc.epfDed > 0);
    else if (cardFilter === 'esic') list = list.filter(r => r.calc.esicDed > 0);
    else if (cardFilter === 'advance') list = list.filter(r => r.calc.advance > 0);

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => {
        const emp = r.employee;
        return (
          emp.employee_name?.toLowerCase().includes(q) ||
          emp.rbp_joining_id?.toLowerCase().includes(q) ||
          emp.uan_number?.toLowerCase().includes(q) ||
          emp.esic_number?.toLowerCase().includes(q)
        );
      });
    }

    if (filters.department !== 'All') list = list.filter(r => r.employee.department === filters.department);
    if (filters.designation !== 'All') list = list.filter(r => r.employee.designation === filters.designation);
    if (filters.payrollStatus !== 'All') list = list.filter(r => r.payroll_status === filters.payrollStatus);

    if (filters.pfEnabled === 'yes') list = list.filter(r => r.calc.epfDed > 0);
    else if (filters.pfEnabled === 'no') list = list.filter(r => r.calc.epfDed === 0);

    if (filters.esicEnabled === 'yes') list = list.filter(r => r.calc.esicDed > 0);
    else if (filters.esicEnabled === 'no') list = list.filter(r => r.calc.esicDed === 0);

    if (filters.hasAdvance === 'yes') list = list.filter(r => r.calc.advance > 0);
    else if (filters.hasAdvance === 'no') list = list.filter(r => r.calc.advance === 0);

    if (filters.minGross) list = list.filter(r => r.employee.gross_salary >= Number(filters.minGross));
    if (filters.maxGross) list = list.filter(r => r.employee.gross_salary <= Number(filters.maxGross));
    if (filters.minPresent) list = list.filter(r => (r.attendance?.present_days ?? 0) >= Number(filters.minPresent));

    return list;
  }, [allRecords, cardFilter, filters, activeTab]);

  // ─── Dashboard summary ────────────────────────────────────────────
  const summary = useMemo(() => ({
    totalEmployees: filteredRecords.length,
    totalGrossSalary: filteredRecords.reduce((s, r) => s + r.employee.gross_salary, 0),
    totalNetSalary: filteredRecords.reduce((s, r) => s + r.calc.netSalary, 0),
    totalPFAmount: filteredRecords.reduce((s, r) => s + r.calc.epfDed, 0),
    totalESICAmount: filteredRecords.reduce((s, r) => s + r.calc.esicDed, 0),
    totalAdvanceDeduction: filteredRecords.reduce((s, r) => s + r.calc.advance, 0),
    totalPayrollAmount: filteredRecords.reduce((s, r) => s + r.calc.totalPayable, 0),
    payrollMonth: `${MONTHS[filters.month]} ${filters.year}`,
    payrollStatus: 'Processed',
  }), [filteredRecords, filters.month, filters.year]);

  // ─── Paginated records ────────────────────────────────────────────
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  // ─── Card click handler ───────────────────────────────────────────
  const handleCardClick = (filterKey) => {
    setCardFilter(prev => prev === filterKey ? 'all' : filterKey);
    setCurrentPage(1);
  };

  // ─── Filter change with debounced search ──────────────────────────
  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setFilters(prev => ({ ...prev, search: value }));
        setCurrentPage(1);
      }, 300);
      return;
    }
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTERS);
    setCardFilter('all');
    setCurrentPage(1);
    addToast('All filters cleared');
  };

  // ─── Save edits ───────────────────────────────────────────────────
  const handleSaveEdit = (recordId, newEdits) => {
    setEdits(prev => ({ ...prev, [recordId]: newEdits }));
    setEditRecord(null);
    addToast('Payroll record updated successfully');
  };

  // ─── Export to Excel ──────────────────────────────────────────────
  const handleExcelExport = () => {
    const data = filteredRecords.map((r, i) => ({
      'SL': i + 1,
      'EMP CODE': r.employee.rbp_joining_id,
      'NAME': r.employee.employee_name,
      'DESIGNATION': r.employee.designation,
      'DEPARTMENT': r.employee.department,
      'PRESENT': r.attendance?.present_days ?? 0,
      'WORKING DAYS': r.attendance?.working_days ?? 0,
      'GROSS (Real)': r.employee.gross_salary,
      'BASIC+DA (Real)': r.calc.basicReal,
      'HRA (Real)': r.calc.hraReal,
      'GROSS EARNED': r.calc.grossEarned,
      'OT': r.calc.otAmount,
      'EPF 12%': r.calc.epfDed,
      'ESIC 0.75%': r.calc.esicDed,
      'ADVANCE': r.calc.advance,
      'SECURITY DEP': r.calc.securityDep,
      'OTHER DED': r.calc.otherDed,
      'TOTAL DED': r.calc.totalDed,
      'REIMBURSEMENT': r.calc.reimbursement,
      'SALARY ARREARS': r.calc.salaryArrears,
      'NET SALARY': r.calc.netSalary,
      'TA DA': r.calc.taDA,
      'TOTAL PAYABLE': r.calc.totalPayable,
      'EMPLOYER EPF 13%': r.calc.employerEPF,
      'EMPLOYER ESIC 3.25%': r.calc.employerESIC,
      'CTC': r.calc.ctc,
      'REMARK': r.calc.remark,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Payroll_${MONTHS[filters.month]}_${filters.year}`);
    XLSX.writeFile(wb, `payroll_${filters.year}_${filters.month + 1}.xlsx`);
    addToast('Exported to Excel successfully');
  };

  const handlePdfExport = () => addToast('PDF export coming soon', 'warning');
  const handleDownloadPayslips = () => addToast('Bulk payslip download coming soon', 'warning');

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <Toast toasts={toasts} />

      <div className="p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
              Payroll Processing
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {MONTHS[filters.month]} {filters.year} &nbsp;·&nbsp; {filteredRecords.length} employees
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-3 py-1">
          {[
            { id: 'all', label: 'All Payroll', icon: '📋' },
            { id: 'biometric', label: 'Biometric Payroll', icon: '👆' },
            { id: 'field', label: 'Filed Payroll', icon: '📍' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2 ring-offset-slate-50'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Dashboard Cards ── */}
        <PayrollCards
          summary={summary}
          activeCardFilter={cardFilter}
          onCardClick={handleCardClick}
        />

        {/* ── Filters ── */}
        <PayrollFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          onExcelExport={handleExcelExport}
          onPdfExport={handlePdfExport}
          onDownloadPayslip={handleDownloadPayslips}
        />

        {/* ── Table ── */}
        <PayrollTable
          records={paginatedRecords}
          loading={loading}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalCount={filteredRecords.length}
          onPageChange={setCurrentPage}
          onRowsChange={setRowsPerPage}
          onView={(r) => setPayslipRecord(r)}
          onEdit={(r) => setEditRecord(r)}
          onDownloadPayslip={(r) => { setPayslipRecord(r); addToast('Opening payslip...'); }}
          onPrint={(r) => { setPayslipRecord(r); setTimeout(() => window.print(), 300); }}
          onViewEmployee={(r) => addToast(`Viewing ${r.employee?.employee_name}`, 'success')}
        />
      </div>

      {/* ── Edit Modal ── */}
      {editRecord && (
        <PayrollEditModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ── Payslip Modal ── */}
      {payslipRecord && (
        <PayslipModal
          record={payslipRecord}
          selectedMonth={filters.month}
          selectedYear={filters.year}
          onClose={() => setPayslipRecord(null)}
        />
      )}
    </div>
  );
}