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
  // ─── Main navigation tab ──────────────────────────────────────────
  const [mainTab, setMainTab] = useState('processing'); // 'processing' | 'history'

  // ─── Core processing data ─────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);

  // ─── Filters & Tab selections ──────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [cardFilter, setCardFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const searchTimer = useRef(null);

  // ─── Modals ───────────────────────────────────────────────────────
  const [editRecord, setEditRecord] = useState(null);
  const [payslipRecord, setPayslipRecord] = useState(null);

  // ─── History-specific states ──────────────────────────────────────
  const [historyLogs, setHistoryLogs] = useState([]);
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Toast notifications ──────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ─── Check finalization status ────────────────────────────────────
  const checkIfFinalized = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_finalization_log')
        .select('*')
        .eq('month', Number(filters.month) + 1)
        .eq('year', Number(filters.year));
      
      if (error) {
        setIsFinalized(false);
        return;
      }
      setIsFinalized(data && data.length > 0);
    } catch (err) {
      setIsFinalized(false);
    }
  }, [filters.month, filters.year]);

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

  // ─── Fetch attendances (optimized O(1) lookups) ────────────────────
  const fetchAttendances = useCallback(async (empList, month, year) => {
    const mVal = Number(month);
    const yVal = Number(year);
    const monthNum = mVal + 1;
    const daysInMonth = new Date(yVal, monthNum, 0).getDate();
    const prefix = `${yVal}-${String(monthNum).padStart(2, '0')}`;

    // 1. First check if finalized attendance exists in final_attendance
    try {
      const { data: finalAtt, error: finalAttErr } = await supabase
        .from('final_attendance')
        .select('employee_id,attendance_date,status')
        .eq('month', monthNum)
        .eq('year', yVal);

      if (!finalAttErr && finalAtt && finalAtt.length > 0) {
        // Group by employee_id
        const empAttMap = {};
        finalAtt.forEach(row => {
          if (!empAttMap[row.employee_id]) {
            empAttMap[row.employee_id] = [];
          }
          empAttMap[row.employee_id].push(row.status);
        });

        return empList.map(emp => {
          const statuses = empAttMap[emp.id] || [];
          let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0, holidayCount = 0;

          statuses.forEach(status => {
            if (status === 'P') {
              presentDays++;
            } else if (status === 'HD') {
              presentDays += 0.5;
              absentDays += 0.5;
            } else if (status === 'WO') {
              weekOffCount++;
            } else if (status === 'CL' || status === 'EL') {
              paidLeaves++;
            } else if (status === 'H') {
              holidayCount++;
            } else {
              absentDays++;
            }
          });

          return {
            employee_id: emp.id,
            working_days: daysInMonth - weekOffCount - holidayCount,
            present_days: presentDays,
            week_off: weekOffCount,
            paid_leave: paidLeaves,
            holidays: holidayCount,
            absent_days: absentDays,
          };
        });
      }
    } catch (err) {
      console.warn("Error fetching from final_attendance, falling back to live calculation", err);
    }

    let bioLogs = [], attLogs = [], holidayLogs = [];
    try {
      const [{ data: bioData, error: bioErr }, { data: attData, error: attErr }] = await Promise.all([
        supabase.from('offline_biometric_punch')
          .select('employee_id,employee_name,attendance_date,in_time,out_time')
          .gte('attendance_date', `${prefix}-01`)
          .lte('attendance_date', `${prefix}-${daysInMonth}`),
        supabase.from('attendance')
          .select('person_name,employee_code,date,status,approved_status')
          .gte('date', `${prefix}-01`)
          .lte('date', `${prefix}-${daysInMonth}`),
      ]);
      if (!bioErr) bioLogs = bioData || [];
      if (!attErr) attLogs = attData || [];
    } catch (err) {
      console.error("Error fetching attendance/biometric logs", err);
    }

    try {
      const { data, error } = await supabase.from('holiday_master')
        .select('holiday_date,holiday_name')
        .gte('holiday_date', `${prefix}-01`)
        .lte('holiday_date', `${prefix}-${daysInMonth}`);
      if (!error) holidayLogs = data || [];
    } catch (err) {
      console.warn("holiday_master fetch error", err);
    }

    // Create O(1) indexes
    const bioMap = {};
    bioLogs.forEach(b => {
      const codeKey = b.employee_id ? `${b.employee_id.trim().toLowerCase()}_${b.attendance_date}` : null;
      const nameKey = b.employee_name ? `${b.employee_name.trim().toLowerCase()}_${b.attendance_date}` : null;
      const hasPunch = b.in_time || b.out_time;
      if (hasPunch) {
        const punchObj = { in_time: b.in_time, out_time: b.out_time };
        if (codeKey) bioMap[codeKey] = punchObj;
        if (nameKey) bioMap[nameKey] = punchObj;
      }
    });

    const manualMap = {};
    const leaveMap = {};
    const fieldMap = {};
    attLogs.forEach(a => {
      const nameKey = a.person_name ? `${a.person_name.trim().toLowerCase()}_${a.date}` : null;
      const codeKey = a.employee_code ? `${a.employee_code.trim().toLowerCase()}_${a.date}` : null;
      
      if (a.approved_status === 'corrected') {
        if (nameKey) manualMap[nameKey] = a.status;
        if (codeKey) manualMap[codeKey] = a.status;
      } else if (a.status === 'CL') {
        if (nameKey) leaveMap[nameKey] = 'CL';
        if (codeKey) leaveMap[codeKey] = 'CL';
      } else {
        if (nameKey) fieldMap[nameKey] = true;
        if (codeKey) fieldMap[codeKey] = true;
      }
    });

    const holidayMap = {};
    holidayLogs.forEach(h => {
      if (h.holiday_date) {
        holidayMap[h.holiday_date] = h.holiday_name;
      }
    });

    return empList.map(emp => {
      const empNameClean = emp.employee_name?.trim().toLowerCase();
      const empCodeClean = emp.rbp_joining_id?.trim().toLowerCase();

      let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0, holidayCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${prefix}-${String(d).padStart(2, '0')}`;
        const isSunday = new Date(yVal, mVal, d).getDay() === 0;
        const isHoliday = holidayMap[dayStr];
        let status = isSunday ? 'WO' : (isHoliday ? 'H' : 'A');

        const nameKey = empNameClean ? `${empNameClean}_${dayStr}` : '';
        const codeKey = empCodeClean ? `${empCodeClean}_${dayStr}` : '';

        const manualStatus = (nameKey && manualMap[nameKey]) || (codeKey && manualMap[codeKey]);
        if (manualStatus) {
          status = manualStatus;
        } else {
          const leaveStatus = (nameKey && leaveMap[nameKey]) || (codeKey && leaveMap[codeKey]);
          if (leaveStatus) {
            status = 'CL';
          } else {
            const bioEntry = (codeKey && bioMap[codeKey]) || (nameKey && bioMap[nameKey]);
            if (bioEntry) {
              if (bioEntry.in_time && bioEntry.out_time) {
                status = 'P';
              } else {
                status = 'HD';
              }
            } else {
              const hasField = (nameKey && fieldMap[nameKey]) || (codeKey && fieldMap[codeKey]);
              if (hasField) status = 'P';
            }
          }
        }

        if (status === 'P') {
          presentDays++;
        } else if (status === 'HD') {
          presentDays += 0.5;
          absentDays += 0.5;
        } else if (status === 'WO') {
          weekOffCount++;
        } else if (status === 'CL' || status === 'EL') {
          paidLeaves++;
        } else if (status === 'H') {
          holidayCount++;
        } else {
          absentDays++;
        }
      }

      return {
        employee_id: emp.id,
        working_days: daysInMonth - weekOffCount - holidayCount,
        present_days: presentDays,
        week_off: weekOffCount,
        paid_leave: paidLeaves,
        holidays: holidayCount,
        absent_days: absentDays,
      };
    });
  }, []);

  // ─── Load live processing data ────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const emps = await fetchEmployees();
      setEmployees(emps);
      if (emps.length) {
        const atts = await fetchAttendances(emps, filters.month, filters.year);
        setAttendances(atts);
      }
      await checkIfFinalized();
    } catch (err) {
      addToast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, fetchAttendances, filters.month, filters.year, checkIfFinalized, addToast]);

  useEffect(() => {
    if (mainTab === 'processing') {
      loadData();
    }
  }, [filters.month, filters.year, mainTab]);

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

  // ─── Filtered live records ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    let list = [...allRecords];

    // Tab filter
    if (activeTab === 'biometric') {
      list = list.filter(r => r.employee.employee_category === 'Office Staff');
    } else if (activeTab === 'field') {
      list = list.filter(r => r.employee.employee_category === 'Field Staff');
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

  // ─── Card click handler ───────────────────────────────────────────
  const handleCardClick = (filterKey) => {
    setCardFilter(prev => prev === filterKey ? 'all' : filterKey);
  };

  // ─── Filter change with debounced search ──────────────────────────
  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setFilters(prev => ({ ...prev, search: value }));
      }, 300);
      return;
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTERS);
    setCardFilter('all');
    addToast('All filters cleared');
  };

  // ─── Save live edits ──────────────────────────────────────────────
  const handleSaveEdit = (recordId, newEdits) => {
    setEdits(prev => ({ ...prev, [recordId]: newEdits }));
    setEditRecord(null);
    addToast('Payroll record updated successfully');
  };

  // ─── Submit & Finalize Month ──────────────────────────────────────
  const handleFinalizePayroll = async () => {
    const monthName = MONTHS[filters.month];
    const yearVal = filters.year;

    const confirmFinalize = window.confirm(
      `Are you sure you want to finalize and lock the payroll for ${monthName} ${yearVal}? This will save all current calculations to the payroll history.`
    );
    if (!confirmFinalize) return;

    try {
      // 1. Fetch current user
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'HR Admin';

      // 2. Insert log row
      const { error: logError } = await supabase
        .from('payroll_finalization_log')
        .insert({
          month: Number(filters.month) + 1,
          year: Number(filters.year),
          company: 'RBP FMS',
          finalized_by: userName
        });

      if (logError) {
        if (logError.message.includes('relation') || logError.code === '42P01') {
          addToast('Database tables not found. Please create the required SQL tables first!', 'error');
          return;
        }
        throw logError;
      }

      // 3. Write rows to payroll_history
      const historyRows = filteredRecords.map(r => ({
        employee_id: r.employee.id,
        employee_name: r.employee.employee_name,
        employee_code: r.employee.rbp_joining_id,
        month: Number(filters.month) + 1,
        year: Number(filters.year),
        gross_salary: r.employee.gross_salary,
        basic_earned: r.calc.basicEarned,
        hra_earned: r.calc.hraEarned,
        conv_earned: r.calc.convEarned,
        med_earned: r.calc.medEarned,
        special_earned: r.calc.specialEarned,
        gross_earned: r.calc.grossEarned,
        ot_amount: r.calc.otAmount,
        epf_ded: r.calc.epfDed,
        esic_ded: r.calc.esicDed,
        advance: r.calc.advance,
        security_dep: r.calc.securityDep,
        other_ded: r.calc.otherDed,
        total_ded: r.calc.totalDed,
        reimbursement: r.calc.reimbursement,
        salary_arrears: r.calc.salaryArrears,
        net_salary: r.calc.netSalary,
        ta_da: r.calc.taDA,
        total_payable: r.calc.totalPayable,
        employer_epf: r.calc.employerEPF,
        employer_esic: r.calc.employerESIC,
        ctc: r.calc.ctc,
        remark: r.calc.remark || ''
      }));

      const { error: historyError } = await supabase
        .from('payroll_history')
        .upsert(historyRows, { onConflict: 'employee_id,month,year' });

      if (historyError) throw historyError;

      addToast(`Payroll for ${monthName} ${yearVal} finalized and locked successfully!`, 'success');
      await checkIfFinalized();
    } catch (err) {
      console.error(err);
      addToast('Error saving payroll to history: ' + err.message, 'error');
    }
  };

  // ─── Export live table to Excel ──────────────────────────────────
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

  // ─── Export History Month to Excel ───────────────────────────────
  const handleHistoryExcelExport = () => {
    if (!selectedHistoryLog) return;
    const data = filteredHistoryRecords.map((r, i) => ({
      'SL': i + 1,
      'EMP CODE': r.employee.rbp_joining_id,
      'NAME': r.employee.employee_name,
      'GROSS': r.calc.grossReal,
      'BASIC EARNED': r.calc.basicEarned,
      'HRA EARNED': r.calc.hraEarned,
      'CONVEYANCE EARNED': r.calc.convEarned,
      'MEDICAL EARNED': r.calc.medEarned,
      'SPECIAL EARNED': r.calc.specialEarned,
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
    XLSX.utils.book_append_sheet(wb, ws, `Finalized_${MONTHS[selectedHistoryLog.month - 1]}_${selectedHistoryLog.year}`);
    XLSX.writeFile(wb, `finalized_payroll_${selectedHistoryLog.year}_${selectedHistoryLog.month}.xlsx`);
    addToast('History exported to Excel successfully');
  };

  // ─── Fetch history entries list ───────────────────────────────────
  const fetchHistoryLogs = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payroll_finalization_log')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          setHistoryLogs([]);
          return;
        }
        throw error;
      }
      setHistoryLogs(data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load history logs: ' + err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  // ─── Load history month records ───────────────────────────────────
  const loadHistoryMonth = async (log) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payroll_history')
        .select('*')
        .eq('month', log.month)
        .eq('year', log.year);
      if (error) throw error;

      const mapped = (data || []).map((row, idx) => ({
        id: row.id,
        employee: {
          id: row.employee_id,
          rbp_joining_id: row.employee_code,
          employee_name: row.employee_name,
          gross_salary: Number(row.gross_salary),
          department: 'N/A',
          designation: 'N/A'
        },
        attendance: {
          present_days: 0,
          working_days: 0,
        },
        calc: {
          basicReal: 0, hraReal: 0, convReal: 0, medReal: 0, specialReal: 0, grossReal: row.gross_salary,
          basicEarned: Number(row.basic_earned),
          hraEarned: Number(row.hra_earned),
          convEarned: Number(row.conv_earned),
          medEarned: Number(row.med_earned),
          specialEarned: Number(row.special_earned),
          grossEarned: Number(row.gross_earned),
          otAmount: Number(row.ot_amount),
          epfDed: Number(row.epf_ded),
          esicDed: Number(row.esic_ded),
          advance: Number(row.advance),
          securityDep: Number(row.security_dep),
          otherDed: Number(row.other_ded),
          totalDed: Number(row.total_ded),
          reimbursement: Number(row.reimbursement),
          salaryArrears: Number(row.salary_arrears),
          netSalary: Number(row.net_salary),
          taDA: Number(row.ta_da),
          totalPayable: Number(row.total_payable),
          employerEPF: Number(row.employer_epf),
          employerESIC: Number(row.employer_esic),
          ctc: Number(row.ctc),
          remark: row.remark || ''
        }
      }));
      setHistoryRecords(mapped);
      setSelectedHistoryLog(log);
    } catch (err) {
      addToast('Failed to load history month records: ' + err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'history') {
      fetchHistoryLogs();
    }
  }, [mainTab, fetchHistoryLogs]);

  // ─── Filtered history rows list ───────────────────────────────────
  const filteredHistoryRecords = useMemo(() => {
    if (!historySearch) return historyRecords;
    const q = historySearch.toLowerCase();
    return historyRecords.filter(r => 
      r.employee.employee_name?.toLowerCase().includes(q) ||
      r.employee.rbp_joining_id?.toLowerCase().includes(q)
    );
  }, [historyRecords, historySearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <Toast toasts={toasts} />

      <div className="p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* ── Main Top Tab Bar ── */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur border border-white/60 p-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMainTab('processing'); setSelectedHistoryLog(null); }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                mainTab === 'processing'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              ⚙️ Process Current Payroll
            </button>
            <button
              onClick={() => setMainTab('history')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                mainTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📅 Finalized Payroll History
            </button>
          </div>

          {mainTab === 'processing' && (
            <div className="flex items-center gap-3">
              {isFinalized ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Finalized & Locked
                </span>
              ) : (
                <button
                  onClick={handleFinalizePayroll}
                  disabled={loading || filteredRecords.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 transition-all duration-150 disabled:opacity-50"
                >
                  🔒 Lock & Finalize Month
                </button>
              )}
            </div>
          )}
        </div>

        {mainTab === 'processing' ? (
          /* ── PROCESSING VIEW ── */
          <>
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
                  Payroll Processing
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {MONTHS[filters.month]} {filters.year} &nbsp;·&nbsp; {filteredRecords.length} Employees
                </p>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-3 py-1">
              {[
                { id: 'all', label: 'All Payroll', icon: '📋' },
                { id: 'biometric', label: 'Biometric Payroll', icon: '👆' },
                { id: 'field', label: 'Field Payroll', icon: '📍' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base leading-none">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dashboard Cards */}
            <PayrollCards
              summary={summary}
              activeCardFilter={cardFilter}
              onCardClick={handleCardClick}
            />

            {/* Filters bar */}
            <PayrollFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              onExcelExport={handleExcelExport}
            />

            {/* Main Table */}
            <PayrollTable
              records={filteredRecords}
              loading={loading}
              onView={(r) => setPayslipRecord(r)}
              onEdit={isFinalized ? null : (r) => setEditRecord(r)}
              onDownloadPayslip={(r) => { setPayslipRecord(r); addToast('Opening payslip...'); }}
              onPrint={(r) => { setPayslipRecord(r); setTimeout(() => window.print(), 300); }}
              onViewEmployee={(r) => addToast(`Employee ID: ${r.employee?.rbp_joining_id}`, 'success')}
            />
          </>
        ) : (
          /* ── HISTORY VIEW ── */
          <>
            {selectedHistoryLog === null ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Finalized Payroll History Log</h2>
                  <p className="text-gray-500 text-sm">Select any previously finalized month to view records and generate sheets.</p>
                </div>

                {loadingHistory ? (
                  <div className="py-20 text-center text-gray-500 font-semibold">Loading finalized log entries...</div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-gray-400 text-sm">No payroll months have been finalized yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Please finalize a month in the "Process Current Payroll" tab to record it here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">SL</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Month</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Year</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Company/Scope</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Finalized By</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Submitted At</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyLogs.map((log, idx) => (
                          <tr key={log.id || idx} className="border-b border-gray-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-700">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-indigo-700">{MONTHS[log.month - 1]}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{log.year}</td>
                            <td className="px-4 py-3 text-gray-600">{log.company}</td>
                            <td className="px-4 py-3 text-gray-600">{log.finalized_by || 'HR Admin'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {log.submitted_at ? new Date(log.submitted_at).toLocaleString('en-IN') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => loadHistoryMonth(log)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors"
                              >
                                View Records 🔍
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Selected History Month Records Grid */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedHistoryLog(null); setHistoryRecords([]); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      ⬅️ Back to Logs
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Finalized Payroll: {MONTHS[selectedHistoryLog.month - 1]} {selectedHistoryLog.year}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Locked & Archived · {filteredHistoryRecords.length} records found
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleHistoryExcelExport}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-xl shadow-sm transition-colors"
                    >
                      📥 Export Month Excel
                    </button>
                  </div>
                </div>

                {/* Local search bar for history records */}
                <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm max-w-sm">
                  <input
                    type="text"
                    placeholder="Search by Employee Name or Code..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {loadingHistory ? (
                  <div className="py-20 text-center text-gray-500 font-semibold">Loading finalized records...</div>
                ) : (
                  <PayrollTable
                    records={filteredHistoryRecords}
                    loading={false}
                    onView={(r) => setPayslipRecord(r)}
                    onEdit={null} // Read-only history
                    onDownloadPayslip={(r) => { setPayslipRecord(r); addToast('Opening payslip...'); }}
                    onPrint={(r) => { setPayslipRecord(r); setTimeout(() => window.print(), 300); }}
                    onViewEmployee={(r) => addToast(`Employee ID: ${r.employee?.rbp_joining_id}`, 'success')}
                  />
                )}
              </div>
            )}
          </>
        )}
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
          selectedMonth={selectedHistoryLog ? selectedHistoryLog.month - 1 : filters.month}
          selectedYear={selectedHistoryLog ? selectedHistoryLog.year : filters.year}
          onClose={() => setPayslipRecord(null)}
        />
      )}
    </div>
  );
}

