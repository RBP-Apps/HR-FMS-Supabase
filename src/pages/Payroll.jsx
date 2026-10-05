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
import { parseTimeToMinutes, isLateApproved } from '../utils/attendanceHelpers';

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
  company: 'All',
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

  const getStorageKey = useCallback((y, m) => `payroll_edits_${y}_${m}`, []);

  // ─── Core processing data ─────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [edits, setEdits] = useState(() => {
    try {
      const key = `payroll_edits_${DEFAULT_FILTERS.year}_${DEFAULT_FILTERS.month}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);

  // ─── Filters & Tab selections ──────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Sync edits from localStorage when month/year changes
  useEffect(() => {
    try {
      const key = getStorageKey(filters.year, filters.month);
      const saved = localStorage.getItem(key);
      setEdits(saved ? JSON.parse(saved) : {});
    } catch (err) {
      console.warn('Failed to load edits from localStorage:', err);
    }
  }, [filters.month, filters.year, getStorageKey]);
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
      company: emp.firm_name || 'N/A',
      department: emp.department || 'Not Assigned',
      designation: emp.designation || '',
      joining_date: emp.date_of_joining || '',
      leaving_date: emp.leaving_date || '',
      uan_number: emp.past_pf_id || '',
      esic_number: emp.past_esic_number || '',
      gross_salary: Number(emp.salary || 0),
      bank_account_number: emp.bank_account_number || '',
      ifsc_code: emp.ifsc_code || '',
      mobile_number: emp.mobile_number || '',
      official_email_id: emp.official_email_id || '',
      attendance_type: emp.attendance_type || 'Field',
      employee_category: emp.employee_category ? emp.employee_category.trim() : '',
      company_pf_provided: (emp.company_pf_provided === true || emp.company_pf_provided === 'Yes' || emp.company_pf_provided === 'TRUE' || emp.company_pf_provided === 'true') ? 'Yes' : 'No',
      company_esic_provided: (emp.company_esic_provided === true || emp.company_esic_provided === 'Yes' || emp.company_esic_provided === 'TRUE' || emp.company_esic_provided === 'true') ? 'Yes' : 'No',
    }));
  }, [addToast]);

  // ─── Fetch attendances (optimized O(1) lookups aligned with Attendance Management) ───
  const fetchAttendances = useCallback(async (empList, month, year) => {
    const mVal = Number(month);
    const yVal = Number(year);
    const monthNum = mVal + 1;
    const daysInMonth = new Date(yVal, monthNum, 0).getDate();
    const prefix = `${yVal}-${String(monthNum).padStart(2, '0')}`;

    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const str = String(timeStr).trim().toUpperCase();
      const isPM = str.includes("PM");
      const isAM = str.includes("AM");
      const cleanStr = str.replace(/(AM|PM|\s)/g, "");
      const parts = cleanStr.split(":");
      if (parts.length < 2) return null;
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return null;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    // 1. First check if attendance is finalized in attendance_finalization_log
    try {
      const { data: finLog, error: logErr } = await supabase
        .from('attendance_finalization_log')
        .select('*')
        .eq('month', monthNum)
        .eq('year', yVal);

      if (!logErr && finLog && finLog.length > 0) {
        const { data: finalAtt, error: finalAttErr } = await supabase
          .from('final_attendance')
          .select('employee_id,attendance_date,status,in_time')
          .eq('month', monthNum)
          .eq('year', yVal);

        if (!finalAttErr && finalAtt && finalAtt.length > 0) {
          const empAttMap = {};
          finalAtt.forEach(row => {
            if (!row.employee_id) return;
            const k = String(row.employee_id).trim().toLowerCase();
            if (!empAttMap[k]) empAttMap[k] = [];
            let st = row.status;
            if (row.attendance_date) {
              const dDate = new Date(row.attendance_date);
              if (dDate.getDay() === 0 && st === 'A') st = 'WO';
            }
            empAttMap[k].push({ status: st, in_time: row.in_time });
          });

          return empList.map(emp => {
            const empIdKey = emp.id ? String(emp.id).trim().toLowerCase() : '';
            const empCodeKey = emp.rbp_joining_id ? String(emp.rbp_joining_id).trim().toLowerCase() : '';
            const empNameKey = emp.employee_name ? String(emp.employee_name).trim().toLowerCase() : '';

            const records = empAttMap[empIdKey] || empAttMap[empCodeKey] || empAttMap[empNameKey] || [];
            let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0, holidayCount = 0;
            let lateCycleCount = 0, lateDaysCount = 0;

            records.forEach(item => {
              const status = item.status;
              if (status === 'P') presentDays++;
              else if (status === 'HD') { presentDays += 0.5; absentDays += 0.5; }
              else if (status === 'WO') weekOffCount++;
              else if (status === 'CL') paidLeaves++;
              else if (status === 'H') holidayCount++;
              else absentDays++;

              if (item.in_time && !['A', 'WO', 'H', 'CL', 'LWP'].includes(status)) {
                const inMins = parseTimeToMinutes(item.in_time);
                if (inMins !== null && inMins >= 586 && inMins <= 750) {
                  lateCycleCount++;
                  if (lateCycleCount === 4) {
                    lateCycleCount = 0;
                  } else {
                    lateDaysCount++;
                  }
                }
              }
            });

            const paidDaysTotal = presentDays + weekOffCount + paidLeaves + holidayCount;

            return {
              employee_id: emp.id,
              working_days: daysInMonth,
              present_days: paidDaysTotal,
              week_off: weekOffCount,
              paid_leave: paidLeaves,
              holidays: holidayCount,
              absent_days: absentDays,
              late_days: lateDaysCount,
            };
          });
        }
      }
    } catch (err) {
      console.warn("Error checking attendance_finalization_log", err);
    }

    // 2. Live calculation if not finalized
    let bioLogs = [], attLogs = [], holidayLogs = [];
    try {
      // Paginated fetch for offline_biometric_punch (Supabase truncates at 1000 without range pagination)
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;
      const startDate = `${prefix}-01`;
      const endDate = `${prefix}-${daysInMonth}`;

      while (hasMore) {
        const { data, error } = await supabase
          .from('offline_biometric_punch')
          .select('employee_id,employee_name,attendance_date,in_time,out_time')
          .gte('attendance_date', startDate)
          .lte('attendance_date', endDate)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
          console.error("Error fetching biometric logs page", page, error);
          break;
        }

        if (data && data.length > 0) {
          bioLogs = [...bioLogs, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      let attPage = 0;
      const ATT_PAGE_SIZE = 1000;
      let hasMoreAtt = true;

      while (hasMoreAtt) {
        const { data: attData, error: attErr } = await supabase
          .from('attendance')
          .select('person_name,employee_code,date,status,approved_status,time')
          .gte('date', startDate)
          .lte('date', endDate)
          .range(attPage * ATT_PAGE_SIZE, (attPage + 1) * ATT_PAGE_SIZE - 1);

        if (attErr) {
          console.error("Error fetching attendance logs page", attPage, attErr);
          break;
        }

        if (attData && attData.length > 0) {
          attLogs = [...attLogs, ...attData];
          if (attData.length < ATT_PAGE_SIZE) {
            hasMoreAtt = false;
          } else {
            attPage++;
          }
        } else {
          hasMoreAtt = false;
        }
      }
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

    let lateApprovalLogs = [];
    try {
      const { data, error } = await supabase.from('late_attendance_approval').select('*');
      if (!error) lateApprovalLogs = data || [];
    } catch (err) {
      console.warn("late_attendance_approval fetch error", err);
    }

    // Process biometric punches exactly like useAttendanceData.js
    const bioGrouped = {};
    bioLogs.forEach(b => {
      if (!b.attendance_date) return;
      const attDate = String(b.attendance_date).split('T')[0].split(' ')[0];
      const empId = b.employee_id ? String(b.employee_id).trim().toUpperCase() : '';
      const empName = b.employee_name ? String(b.employee_name).trim().toUpperCase() : '';

      const keys = [];
      if (empId) keys.push(`${empId}_${attDate}`);
      if (empName) keys.push(`${empName}_${attDate}`);

      keys.forEach(key => {
        if (!bioGrouped[key]) {
          bioGrouped[key] = { inTimes: [], outTimes: [] };
        }
        if (b.in_time) bioGrouped[key].inTimes.push(b.in_time);
        if (b.out_time) bioGrouped[key].outTimes.push(b.out_time);
      });
    });

    const bioMap = {};
    Object.keys(bioGrouped).forEach(key => {
      const g = bioGrouped[key];
      const allTimes = [];
      g.inTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });
      g.outTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });
      allTimes.sort((a, b) => a.localeCompare(b));

      let finalIn = null, finalOut = null;
      if (allTimes.length === 1) {
        if (g.inTimes.length > 0) finalIn = g.inTimes[0];
        else if (g.outTimes.length > 0) finalOut = g.outTimes[0];
        else finalIn = allTimes[0];
      } else if (allTimes.length > 1) {
        finalIn = allTimes[0];
        finalOut = allTimes[allTimes.length - 1];
      }

      bioMap[key.toLowerCase()] = { finalIn, finalOut };
    });

    const manualMap = {};
    const leaveMap = {};
    const fieldMap = {};
    attLogs.forEach(a => {
      if (!a.date) return;
      const nameKey = a.person_name ? `${String(a.person_name).trim().toLowerCase()}_${a.date}` : null;
      const codeKey = a.employee_code ? `${String(a.employee_code).trim().toLowerCase()}_${a.date}` : null;

      [nameKey, codeKey].forEach(key => {
        if (!key) return;
        if (a.approved_status === 'corrected') {
          manualMap[key] = a.status;
        } else if (a.status === 'CL') {
          leaveMap[key] = 'CL';
        } else {
          if (!fieldMap[key]) {
            fieldMap[key] = { inTime: null, outTime: null, status: null };
          }
          const t = a.time || a.in_time;
          if (a.status === 'IN') {
            fieldMap[key].inTime = t;
            if (!fieldMap[key].status) fieldMap[key].status = 'P';
          } else if (a.status === 'OUT') {
            fieldMap[key].outTime = t;
          } else if (a.status === 'P') {
            fieldMap[key].status = 'P';
            if (t && !fieldMap[key].inTime) fieldMap[key].inTime = t;
          } else if (a.status === 'HD') {
            fieldMap[key].status = 'HD';
            if (t && !fieldMap[key].inTime) fieldMap[key].inTime = t;
          }
        }
      });
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

      const doj = emp.joining_date ? new Date(emp.joining_date) : null;
      const dol = emp.leaving_date ? new Date(emp.leaving_date) : null;

      const isOfficeStaff = emp.employee_category?.trim() === 'Office Staff';

      let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0, holidayCount = 0;
      let lateCycleCount = 0, lateDaysCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${prefix}-${String(d).padStart(2, '0')}`;
        const dayDate = new Date(yVal, mVal, d);

        const compareDate = new Date(dayDate);
        compareDate.setHours(0, 0, 0, 0);
        if ((doj && compareDate < new Date(doj).setHours(0, 0, 0, 0)) ||
            (dol && compareDate > new Date(dol).setHours(0, 0, 0, 0))) {
          continue;
        }

        const isSunday = dayDate.getDay() === 0;
        const isHoliday = holidayMap[dayStr];
        let status = isSunday ? 'WO' : (isHoliday ? 'H' : 'A');

        const nameKey = empNameClean ? `${empNameClean}_${dayStr}` : '';
        const codeKey = empCodeClean ? `${empCodeClean}_${dayStr}` : '';

        const manualStatus = (codeKey && manualMap[codeKey]) || (nameKey && manualMap[nameKey]);
        let checkInTime = null;

        if (manualStatus) {
          status = manualStatus;
        } else {
          const leaveStatus = (codeKey && leaveMap[codeKey]) || (nameKey && leaveMap[nameKey]);
          if (leaveStatus) {
            status = 'CL';
          } else if (isOfficeStaff) {
            const bioEntry = (codeKey && bioMap[codeKey]) || (nameKey && bioMap[nameKey]);
            if (bioEntry && (bioEntry.finalIn || bioEntry.finalOut)) {
              checkInTime = bioEntry.finalIn;
              if (bioEntry.finalIn && bioEntry.finalOut) {
                const outMins = parseTimeToMinutes(bioEntry.finalOut);
                if (outMins !== null && outMins < 960) {
                  status = 'HD';
                } else {
                  status = 'P';
                }
              } else {
                status = 'HD';
              }
            }
          } else {
            const fieldRec = (codeKey && fieldMap[codeKey]) || (nameKey && fieldMap[nameKey]);
            if (fieldRec) {
              checkInTime = fieldRec.inTime;
              if (fieldRec.inTime && fieldRec.outTime) {
                const outMins = parseTimeToMinutes(fieldRec.outTime);
                if (outMins !== null && outMins < 960) {
                  status = 'HD';
                } else {
                  status = 'P';
                }
              } else if (fieldRec.inTime || fieldRec.outTime) {
                status = 'HD';
              } else if (fieldRec.status === 'P') {
                status = 'P';
              } else if (fieldRec.status === 'HD') {
                status = 'HD';
              }
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
        } else if (status === 'CL') {
          paidLeaves++;
        } else if (status === 'H') {
          holidayCount++;
        } else {
          absentDays++;
        }

        if (checkInTime && !['A', 'WO', 'H', 'CL', 'LWP'].includes(status)) {
          const inMins = parseTimeToMinutes(checkInTime);
          if (inMins !== null && inMins >= 586 && inMins <= 750) {
            // If approved in Late Approvals, do NOT count as late day for deduction
            if (!isLateApproved(emp, dayStr, lateApprovalLogs)) {
              lateDaysCount++;
            }
          }
        }
      }

      const lateDeductionDays = Math.floor(lateDaysCount / 4) * 0.5;
      const basePaidDays = presentDays + weekOffCount + paidLeaves + holidayCount;
      const paidDaysTotal = Math.max(0, basePaidDays - lateDeductionDays);

      return {
        employee_id: emp.id,
        working_days: daysInMonth,
        present_days: paidDaysTotal,
        week_off: weekOffCount,
        paid_leave: paidLeaves,
        holidays: holidayCount,
        absent_days: absentDays,
        late_days: lateDaysCount,
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

      // ─── Fetch saved payroll records from Supabase database for this month & year ───
      const mVal = Number(filters.month) + 1;
      const yVal = Number(filters.year);
      try {
        const { data: dbRecords, error: dbErr } = await supabase
          .from('payroll_history')
          .select('*')
          .eq('month', mVal)
          .eq('year', yVal);

        if (!dbErr && dbRecords && dbRecords.length > 0) {
          const dbEdits = {};
          dbRecords.forEach(row => {
            const currentEmp = emps.find(e => e.id === row.employee_id || e.rbp_joining_id === row.employee_code);
            const isPf = currentEmp ? (currentEmp.company_pf_provided === 'Yes') : true;
            const isEsic = currentEmp ? (currentEmp.company_esic_provided === 'Yes') : true;

            const masterSalary = currentEmp ? currentEmp.gross_salary : null;
            const effectiveSalary = (masterSalary !== null && masterSalary !== undefined && masterSalary > 0)
              ? masterSalary
              : Number(row.gross_salary);

            const rowData = {
              gross_salary: effectiveSalary,
              grossReal: effectiveSalary,
              basicEarned: Number(row.basic_earned),
              hraEarned: Number(row.hra_earned),
              convEarned: Number(row.conv_earned),
              medEarned: Number(row.med_earned),
              specialEarned: Number(row.special_earned),
              grossEarned: Number(row.gross_earned),
              otAmount: Number(row.ot_amount),
              epfDed: isPf ? Number(row.epf_ded) : 0,
              esicDed: isEsic ? Number(row.esic_ded) : 0,
              advance: Number(row.advance),
              security_deposit: Number(row.security_dep),
              late_deduction: Number(row.late_deduction || 0),
              other_deduction: Number(row.other_ded),
              totalDed: Number(row.total_ded),
              reimbursement: Number(row.reimbursement),
              salary_arrears: Number(row.salary_arrears),
              netSalary: Number(row.net_salary),
              ta_da: Number(row.ta_da),
              totalPayable: Number(row.total_payable),
              employerEPF: isPf ? Number(row.employer_epf) : 0,
              employerESIC: isEsic ? Number(row.employer_esic) : 0,
              ctc: Number(row.ctc),
              remark: row.remark || '',
              employee_name: row.employee_name,
              rbp_joining_id: row.employee_code,
              company_pf_provided: isPf ? 'Yes' : 'No',
              company_esic_provided: isEsic ? 'Yes' : 'No',
            };
            if (row.employee_id) dbEdits[row.employee_id] = rowData;
            if (row.employee_code) dbEdits[row.employee_code] = rowData;
          });
          setEdits(prev => ({ ...prev, ...dbEdits }));
        }
      } catch (err) {
        console.warn('Could not fetch payroll records from Supabase:', err);
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

  // ─── Unique companies list ─────────────────────────────────────────
  const companies = useMemo(() => {
    return [...new Set(employees.map(e => e.company).filter(Boolean))].sort();
  }, [employees]);

  // ─── Build enriched records ───────────────────────────────────────
  const allRecords = useMemo(() => {
    const daysInSelectedMonth = new Date(Number(filters.year), Number(filters.month) + 1, 0).getDate();
    return employees.map((emp, idx) => {
      const att = attendances.find(a => a.employee_id === emp.id) || {
        working_days: daysInSelectedMonth, present_days: 0, week_off: 0, absent_days: daysInSelectedMonth
      };
      const recordId = `PR${String(idx + 1).padStart(4, '0')}`;
      const empEdits = (emp.id && edits[emp.id]) || (emp.rbp_joining_id && edits[emp.rbp_joining_id]) || edits[recordId] || {};

      // Merge employee overrides if present
      const mergedEmp = {
        ...emp,
        ...(empEdits.employee_name !== undefined && empEdits.employee_name !== '' ? { employee_name: empEdits.employee_name } : {}),
        ...(empEdits.rbp_joining_id !== undefined && empEdits.rbp_joining_id !== '' ? { rbp_joining_id: empEdits.rbp_joining_id } : {}),
        ...(empEdits.bank_account_number !== undefined ? { bank_account_number: empEdits.bank_account_number } : {}),
        ...(empEdits.ifsc_code !== undefined ? { ifsc_code: empEdits.ifsc_code } : {}),
        ...(empEdits.uan_number !== undefined ? { uan_number: empEdits.uan_number } : {}),
        ...(empEdits.esic_number !== undefined ? { esic_number: empEdits.esic_number } : {}),
        ...(empEdits.designation !== undefined ? { designation: empEdits.designation } : {}),
        ...(empEdits.in_hand !== undefined ? { in_hand: empEdits.in_hand } : {}),
        gross_salary: (emp.gross_salary !== undefined && emp.gross_salary !== null && emp.gross_salary > 0)
          ? emp.gross_salary
          : (empEdits.gross_salary !== undefined ? Number(empEdits.gross_salary) : 0),
        company_pf_provided: empEdits.company_pf_provided !== undefined ? empEdits.company_pf_provided : emp.company_pf_provided,
        company_esic_provided: empEdits.company_esic_provided !== undefined ? empEdits.company_esic_provided : emp.company_esic_provided,
      };

      // Merge attendance overrides if present
      const mergedAtt = {
        ...att,
        ...(empEdits.present_days !== undefined && empEdits.present_days !== '' ? { present_days: Number(empEdits.present_days) } : {}),
        ...(empEdits.working_days !== undefined && empEdits.working_days !== '' ? { working_days: Number(empEdits.working_days) } : {}),
      };

      const c = calcSalary(mergedEmp.gross_salary, mergedAtt, empEdits, Number(filters.month), Number(filters.year), mergedEmp);
      return {
        id: recordId,
        employee: mergedEmp,
        attendance: mergedAtt,
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

    if (filters.company && filters.company !== 'All') list = list.filter(r => r.employee.company === filters.company);
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
    totalLateDeduction: filteredRecords.reduce((s, r) => s + r.calc.lateDeduction, 0),
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

  // ─── Save live edits directly to Supabase database ────────────────
  const handleSaveEdit = async (recordId, newEdits, targetRecord = null) => {
    const key = getStorageKey(filters.year, filters.month);
    const rec = targetRecord || editRecord;
    const emp = rec?.employee;
    const empId = emp?.id;
    const rbpId = emp?.rbp_joining_id;
    const mVal = Number(filters.month) + 1;
    const yVal = Number(filters.year);

    if (!newEdits) {
      // 1. Delete override from Supabase payroll_history if it exists
      if (empId || rbpId) {
        try {
          if (empId) {
            await supabase.from('payroll_history').delete().eq('employee_id', empId).eq('month', mVal).eq('year', yVal);
          }
          if (rbpId) {
            await supabase.from('payroll_history').delete().eq('employee_code', rbpId).eq('month', mVal).eq('year', yVal);
          }
        } catch (e) {
          console.warn('Failed to remove from Supabase:', e);
        }
      }

      setEdits(prev => {
        const next = { ...prev };
        delete next[recordId];
        if (empId) delete next[empId];
        if (rbpId) delete next[rbpId];
        if (emp?.name_as_per_aadhar) delete next[emp.name_as_per_aadhar];
        if (emp?.employee_name) delete next[emp.employee_name];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.warn('Failed to update localStorage:', e);
        }
        return next;
      });
      setEditRecord(null);
      addToast(`Payroll overrides reset for ${emp?.employee_name || 'employee'}`, 'info');
      return;
    }

    // 1. Directly save/upsert to Supabase database (payroll_history)
    const isPf = (newEdits.company_pf_provided === 'Yes' || (newEdits.company_pf_provided === undefined && emp?.company_pf_provided === 'Yes'));
    const isEsic = (newEdits.company_esic_provided === 'Yes' || (newEdits.company_esic_provided === undefined && emp?.company_esic_provided === 'Yes'));

    if (empId) {
      try {
        const historyRow = {
          employee_id: empId,
          employee_name: newEdits.employee_name || emp?.employee_name || '',
          employee_code: newEdits.rbp_joining_id || emp?.rbp_joining_id || '',
          month: mVal,
          year: yVal,
          gross_salary: Number(newEdits.gross_salary || newEdits.grossReal || emp?.gross_salary || 0),
          basic_earned: Number(newEdits.basicEarned || 0),
          hra_earned: Number(newEdits.hraEarned || 0),
          conv_earned: Number(newEdits.convEarned || 0),
          med_earned: Number(newEdits.medEarned || 0),
          special_earned: Number(newEdits.specialEarned || 0),
          gross_earned: Number(newEdits.grossEarned || 0),
          ot_amount: Number(newEdits.otAmount || 0),
          epf_ded: isPf ? Number(newEdits.epfDed || 0) : 0,
          esic_ded: isEsic ? Number(newEdits.esicDed || 0) : 0,
          advance: Number(newEdits.advance || 0),
          security_dep: Number(newEdits.security_deposit || 0),
          late_deduction: Number(newEdits.late_deduction || 0),
          other_ded: Number(newEdits.other_deduction || 0),
          total_ded: Number(newEdits.totalDed || 0),
          reimbursement: Number(newEdits.reimbursement || 0),
          salary_arrears: Number(newEdits.salary_arrears || 0),
          net_salary: Number(newEdits.netSalary || 0),
          ta_da: Number(newEdits.ta_da || 0),
          total_payable: Number(newEdits.totalPayable || 0),
          employer_epf: isPf ? Number(newEdits.employerEPF || 0) : 0,
          employer_esic: isEsic ? Number(newEdits.employerESIC || 0) : 0,
          ctc: Number(newEdits.ctc || 0),
          remark: newEdits.remark || ''
        };

        const { error: histSaveErr } = await supabase
          .from('payroll_history')
          .upsert([historyRow], { onConflict: 'employee_id,month,year' });

        if (histSaveErr) {
          console.warn('Could not upsert to payroll_history:', histSaveErr.message);
        }
      } catch (err) {
        console.warn('Error saving to payroll_history:', err);
      }

      // 2. Also update employee profile details in joining table if changed
      try {
        const updatePayload = {};
        if (newEdits.employee_name && newEdits.employee_name !== emp?.employee_name) {
          updatePayload.name_as_per_aadhar = newEdits.employee_name;
        }
        if (newEdits.rbp_joining_id && newEdits.rbp_joining_id !== emp?.rbp_joining_id) {
          updatePayload.rbp_joining_id = newEdits.rbp_joining_id;
        }
        if (newEdits.bank_account_number !== undefined) updatePayload.bank_account_number = newEdits.bank_account_number;
        if (newEdits.ifsc_code !== undefined) updatePayload.ifsc_code = newEdits.ifsc_code;
        if (newEdits.uan_number !== undefined) updatePayload.past_pf_id = newEdits.uan_number;
        if (newEdits.esic_number !== undefined) updatePayload.past_esic_number = newEdits.esic_number;
        if (newEdits.designation !== undefined) updatePayload.designation = newEdits.designation;
        if (newEdits.company_pf_provided !== undefined) updatePayload.company_pf_provided = newEdits.company_pf_provided;
        if (newEdits.company_esic_provided !== undefined) updatePayload.company_esic_provided = newEdits.company_esic_provided;
        if (newEdits.gross_salary !== undefined && !isNaN(Number(newEdits.gross_salary)) && Number(newEdits.gross_salary) > 0) {
          updatePayload.salary = Number(newEdits.gross_salary);
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from('joining').update(updatePayload).eq('id', empId);
          // Sync React employees state live!
          setEmployees(prev => prev.map(e => {
            if (e.id === empId || (rbpId && e.rbp_joining_id === rbpId)) {
              return {
                ...e,
                ...(updatePayload.name_as_per_aadhar ? { employee_name: updatePayload.name_as_per_aadhar } : {}),
                ...(updatePayload.rbp_joining_id ? { rbp_joining_id: updatePayload.rbp_joining_id } : {}),
                ...(updatePayload.company_pf_provided !== undefined ? { company_pf_provided: updatePayload.company_pf_provided } : {}),
                ...(updatePayload.company_esic_provided !== undefined ? { company_esic_provided: updatePayload.company_esic_provided } : {}),
                ...(updatePayload.salary !== undefined ? { gross_salary: Number(updatePayload.salary) } : {}),
                ...(updatePayload.designation ? { designation: updatePayload.designation } : {}),
              };
            }
            return e;
          }));
        }
      } catch (err) {
        console.warn('Could not update employee master in joining table:', err);
      }
    }

    // 3. Update React state & localStorage
    setEdits(prev => {
      const next = { ...prev, [recordId]: newEdits };
      if (empId) next[empId] = newEdits;
      if (rbpId) next[rbpId] = newEdits;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save edits to localStorage:', e);
      }
      return next;
    });

    setEditRecord(null);
    addToast('Payroll record saved directly to database (Supabase)', 'success');
  };

  const handleResetRecordOverrides = useCallback(async (record) => {
    if (!record) return;
    const emp = record.employee;
    const empName = emp?.employee_name || 'this employee';
    if (!window.confirm(`Reset all custom payroll overrides for "${empName}" back to original Master & Attendance calculations?`)) {
      return;
    }
    await handleSaveEdit(record.id, null, record);
  }, [filters.year, filters.month]);

  // ─── Save all current processed records to Supabase database ──────
  const handleSaveAllToDatabase = async () => {
    if (filteredRecords.length === 0) return;
    setLoading(true);
    try {
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
        late_deduction: r.calc.lateDeduction,
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

      const { error: dbErr } = await supabase
        .from('payroll_history')
        .upsert(historyRows, { onConflict: 'employee_id,month,year' });

      if (dbErr) throw dbErr;
      addToast(`All ${historyRows.length} employee records saved permanently in database!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error saving to database: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
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
        late_deduction: r.calc.lateDeduction,
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
      'ACCOUNT NO': r.employee.bank_account_number || '',
      'IFSC CODE': r.employee.ifsc_code || '',
      'COMPANY PROVIDES PF': r.edits?.company_pf_provided || r.employee.company_pf_provided || 'No',
      'COMPANY PROVIDES ESIC': r.edits?.company_esic_provided || r.employee.company_esic_provided || 'No',
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
      'LATE DEDUCTION': r.calc.lateDeduction,
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
      'ACCOUNT NO': r.employee.bank_account_number || '',
      'IFSC CODE': r.employee.ifsc_code || '',
      'COMPANY PROVIDES PF': r.employee.company_pf_provided || 'No',
      'COMPANY PROVIDES ESIC': r.employee.company_esic_provided || 'No',
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
      'LATE DEDUCTION': r.calc.lateDeduction,
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

      const mapped = (data || []).map((row, idx) => {
        const matchedEmp = employees.find(e => e.id === row.employee_id || e.rbp_joining_id === row.employee_code);
        return {
          id: row.id,
          employee: {
            id: row.employee_id,
            rbp_joining_id: row.employee_code,
            employee_name: row.employee_name,
            gross_salary: Number(row.gross_salary),
            department: matchedEmp?.department || 'N/A',
            designation: matchedEmp?.designation || 'N/A',
            bank_account_number: matchedEmp?.bank_account_number || '',
            ifsc_code: matchedEmp?.ifsc_code || '',
            uan_number: matchedEmp?.uan_number || '',
            esic_number: matchedEmp?.esic_number || '',
            company_pf_provided: matchedEmp?.company_pf_provided || (Number(row.epf_ded) > 0 ? 'Yes' : 'No'),
            company_esic_provided: matchedEmp?.company_esic_provided || (Number(row.esic_ded) > 0 ? 'Yes' : 'No'),
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
          lateDeduction: Number(row.late_deduction || 0),
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
      };
    });
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAllToDatabase}
                    disabled={loading || filteredRecords.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 disabled:opacity-50 active:scale-95"
                    title="Save all employee payroll records permanently to database"
                  >
                    <span>💾 Save All to Database</span>
                  </button>
                  <button
                    onClick={handleFinalizePayroll}
                    disabled={loading || filteredRecords.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 transition-all duration-150 disabled:opacity-50"
                  >
                    🔒 Lock & Finalize Month
                  </button>
                </div>
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
              companies={companies}
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
              onReset={isFinalized ? null : handleResetRecordOverrides}
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
          month={Number(filters.month)}
          year={Number(filters.year)}
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

