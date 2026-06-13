import { useState, useEffect } from "react";
import supabase from "../utils/supabase";
import { Select } from "antd";

// Sub-components
import AttendancePDF from "../components/attendance/AttendancePDF";
import AttendanceExcel from "../components/attendance/AttendanceExcel";
import LeaveModal from "../components/attendance/LeaveModal";
import EditAttendanceModal from "../components/attendance/EditAttendanceModal";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import AttendanceTable from "../components/attendance/AttendanceTable";
import EmployeeSummaryPanel from "../components/attendance/EmployeeSummaryPanel";
import RecentCorrections from "../components/attendance/RecentCorrections";
import DayDetailModal from "../components/attendance/DayDetailModal";

// Helper Functions
function calcSummary(data) {
  return {
    P: data.filter(d => d === "P").length,
    A: data.filter(d => d === "A").length,
    CL: data.filter(d => d === "CL").length,
    WO: data.filter(d => d === "WO").length,
    HD: data.filter(d => d === "HD").length,
    EL: data.filter(d => d === "EL").length,
    LWP: data.filter(d => d === "LWP").length,
    H: data.filter(d => d === "H").length,
    PM: data.filter(d => d === "PM").length,
  };
}

function paidDays(s) {
  return s.P + s.CL + s.EL + s.WO + s.H + s.HD * 0.5;
}

const getMonthNumber = (monthName) => {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  timeStr = timeStr.trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const isPM = timeStr.includes("PM");
    const cleanTime = timeStr.replace(/[AP]M/, "").trim();
    const parts = cleanTime.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const parts = timeStr.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  }

  return hours * 60 + minutes;
};

export default function HRMSAttendanceDashboard() {
  // States for real data
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [fieldAttendance, setFieldAttendance] = useState([]);
  const [biometricAttendance, setBiometricAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualCorrections, setManualCorrections] = useState([]);

  // New states for Finalization & Processing Engine
  const [currentMainTab, setCurrentMainTab] = useState("attendance"); // "attendance", "ledger", "holidays", "logs"
  const [holidays, setHolidays] = useState([]);
  const [leaveLedger, setLeaveLedger] = useState([]);
  const [finalizationLogs, setFinalizationLogs] = useState([]);
  const [finalizedAttendance, setFinalizedAttendance] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [processedDraft, setProcessedDraft] = useState({});
  const [processedDraftDetails, setProcessedDraftDetails] = useState({});
  const [manualOverrides, setManualOverrides] = useState({}); // { empId: { dateStr: status } }

  // Holiday form state
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ holiday_name: "", holiday_date: "", holiday_type: "National" });

  // Leave Ledger Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ employee_id: "", leave_type: "CL", transaction_type: "CREDIT", amount: 1, remarks: "" });

  // Bulk action state
  const [bulkAction, setBulkAction] = useState({ startDate: "", endDate: "", status: "P" });

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState({
    employee: null,
    date: null,
    currentStatus: null,
    dayIndex: null
  });
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [dayDetailData, setDayDetailData] = useState({
    employee: null,
    date: null,
    status: null
  });

  // UI States
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("biometric");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long" }));
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // Edit States
  const [editingCell, setEditingCell] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);

  // Leave Management (CL = 12 days/year)
  const [leaveBalances, setLeaveBalances] = useState({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeaveEmp, setSelectedLeaveEmp] = useState(null);
  const [leaveType, setLeaveType] = useState("CL");
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState("");

  const ROWS_PER_PAGE = 1000;
  const MAX_CL_DAYS = 12;

  const getCurrentDate = () => {
    const date = new Date();
    return `${date.toLocaleDateString("en-US", { weekday: "long" })}, ${date.getDate()} ${date.toLocaleDateString("en-US", { month: "long" })} ${date.getFullYear()}`;
  };

  const fetchEmployees = async () => {
    try {
      // Fetch all joining data (both Active and Inactive) to calculate historical attendance correctly
      let joiningData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: joiningError } = await supabase
          .from("joining")
          .select("id, name_as_per_aadhar, firm_name, attendance_type, rbp_joining_id, department, designation, status, employee_category, date_of_joining, leaving_date")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (joiningError) throw joiningError;

        if (data && data.length > 0) {
          joiningData = [...joiningData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Get unique companies from joining data
      const uniqueCompanies = [...new Set((joiningData || []).map(j => j.firm_name).filter(Boolean))];
      setCompanies(uniqueCompanies);

      const empList = (joiningData || []).map((join, idx) => {
        return {
          id: join.id,
          code: join.rbp_joining_id || `EMP${idx + 1}`,
          name: join.name_as_per_aadhar || `Employee ${idx + 1}`,
          dept: join.department || (join.attendance_type === "Field" ? "Field" : "Office"),
          role: join.designation || "Staff",
          avatar: (join.name_as_per_aadhar || "EM").substring(0, 2).toUpperCase(),
          userId: join.id,
          company: join.firm_name || "N/A",
          attendanceType: join.attendance_type || "Field",
          joiningId: join.rbp_joining_id,
          employeeCategory: join.employee_category || "",
          dateOfJoining: join.date_of_joining || "",
          dateOfLeaving: join.leaving_date || "",
          status: join.status || "Active"
        };
      });

      setEmployees(empList);
      return empList;
    } catch (err) {
      console.error("Error fetching employees:", err);
      return [];
    }
  };

  // Format time to 12hr AM/PM format
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return null;
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
      return timeStr;
    }
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };


  // Fetch biometric attendance from offline_biometric_punch (optimized)
  const fetchBiometricAttendance = async (year = selectedYear, month = selectedMonth) => {
    try {
      const monthNum = getMonthNumber(month) + 1;
      const yearVal = parseInt(year);
      const daysInMonth = new Date(yearVal, monthNum, 0).getDate();
      const startDate = `${yearVal}-${String(monthNum).padStart(2, "0")}-01`;
      const endDate = `${yearVal}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("offline_biometric_punch")
          .select("*")
          .gte("attendance_date", startDate)
          .lte("attendance_date", endDate)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (err) throw err;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Group biometric records by employee and date to handle multiple punches on the same date
      const groupedData = {};
      allData.forEach(record => {
        if (!record.employee_id || !record.attendance_date) return;
        const key = `${record.employee_id}_${record.attendance_date}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            employeeCode: record.employee_id,
            employeeName: record.employee_name,
            date: record.attendance_date,
            inTimes: [],
            outTimes: [],
            records: []
          };
        }
        groupedData[key].records.push(record);
        if (record.in_time) groupedData[key].inTimes.push(record.in_time);
        if (record.out_time) groupedData[key].outTimes.push(record.out_time);
      });

      const formatted = Object.values(groupedData).map(group => {
        const allTimes = [];
        group.inTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });
        group.outTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });

        // Sort times ascending using parseTimeToMinutes
        allTimes.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

        let finalIn = null;
        let finalOut = null;

        if (allTimes.length === 1) {
          if (group.inTimes.length > 0) {
            finalIn = group.inTimes[0];
          } else if (group.outTimes.length > 0) {
            finalOut = group.outTimes[0];
          } else {
            finalIn = allTimes[0];
          }
        } else if (allTimes.length > 1) {
          finalIn = allTimes[0];
          finalOut = allTimes[allTimes.length - 1];
        }

        const isPresent = finalIn || finalOut;

        return {
          employeeCode: group.employeeCode,
          employeeName: group.employeeName,
          date: group.date,
          inTime: formatTime12hr(finalIn),
          outTime: formatTime12hr(finalOut),
          status: isPresent ? "P" : "A",
          records: group.records
        };
      });

      setBiometricAttendance(formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching biometric:", err);
      return [];
    }
  };

  // Fetch field attendance from attendance table (optimized)
  const fetchFieldAttendance = async (year = selectedYear, month = selectedMonth) => {
    try {
      const monthNum = getMonthNumber(month) + 1;
      const yearVal = parseInt(year);
      const daysInMonth = new Date(yearVal, monthNum, 0).getDate();
      const startDate = `${yearVal}-${String(monthNum).padStart(2, "0")}-01`;
      const endDate = `${yearVal}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("attendance")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (err) throw err;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const grouped = {};
      allData.forEach(record => {
        const key = `${record.person_name}_${record.date}`;

        if (!grouped[key]) {
          grouped[key] = {
            employeeName: record.person_name,
            employeeCode: record.employee_code,
            date: record.date,
            inTime: null,
            outTime: null,
            midEntries: [],
            status: "A",
            records: [],
            images: record.images,
            address: record.address,
            mapLink: record.map_link,
            latitude: record.latitude,
            longitude: record.longitude,
            reason: record.reason,
            approvedStatus: record.approved_status,
            remark: record.remark,
            attachment: record.attachment
          };
        }

        grouped[key].records.push(record);

        if (record.status === "IN") {
          grouped[key].inTime = record.time;
          grouped[key].status = "P";
        } else if (record.status === "OUT") {
          grouped[key].outTime = record.time;
        } else if (record.status === "MID") {
          grouped[key].midEntries.push(record.time);
        } else if (record.status === "CL") {
          grouped[key].status = "CL";
        }
      });

      setFieldAttendance(Object.values(grouped));
      return Object.values(grouped);
    } catch (err) {
      console.error("Error fetching field attendance:", err);
      return [];
    }
  };

  // Fetch manual corrections
  const fetchManualCorrections = async () => {
    try {
      const { data, error: err } = await supabase
        .from("attendance")
        .select("*")
        .eq("approved_status", "corrected")
        .order("date", { ascending: false })
        .limit(50);

      if (err) throw err;

      const corrections = (data || []).map(record => ({
        emp: record.person_name,
        code: record.employee_code,
        date: record.date,
        prev: "Original",
        next: record.status === "IN" || record.status === "P" ? "P" : record.status,
        reason: record.remark || record.reason || "Manual correction",
        by: "Admin",
        on: record.timestamp || new Date().toLocaleDateString(),
        attachment: record.attachment
      }));

      setManualCorrections(corrections);

      // Also populate manualOverrides state from corrections
      const overrides = {};
      corrections.forEach(c => {
        if (!overrides[c.code]) overrides[c.code] = {};
        overrides[c.code][c.date] = c.next;
      });
      setManualOverrides(prev => ({ ...prev, ...overrides }));
    } catch (err) {
      console.error("Error fetching corrections:", err);
    }
  };

  // Fetch Holidays
  const fetchHolidays = async () => {
    try {
      const { data, error: err } = await supabase
        .from("holiday_master")
        .select("*")
        .eq("is_active", true)
        .order("holiday_date", { ascending: true });
      if (err) throw err;
      setHolidays(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching holidays:", err);
      return [];
    }
  };

  // Fetch Leave Ledger
  const fetchLeaveLedger = async (employeesList = []) => {
    try {
      let query = supabase
        .from("leave_ledger")
        .select("*")
        .order("created_at", { ascending: false });

      if (employeesList && employeesList.length > 0) {
        const empIds = employeesList.map(e => e.id).filter(Boolean);
        if (empIds.length > 0) {
          query = query.in("employee_id", empIds);
        }
      }

      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (err) {
          // Handle table missing gracefully
          if (err.message?.includes("does not exist")) {
            console.warn("leave_ledger table does not exist yet. Please run SQL schema.");
            return [];
          }
          throw err;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      setLeaveLedger(allData);
      return allData;
    } catch (err) {
      console.error("Error fetching leave ledger:", err);
      return [];
    }
  };

  // Fetch Finalization Logs
  const fetchFinalizationLogs = async () => {
    try {
      const { data, error: err } = await supabase
        .from("attendance_finalization_log")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (err) {
        if (err.message?.includes("does not exist")) return [];
        throw err;
      }
      setFinalizationLogs(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching finalization logs:", err);
      return [];
    }
  };

  // Fetch Finalized Attendance
  const fetchFinalizedAttendance = async (year, month, employeesList = []) => {
    try {
      const monthNum = getMonthNumber(month) + 1;
      let query = supabase
        .from("final_attendance")
        .select("*")
        .eq("month", monthNum)
        .eq("year", parseInt(year));

      if (employeesList && employeesList.length > 0) {
        const empIds = employeesList.map(e => e.id).filter(Boolean);
        if (empIds.length > 0) {
          query = query.in("employee_id", empIds);
        }
      }

      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (err) {
          if (err.message?.includes("does not exist")) return [];
          throw err;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      setFinalizedAttendance(allData);
      return allData;
    } catch (err) {
      console.error("Error fetching finalized attendance:", err);
      return [];
    }
  };

  // Sync Monthly CL credits for all employees
  const syncMonthlyCLCredits = async (employeesList, ledgerRows, yearNum, monthName) => {
    try {
      const selectedMonthNum = getMonthNumber(monthName) + 1;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Determine financial year. April = 4.
      const fyStartYear = selectedMonthNum >= 4 ? parseInt(yearNum) : parseInt(yearNum) - 1;

      // Generate the list of months in the financial year up to min(selectedMonth, currentMonth)
      const eligibleMonths = [];
      const totalMonthsInFY = 12; // April to March

      const targetMonthDate = new Date(parseInt(yearNum), selectedMonthNum - 1, 1);
      const today = new Date();
      const minTargetDate = targetMonthDate < today ? targetMonthDate : today;

      let tempYear = fyStartYear;
      for (let m = 4; m <= 15; m++) {
        let normMonth = m;
        let normYear = tempYear;
        if (normMonth > 12) {
          normMonth -= 12;
          normYear = tempYear + 1;
        }

        const firstOfM = new Date(normYear, normMonth - 1, 1);
        if (firstOfM <= minTargetDate) {
          eligibleMonths.push({ month: normMonth, year: normYear });
        }
      }

      const monthsNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const missingCredits = [];

      for (const emp of employeesList) {
        const dojStr = emp.dateOfJoining;
        if (!dojStr) continue;
        const doj = new Date(dojStr);

        for (const target of eligibleMonths) {
          const firstDayOfTarget = new Date(target.year, target.month - 1, 1);

          // Skip if month is before employee's date of joining
          if (firstDayOfTarget.getFullYear() < doj.getFullYear() ||
            (firstDayOfTarget.getFullYear() === doj.getFullYear() && firstDayOfTarget.getMonth() < doj.getMonth())) {
            continue;
          }

          const targetMonthName = monthsNames[target.month - 1];
          const remarkKey = `Auto Monthly Credit - ${targetMonthName} ${target.year}`;

          const alreadyCredited = ledgerRows.some(row =>
            row.employee_id === emp.id &&
            row.leave_type === "CL" &&
            row.transaction_type === "CREDIT" &&
            row.remarks === remarkKey
          );

          if (!alreadyCredited) {
            missingCredits.push({
              employee_id: emp.id,
              ledger_date: `${target.year}-${String(target.month).padStart(2, "0")}-01`,
              leave_type: "CL",
              transaction_type: "CREDIT",
              earned: 1,
              used: 0,
              remarks: remarkKey
            });
          }
        }
      }

      if (missingCredits.length > 0) {
        const { error: insertError } = await supabase
          .from("leave_ledger")
          .insert(missingCredits);

        if (insertError) {
          console.error("Error auto crediting CL:", insertError);
        } else {
          console.log(`Auto-credited ${missingCredits.length} CL entries to leave_ledger.`);
          // Refetch ledger
          await fetchLeaveLedger();
        }
      }
    } catch (err) {
      console.error("Error in syncMonthlyCLCredits:", err);
    }
  };

  // Core Processing Engine
  const processAttendanceEngine = (employeesList, biometricList, fieldList, holidaysList, ledgerList, yearVal, monthName) => {
    const monthIndex = getMonthNumber(monthName);
    const daysInMonth = new Date(parseInt(yearVal), monthIndex + 1, 0).getDate();

    const draftStatus = {};
    const draftDetails = {};
    const localBalances = {};

    // 1. Calculate All Employee Balances (Credits - Debits)
    employeesList.forEach(emp => {
      const empLedger = ledgerList.filter(row => row.employee_id === emp.id);

      const totalClCredits = empLedger
        .filter(row => row.leave_type === "CL" && (row.transaction_type === "CREDIT" || row.transaction_type === "ADJUSTMENT" && row.earned > 0))
        .reduce((sum, row) => sum + Number(row.earned || 0), 0);

      const totalClDebits = empLedger
        .filter(row => row.leave_type === "CL" && (row.transaction_type === "DEBIT" || row.transaction_type === "ADJUSTMENT" && row.used > 0))
        .reduce((sum, row) => sum + Number(row.used || 0), 0);

      const totalElCredits = empLedger
        .filter(row => row.leave_type === "EL" && (row.transaction_type === "CREDIT" || row.transaction_type === "ADJUSTMENT" && row.earned > 0))
        .reduce((sum, row) => sum + Number(row.earned || 0), 0);

      const totalElDebits = empLedger
        .filter(row => row.leave_type === "EL" && (row.transaction_type === "DEBIT" || row.transaction_type === "ADJUSTMENT" && row.used > 0))
        .reduce((sum, row) => sum + Number(row.used || 0), 0);

      localBalances[emp.id] = {
        earnedCL: totalClCredits,
        usedCL: totalClDebits,
        remainingCL: totalClCredits - totalClDebits,
        earnedEL: totalElCredits,
        usedEL: totalElDebits,
        remainingEL: totalElCredits - totalElDebits,
        lwpCount: 0
      };
    });

    setLeaveBalances(localBalances);

    // 2. Loop Through Employees & Days
    employeesList.forEach(emp => {
      const empStatusArray = new Array(daysInMonth).fill("A");
      const empDetailsArray = [];

      // Prior CL balance for decrementing during the month
      const empLedger = ledgerList.filter(row => row.employee_id === emp.id);
      const targetMonthStartStr = `${yearVal}-${String(monthIndex + 1).padStart(2, "0")}-01`;

      const clDebitsPrior = empLedger
        .filter(row => row.leave_type === "CL" && (row.transaction_type === "DEBIT" || row.used > 0) && row.ledger_date < targetMonthStartStr)
        .reduce((sum, row) => sum + Number(row.used || 0), 0);
      let runningCLBalance = localBalances[emp.id].earnedCL - clDebitsPrior;

      const elDebitsPrior = empLedger
        .filter(row => row.leave_type === "EL" && (row.transaction_type === "DEBIT" || row.used > 0) && row.ledger_date < targetMonthStartStr)
        .reduce((sum, row) => sum + Number(row.used || 0), 0);
      let runningELBalance = localBalances[emp.id].earnedEL - elDebitsPrior;

      let lateCount = 0;
      let lwpCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yearVal}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayDate = new Date(parseInt(yearVal), monthIndex, d);
        const dayOfWeek = dayDate.getDay(); // 0 = Sunday

        let status = "A";
        let inTime = null;
        let outTime = null;
        let isLate = false;
        let isHalfDay = false;
        let isPunchMissing = false;
        let remarks = "";
        let source = "biometric";

        // Join & leaving check
        const doj = emp.dateOfJoining ? new Date(emp.dateOfJoining) : null;
        const dol = emp.dateOfLeaving ? new Date(emp.dateOfLeaving) : null;

        // Remove time portion for comparison
        const compareDate = new Date(dayDate);
        compareDate.setHours(0, 0, 0, 0);

        const isBeforeJoining = doj && compareDate < new Date(doj).setHours(0, 0, 0, 0);
        const isAfterLeaving = dol && compareDate > new Date(dol).setHours(0, 0, 0, 0);

        if (isBeforeJoining || isAfterLeaving) {
          empStatusArray[d - 1] = "";
          empDetailsArray.push({
            status: "",
            inTime: null,
            outTime: null,
            remarks: isBeforeJoining ? "Before Joining" : "After Resignation"
          });
          continue;
        }

        // Apply Priority Engine

        // 1. Manual Override Check
        const manualOverride = manualOverrides[emp.code]?.[dateStr] || manualOverrides[emp.id]?.[dateStr];

        if (manualOverride) {
          status = manualOverride;
          remarks = "Manual Override";
          source = "manual";

          if (status === "CL") {
            runningCLBalance--;
          } else if (status === "EL") {
            runningELBalance--;
          } else if (status === "LWP") {
            lwpCount++;
          }
        } else {
          // 2. Holiday Rule
          const holidayMatch = holidaysList.find(h => h.holiday_date === dateStr);

          if (holidayMatch) {
            status = "H";
            remarks = holidayMatch.holiday_name;
          }
          // 3. Weekly Off (Sunday)
          else if (dayOfWeek === 0) {
            status = "WO";
            remarks = "Weekly Off";
          }
          // 4. Approved Leave
          else {
            // Find in fieldAttendance (which has leave requests) or approved leave requests
            const fieldCL = fieldList.find(f =>
              (f.employeeName === emp.name || f.employeeCode === emp.code) &&
              f.date === dateStr &&
              f.status === "CL"
            );

            if (fieldCL) {
              if (runningCLBalance >= 1) {
                status = "CL";
                runningCLBalance--;
                remarks = "Approved Casual Leave";
              } else {
                status = "LWP";
                lwpCount++;
                remarks = "CL converted to LWP (Insufficient Balance)";
              }
            } else {
              // 5. Attendance Record (Biometric/Field Punch)
              let record = null;

              if (emp.employeeCategory?.trim() === "Office Staff") {
                record = biometricList.find(b =>
                  (b.employeeCode?.trim().toLowerCase() === emp.code?.trim().toLowerCase() ||
                    b.employeeName?.trim().toLowerCase() === emp.name?.trim().toLowerCase()) &&
                  b.date === dateStr
                );
                source = "biometric";
              } else {
                record = fieldList.find(f =>
                  (f.employeeName === emp.name || f.employeeCode === emp.code) &&
                  f.date === dateStr &&
                  f.status !== "CL"
                );
                source = "field";
              }

              if (record && (record.inTime || record.outTime)) {
                inTime = record.inTime;
                outTime = record.outTime;

                if (!inTime || !outTime) {
                  status = "PM";
                  isPunchMissing = true;
                  remarks = "Punch Missing";
                } else {
                  const inMin = parseTimeToMinutes(inTime);
                  const outMin = parseTimeToMinutes(outTime);

                  // Late mark check: limit 09:30 AM. Late if > 09:45 AM (585 min) and <= 12:30 PM (750 min)
                  if (inMin > 585 && inMin <= 750) {
                    lateCount++;
                    isLate = true;
                    if (lateCount >= 4) {
                      status = "HD";
                      isHalfDay = true;
                      remarks = `4th Late Mark (${lateCount})`;
                    } else {
                      status = "P";
                      remarks = `Late Mark (${lateCount})`;
                    }
                  }
                  // In Time > 12:30 PM -> HD
                  else if (inMin > 750) {
                    status = "HD";
                    isHalfDay = true;
                    remarks = "In-time after 12:30 PM";
                  }
                  // Out Time < 04:00 PM (16:00 = 960 min) -> HD
                  else if (outMin < 960) {
                    status = "HD";
                    isHalfDay = true;
                    remarks = "Out-time before 04:00 PM";
                  }
                  else {
                    status = "P";
                  }
                }
              } else {
                status = "A";
                remarks = "Absent";
              }
            }
          }
        }

        // Sunday Work EL credit logic:
        let earnedEL = 0;
        if (dayOfWeek === 0 && ["P", "HD", "PM"].includes(status)) {
          earnedEL = 1;
          remarks = `${remarks ? remarks + " + " : ""}Sunday Work EL Credit`;
        }

        empStatusArray[d - 1] = status;
        empDetailsArray.push({
          status,
          inTime,
          outTime,
          isLate,
          isHalfDay,
          isPunchMissing,
          remarks,
          source,
          earnedEL,
          lateCountVal: status === "P" && isLate ? lateCount : (status === "HD" && isLate ? lateCount : 0)
        });
      }

      draftStatus[emp.id] = empStatusArray;
      draftDetails[emp.id] = empDetailsArray;

      // Update LWP counts
      if (localBalances[emp.id]) {
        localBalances[emp.id].lwpCount = lwpCount;
      }
    });

    setProcessedDraft(draftStatus);
    setProcessedDraftDetails(draftDetails);
  };

  const applyLeave = async () => {
    if (!selectedLeaveEmp || leaveDays <= 0) return;

    const remainingCL = leaveBalances[selectedLeaveEmp.id]?.remainingCL || MAX_CL_DAYS;

    if (leaveType === "CL" && leaveDays > remainingCL) {
      alert(`Insufficient CL balance! Available: ${remainingCL} days`);
      return;
    }

    try {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < leaveDays; i++) {
        const leaveDate = new Date(today);
        leaveDate.setDate(today.getDate() + i);
        dates.push(leaveDate.toISOString().split("T")[0]);
      }

      for (const date of dates) {
        const { error: err } = await supabase
          .from("attendance")
          .insert({
            person_name: selectedLeaveEmp.name,
            employee_code: selectedLeaveEmp.code,
            date: date,
            status: leaveType === "CL" ? "IN" : "OUT",
            approved_status: "approved",
            remark: leaveReason || `${leaveType} Leave applied`,
            timestamp: new Date().toISOString()
          });

        if (err) throw err;
      }

      alert(`${leaveDays} day(s) ${leaveType} leave applied for ${selectedLeaveEmp.name}`);
      setShowLeaveModal(false);
      setSelectedLeaveEmp(null);
      setLeaveDays(1);
      setLeaveReason("");

      await fetchFieldAttendance();
      await fetchManualCorrections();
      await loadDynamicData();
    } catch (err) {
      console.error("Error applying leave:", err);
      alert("Failed to apply leave");
    }
  };

  const getDaysOfWeek = (year, month) => {
    const monthNum = getMonthNumber(month);
    const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(parseInt(year), monthNum, i);
      days.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return days;
  };

  const isFutureDate = (year, month, day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(parseInt(year), getMonthNumber(month), day);
    return checkDate > today;
  };

  // Generate monthly attendance matrix
  const generateMonthlyAttendance = (employee, year, month) => {
    const monthNum = getMonthNumber(month);
    const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();

    if (isFinalized) {
      const arr = new Array(daysInMonth).fill("A");
      const empFinalRecords = finalizedAttendance.filter(f =>
        (f.employee_id === employee.id || f.employee_code === employee.code || f.employee_name === employee.name)
      );

      empFinalRecords.forEach(r => {
        const d = new Date(r.attendance_date).getDate();
        if (d >= 1 && d <= daysInMonth) {
          arr[d - 1] = r.status;
        }
      });
      return arr;
    } else {
      return processedDraft[employee.id] || new Array(daysInMonth).fill("A");
    }
  };

  // Update attendance status with remark and file
  const updateAttendanceStatus = async (employee, date, newStatus) => {
    const [yearVal, monthName, dayVal] = date.split("-");
    if (isFutureDate(yearVal, monthName, parseInt(dayVal))) {
      alert("Cannot edit future dates!");
      return;
    }

    if (!editRemark.trim()) {
      alert("Remark is mandatory when editing attendance!");
      return;
    }

    try {
      let attachmentUrl = null;

      if (editFile) {
        const fileName = `${employee.code}_${date}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(`attendance/${fileName}`, editFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`attendance/${fileName}`);

        attachmentUrl = urlData.publicUrl;
      }

      const { error: err } = await supabase
        .from("attendance")
        .insert({
          person_name: employee.name,
          employee_code: employee.code,
          date: date,
          status: newStatus,
          approved_status: "corrected",
          remark: editRemark,
          attachment: attachmentUrl,
          timestamp: new Date().toISOString()
        });

      if (err) throw err;

      // Update manualOverrides instantly
      setManualOverrides(prev => {
        const next = { ...prev };
        if (!next[employee.code]) next[employee.code] = {};
        next[employee.code][date] = newStatus;
        return next;
      });

      await fetchFieldAttendance();
      await fetchManualCorrections();

      alert(`Attendance updated to ${newStatus} for ${employee.name} on ${date}`);

      // Reset form
      setEditRemark("");
      setEditFile(null);
      setEditFilePreview(null);
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Failed to update attendance");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Bulk status updates
  const handleApplyBulkAction = () => {
    if (!bulkAction.startDate || !bulkAction.endDate) {
      alert("Please select both Start Date and End Date!");
      return;
    }
    const start = new Date(bulkAction.startDate);
    const end = new Date(bulkAction.endDate);
    if (start > end) {
      alert("Start Date cannot be after End Date!");
      return;
    }

    const overrides = { ...manualOverrides };

    // Apply to filtered list of employees
    filtered.forEach(emp => {
      if (!overrides[emp.code]) overrides[emp.code] = {};

      const temp = new Date(start);
      while (temp <= end) {
        const dateStr = temp.toISOString().split("T")[0];
        overrides[emp.code][dateStr] = bulkAction.status;
        temp.setDate(temp.getDate() + 1);
      }
    });

    setManualOverrides(overrides);
    alert(`Applied bulk status '${bulkAction.status}' to ${filtered.length} employees from ${bulkAction.startDate} to ${bulkAction.endDate} in-memory.`);
  };

  // Submit and Finalize Attendance
  const handleFinalizeAttendance = async () => {
    if (selectedCompany === "All Companies") {
      alert("Please select a specific Company to submit and finalize attendance!");
      return;
    }

    const confirmFinalize = window.confirm(
      `Are you sure you want to SUBMIT & FINALIZE attendance for "${selectedCompany}" for ${selectedMonth} ${selectedYear}? This will lock the records and update the leave ledger.`
    );
    if (!confirmFinalize) return;

    setLoading(true);
    try {
      const monthNum = getMonthNumber(selectedMonth) + 1;
      const yearNum = parseInt(selectedYear);

      // 1. Write computed rows into final_attendance
      const finalRows = [];
      const ledgerEntries = [];

      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

      // Filter employees for this company
      const companyEmployees = employees.filter(e => e.company === selectedCompany);

      companyEmployees.forEach(emp => {
        const statuses = processedDraft[emp.id] || [];
        const details = processedDraftDetails[emp.id] || [];

        for (let d = 1; d <= daysInMonth; d++) {
          const status = statuses[d - 1];
          const detail = details[d - 1];
          if (!status) continue; // Skip inactive days

          const dateStr = `${selectedYear}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

          finalRows.push({
            employee_id: emp.id,
            employee_name: emp.name,
            employee_code: emp.code,
            attendance_date: dateStr,
            status: status,
            in_time: detail.inTime || null,
            out_time: detail.outTime || null,
            is_late: detail.isLate || false,
            is_half_day: detail.isHalfDay || false,
            is_punch_missing: detail.isPunchMissing || false,
            remarks: detail.remarks || "",
            month: monthNum,
            year: yearNum,
            company: selectedCompany
          });

          // Debits (Leaves used)
          if (status === "CL") {
            ledgerEntries.push({
              employee_id: emp.id,
              ledger_date: dateStr,
              leave_type: "CL",
              transaction_type: "DEBIT",
              earned: 0,
              used: 1,
              remarks: `Casual Leave Taken - ${selectedMonth} ${selectedYear}`
            });
          } else if (status === "EL") {
            ledgerEntries.push({
              employee_id: emp.id,
              ledger_date: dateStr,
              leave_type: "EL",
              transaction_type: "DEBIT",
              earned: 0,
              used: 1,
              remarks: `Earned Leave Taken - ${selectedMonth} ${selectedYear}`
            });
          }

          // Credits (Sunday work EL earned)
          if (detail.earnedEL > 0) {
            ledgerEntries.push({
              employee_id: emp.id,
              ledger_date: dateStr,
              leave_type: "EL",
              transaction_type: "CREDIT",
              earned: 1,
              used: 0,
              remarks: `Earned Leave Credited - Sunday Work on ${dateStr}`
            });
          }
        }
      });

      // Insert into final_attendance
      const { error: finalError } = await supabase
        .from("final_attendance")
        .insert(finalRows);
      if (finalError) throw finalError;

      // Insert into leave_ledger if any entries exist
      if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabase
          .from("leave_ledger")
          .insert(ledgerEntries);
        if (ledgerError) throw ledgerError;
      }

      // Record in log
      const { error: logError } = await supabase
        .from("attendance_finalization_log")
        .insert({
          month: monthNum,
          year: yearNum,
          company: selectedCompany,
          finalized_by: "HR Admin"
        });
      if (logError) throw logError;

      alert(`Success! Attendance for "${selectedCompany}" finalized and locked.`);
      await loadDynamicData();
    } catch (err) {
      console.error("Error finalizing attendance:", err);
      alert(`Error: ${err.message || "Failed to finalize attendance"}`);
    } finally {
      setLoading(false);
    }
  };

  // Holiday management
  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.holiday_name || !holidayForm.holiday_date) {
      alert("Name and date are required!");
      return;
    }

    try {
      if (editingHoliday) {
        const { error: err } = await supabase
          .from("holiday_master")
          .update({
            holiday_name: holidayForm.holiday_name,
            holiday_date: holidayForm.holiday_date,
            holiday_type: holidayForm.holiday_type
          })
          .eq("id", editingHoliday.id);
        if (err) throw err;
        alert("Holiday updated successfully.");
      } else {
        const { error: err } = await supabase
          .from("holiday_master")
          .insert({
            holiday_name: holidayForm.holiday_name,
            holiday_date: holidayForm.holiday_date,
            holiday_type: holidayForm.holiday_type,
            is_active: true
          });
        if (err) throw err;
        alert("Holiday added successfully.");
      }

      setShowHolidayModal(false);
      setEditingHoliday(null);
      setHolidayForm({ holiday_name: "", holiday_date: "", holiday_type: "National" });
      await fetchHolidays();
      await loadDynamicData();
    } catch (err) {
      console.error("Error saving holiday:", err);
      alert("Failed to save holiday");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;
    try {
      const { error: err } = await supabase
        .from("holiday_master")
        .update({ is_active: false })
        .eq("id", id);
      if (err) throw err;
      alert("Holiday deleted.");
      await fetchHolidays();
      await loadDynamicData();
    } catch (err) {
      console.error("Error deleting holiday:", err);
      alert("Failed to delete holiday");
    }
  };

  // Leave Ledger Manual Adjustments
  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustForm.employee_id || !adjustForm.amount || !adjustForm.remarks.trim()) {
      alert("Please fill all adjustment details!");
      return;
    }

    try {
      const isCredit = adjustForm.transaction_type === "CREDIT";
      const { error: err } = await supabase
        .from("leave_ledger")
        .insert({
          employee_id: adjustForm.employee_id,
          ledger_date: new Date().toISOString().split("T")[0],
          leave_type: adjustForm.leave_type,
          transaction_type: adjustForm.transaction_type,
          earned: isCredit ? Number(adjustForm.amount) : 0,
          used: !isCredit ? Number(adjustForm.amount) : 0,
          remarks: `Manual Adjustment: ${adjustForm.remarks}`
        });
      if (err) throw err;

      alert("Adjustment recorded successfully.");
      setShowAdjustModal(false);
      setAdjustForm({ employee_id: "", leave_type: "CL", transaction_type: "CREDIT", amount: 1, remarks: "" });
      await fetchLeaveLedger();
      await loadDynamicData();
    } catch (err) {
      console.error("Error recording adjustment:", err);
      alert("Failed to record adjustment");
    }
  };

  // Load and sync all dynamic data
  const loadDynamicData = async () => {
    try {
      const empList = await fetchEmployees();
      const biometricList = await fetchBiometricAttendance(selectedYear, selectedMonth);
      const fieldList = await fetchFieldAttendance(selectedYear, selectedMonth);
      const holidaysList = await fetchHolidays();
      const ledgerList = await fetchLeaveLedger(empList);
      const logList = await fetchFinalizationLogs();
      const finalizedList = await fetchFinalizedAttendance(selectedYear, selectedMonth, empList);

      // Check if current month and company are finalized
      const isMonthFinalized = logList.some(log =>
        log.month === (getMonthNumber(selectedMonth) + 1) &&
        log.year === parseInt(selectedYear) &&
        log.company === selectedCompany
      );

      setIsFinalized(isMonthFinalized);

      // Auto CL Sync
      if (empList.length > 0) {
        await syncMonthlyCLCredits(empList, ledgerList, selectedYear, selectedMonth);
        // Process local draft
        processAttendanceEngine(empList, biometricList, fieldList, holidaysList, ledgerList, selectedYear, selectedMonth);
      }
    } catch (err) {
      console.error("Error loading dynamic data:", err);
    }
  };

  // Trigger loading of data on load and filters change
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await loadDynamicData();
      await fetchManualCorrections();
      setLoading(false);
    };
    loadAll();
  }, [selectedYear, selectedMonth, selectedCompany]);

  // Handle local processing triggers when manual overrides change
  useEffect(() => {
    if (employees.length > 0 && !isFinalized) {
      processAttendanceEngine(employees, biometricAttendance, fieldAttendance, holidays, leaveLedger, selectedYear, selectedMonth);
    }
  }, [manualOverrides]);

  // Filter employees
  let filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedCompany !== "All Companies") {
    filtered = filtered.filter(e => e.company === selectedCompany);
  }

  if (selectedDept !== "All Departments") {
    filtered = filtered.filter(e => e.dept === selectedDept);
  }

  if (activeTab === "biometric") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Office Staff");
  } else if (activeTab === "field") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Field Staff");
  }

  if (selectedType === "Biometric") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Office Staff");
  } else if (selectedType === "Field") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Field Staff");
  }

  const calculateStats = () => {
    let present = 0;
    let absent = 0;
    let onLeave = 0;

    filtered.forEach(emp => {
      const attendance = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
      const summary = calcSummary(attendance);
      present += summary.P;
      absent += summary.A;
      onLeave += summary.CL + summary.EL;
    });

    return {
      totalEmployees: filtered.length,
      present,
      absent,
      onLeave,
      lateArrivals: Math.floor(Math.random() * 3),
      manualCorrections: manualCorrections.length
    };
  };

  const stats = calculateStats();
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const selEmp = employees[selectedEmp];
  const daysOfWeek = getDaysOfWeek(selectedYear, selectedMonth);
  const weekendCols = new Set(daysOfWeek.map((d, i) => (d === "Sun") ? i : -1).filter(i => i >= 0));

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">Attendance Management (Monthly)</h1>
            <p className="text-xs text-slate-500 font-medium">Centralized Processing, Leaves and Ledger Administration</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
              <span>📅</span> {getCurrentDate()}
            </div>

            {currentMainTab === "attendance" && (
              <>
                <AttendanceExcel
                  pageRows={pageRows}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  generateMonthlyAttendance={generateMonthlyAttendance}
                  calcSummary={calcSummary}
                  paidDays={paidDays}
                  getMonthNumber={getMonthNumber}
                  stats={stats}
                />

                <AttendancePDF
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  getCurrentDate={getCurrentDate}
                  stats={stats}
                  selectedCompany={selectedCompany}
                  selectedDept={selectedDept}
                  selectedType={selectedType}
                  selectedStatus={selectedStatus}
                  filtered={filtered}
                  generateMonthlyAttendance={generateMonthlyAttendance}
                  calcSummary={calcSummary}
                  paidDays={paidDays}
                  getMonthNumber={getMonthNumber}
                />
              </>
            )}
          </div>
        </header>

        {/* TAB BAR */}
        <div className="bg-white border-b border-slate-100 px-6 flex shrink-0">
          {[
            { id: "attendance", label: "Attendance Grid", icon: "📅" },
            { id: "ledger", label: "Leave Ledger Dashboard", icon: "🌴" },
            { id: "holidays", label: "Holiday Manager", icon: "🎉" },
            { id: "logs", label: "Finalization Logs", icon: "🔒" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentMainTab(tab.id)}
              className={`py-3.5 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${currentMainTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* TAB 1: ATTENDANCE GRID */}
          {currentMainTab === "attendance" && (
            <>
              {/* LOCKING STATUS BANNER */}
              {isFinalized ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <h4 className="font-bold text-sm">Attendance Finalized & Locked</h4>
                      <p className="text-xs text-emerald-600">The attendance for {selectedMonth} {selectedYear} ({selectedCompany}) is locked and ready for payroll processing.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold py-1 px-2.5 rounded-full">Finalized</span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✍️</span>
                    <div>
                      <h4 className="font-bold text-sm">Attendance Draft (Unsubmitted)</h4>
                      <p className="text-xs text-amber-600">You are reviewing live punches & leave calculations. Click 'Submit & Finalize' to lock records.</p>
                    </div>
                  </div>
                  {selectedCompany !== "All Companies" ? (
                    <button
                      onClick={handleFinalizeAttendance}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all"
                    >
                      🔒 Submit & Finalize
                    </button>
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold italic">Select a specific company to finalize</span>
                  )}
                </div>
              )}

              {/* BULK ACTIONS PANEL (DRAFT ONLY) */}
              {!isFinalized && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold text-base">⚡</span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Bulk Attendance Actions</h4>
                      <p className="text-[10px] text-slate-400">Override status for all filtered employees in a date range</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <input
                      type="date"
                      value={bulkAction.startDate}
                      onChange={e => setBulkAction({ ...bulkAction, startDate: e.target.value })}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="date"
                      value={bulkAction.endDate}
                      onChange={e => setBulkAction({ ...bulkAction, endDate: e.target.value })}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                    <select
                      value={bulkAction.status}
                      onChange={e => setBulkAction({ ...bulkAction, status: e.target.value })}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-semibold text-slate-700"
                    >
                      <option value="P">Present (P)</option>
                      <option value="A">Absent (A)</option>
                      <option value="CL">Casual Leave (CL)</option>
                      <option value="EL">Earned Leave (EL)</option>
                      <option value="LWP">Leave Without Pay (LWP)</option>
                      <option value="WO">Weekly Off (WO)</option>
                      <option value="H">Holiday (H)</option>
                    </select>
                    <button
                      onClick={handleApplyBulkAction}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 rounded-xl transition-all shadow-sm"
                    >
                      Apply Bulk Override
                    </button>
                  </div>
                </div>
              )}

              {/* FILTER BAR */}
              <AttendanceFilters
                search={search}
                setSearch={setSearch}
                setCurrentPage={setCurrentPage}
                selectedCompany={selectedCompany}
                setSelectedCompany={setSelectedCompany}
                companies={companies}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />

              {/* ATTENDANCE GRID + RIGHT PANEL */}
              <div className="flex gap-4">
                <AttendanceTable
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  daysOfWeek={daysOfWeek}
                  weekendCols={weekendCols}
                  pageRows={pageRows}
                  generateMonthlyAttendance={generateMonthlyAttendance}
                  calcSummary={calcSummary}
                  expandedRow={expandedRow}
                  setExpandedRow={setExpandedRow}
                  setSelectedEmp={setSelectedEmp}
                  employees={employees}
                  leaveBalances={leaveBalances}
                  MAX_CL_DAYS={MAX_CL_DAYS}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  editRemark={editRemark}
                  setEditRemark={setEditRemark}
                  editFilePreview={editFilePreview}
                  setEditFilePreview={setEditFilePreview}
                  setEditFile={setEditFile}
                  isFutureDate={isFutureDate}
                  updateAttendanceStatus={updateAttendanceStatus}
                  handleFileUpload={handleFileUpload}
                  biometricAttendance={biometricAttendance}
                  fieldAttendance={fieldAttendance}
                  setSelectedLeaveEmp={setSelectedLeaveEmp}
                  setShowLeaveModal={setShowLeaveModal}
                  setEditModalData={setEditModalData}
                  setShowEditModal={setShowEditModal}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                  filtered={filtered}
                  ROWS_PER_PAGE={ROWS_PER_PAGE}
                  paidDays={paidDays}
                  getMonthNumber={getMonthNumber}
                  setShowDayDetailModal={setShowDayDetailModal}
                  setDayDetailData={setDayDetailData}
                />

                <EmployeeSummaryPanel
                  selEmp={selEmp}
                  selectedEmp={selectedEmp}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  generateMonthlyAttendance={generateMonthlyAttendance}
                  calcSummary={calcSummary}
                  paidDays={paidDays}
                  leaveBalances={leaveBalances}
                  MAX_CL_DAYS={MAX_CL_DAYS}
                  setSelectedLeaveEmp={setSelectedLeaveEmp}
                  setShowLeaveModal={setShowLeaveModal}
                  biometricAttendance={biometricAttendance}
                  fieldAttendance={fieldAttendance}
                  setEditModalData={setEditModalData}
                  setShowEditModal={setShowEditModal}
                />
              </div>

              {/* MANUAL CORRECTIONS + DATA SOURCE */}
              <RecentCorrections
                manualCorrections={manualCorrections}
                biometricAttendance={biometricAttendance}
                fieldAttendance={fieldAttendance}
                employees={employees}
              />
            </>
          )}

          {/* TAB 2: LEAVE LEDGER DASHBOARD */}
          {currentMainTab === "ledger" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Leave Ledger Dashboard</h3>
                  <p className="text-xs text-slate-400">Total Credits, Used leaves, LWP counts and Balances dynamically calculated from transactions ledger.</p>
                </div>
                <button
                  onClick={() => setShowAdjustModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all"
                >
                  ➕ Manual HR Adjustment
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Employee Code</th>
                      <th className="p-4">Employee Name</th>
                      <th className="p-4">CL Credits</th>
                      <th className="p-4">CL Used</th>
                      <th className="p-4">CL Balance</th>
                      <th className="p-4">EL Credits</th>
                      <th className="p-4">EL Used</th>
                      <th className="p-4">EL Balance</th>
                      <th className="p-4">LWP (Current Month)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filtered.map(emp => {
                      const bal = leaveBalances[emp.id] || { earnedCL: 0, usedCL: 0, remainingCL: 0, earnedEL: 0, usedEL: 0, remainingEL: 0, lwpCount: 0 };
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-slate-500">{emp.code}</td>
                          <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                          <td className="p-4 text-violet-600 font-semibold">{bal.earnedCL}</td>
                          <td className="p-4 text-slate-500">{bal.usedCL}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded font-bold ${bal.remainingCL > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                              {bal.remainingCL}
                            </span>
                          </td>
                          <td className="p-4 text-emerald-600 font-semibold">{bal.earnedEL}</td>
                          <td className="p-4 text-slate-500">{bal.usedEL}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded font-bold ${bal.remainingEL > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {bal.remainingEL}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-red-600">{bal.lwpCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Transactions History */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Recent Ledger Transactions</h4>
                <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Employee</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Leave Type</th>
                        <th className="p-3">Transaction</th>
                        <th className="p-3">Earned (Credits)</th>
                        <th className="p-3">Used (Debits)</th>
                        <th className="p-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {leaveLedger.slice(0, 100).map(row => {
                        const emp = employees.find(e => e.id === row.employee_id);
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">{emp ? emp.name : `ID: ${row.employee_id}`}</td>
                            <td className="p-3 font-mono">{row.ledger_date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.leave_type === "CL" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                {row.leave_type}
                              </span>
                            </td>
                            <td className="p-3 font-bold">
                              <span className={`text-[10px] uppercase font-black ${row.transaction_type === "CREDIT" ? "text-emerald-600" : "text-red-500"
                                }`}>
                                {row.transaction_type}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-emerald-600">{row.earned || 0}</td>
                            <td className="p-3 font-bold text-red-500">{row.used || 0}</td>
                            <td className="p-3 text-slate-500 italic">{row.remarks}</td>
                          </tr>
                        );
                      })}
                      {leaveLedger.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 italic">No ledger transaction logs found. Please run DDL.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOLIDAY MANAGER */}
          {currentMainTab === "holidays" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Holiday Master</h3>
                  <p className="text-xs text-slate-400">Manage organizational holidays which auto-reflect in the attendance processing engine.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingHoliday(null);
                    setHolidayForm({ holiday_name: "", holiday_date: "", holiday_type: "National" });
                    setShowHolidayModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all"
                >
                  ➕ Add New Holiday
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Holiday Name</th>
                      <th className="p-4">Holiday Date</th>
                      <th className="p-4">Holiday Type</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {holidays.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-850">{h.holiday_name}</td>
                        <td className="p-4 font-mono text-slate-500">{h.holiday_date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.holiday_type === "National" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"
                            }`}>
                            {h.holiday_type}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingHoliday(h);
                              setHolidayForm({ holiday_name: h.holiday_name, holiday_date: h.holiday_date, holiday_type: h.holiday_type });
                              setShowHolidayModal(true);
                            }}
                            className="text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {holidays.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-400 italic">No holidays configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FINALIZATION LOGS */}
          {currentMainTab === "logs" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-slate-800 text-base">Finalization Audit Logs</h3>
                <p className="text-xs text-slate-400">Lock history showing which company's attendance was finalized and by whom.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Company Name</th>
                      <th className="p-4">Year</th>
                      <th className="p-4">Month</th>
                      <th className="p-4">Finalized By</th>
                      <th className="p-4">Finalized On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {finalizationLogs.map(log => {
                      const months = [
                        "January", "February", "March", "April",
                        "May", "June", "July", "August",
                        "September", "October", "November", "December"
                      ];
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-800">{log.company}</td>
                          <td className="p-4 font-mono">{log.year}</td>
                          <td className="p-4">{months[log.month - 1]}</td>
                          <td className="p-4 text-indigo-600">{log.finalized_by}</td>
                          <td className="p-4 font-mono text-slate-500">{new Date(log.submitted_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {finalizationLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400 italic">No finalization audit logs found. Please run DDL.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* HOLIDAY MODAL */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl border border-slate-100 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-800 mb-4">{editingHoliday ? "✏️ Edit Holiday" : "🎉 Add New Holiday"}</h3>
            <form onSubmit={handleSaveHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={holidayForm.holiday_name}
                  onChange={e => setHolidayForm({ ...holidayForm, holiday_name: e.target.value })}
                  placeholder="e.g. Independence Day"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={holidayForm.holiday_date}
                  onChange={e => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Type</label>
                <select
                  value={holidayForm.holiday_type}
                  onChange={e => setHolidayForm({ ...holidayForm, holiday_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  <option value="National">National Holiday</option>
                  <option value="Festival">Festival Holiday</option>
                  <option value="Special">Special Holiday</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Save Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4">➕ Manual HR Adjustment</h3>
            <form onSubmit={handleAddAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Select Employee
                </label>

                <Select
                  showSearch
                  placeholder="Search Employee"
                  value={adjustForm.employee_id || undefined}
                  onChange={(value) =>
                    setAdjustForm({ ...adjustForm, employee_id: value })
                  }
                  className="w-full"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option?.children
                      ?.toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {employees.map((e) => (
                    <Select.Option key={e.id} value={e.id}>
                      {e.code} - {e.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Leave Type</label>
                  <select
                    value={adjustForm.leave_type}
                    onChange={e => setAdjustForm({ ...adjustForm, leave_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="EL">Earned Leave (EL)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Adjustment Type</label>
                  <select
                    value={adjustForm.transaction_type}
                    onChange={e => setAdjustForm({ ...adjustForm, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                  >
                    <option value="CREDIT">Credit (Add)</option>
                    <option value="DEBIT">Debit (Subtract)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (Days)</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Adjustment Remarks</label>
                <textarea
                  required
                  rows="2"
                  value={adjustForm.remarks}
                  onChange={e => setAdjustForm({ ...adjustForm, remarks: e.target.value })}
                  placeholder="e.g. Crediting compensation leave or correction of errors"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Apply Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      <LeaveModal
        showLeaveModal={showLeaveModal}
        selectedLeaveEmp={selectedLeaveEmp}
        setShowLeaveModal={setShowLeaveModal}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        leaveDays={leaveDays}
        setLeaveDays={setLeaveDays}
        leaveReason={leaveReason}
        setLeaveReason={setLeaveReason}
        leaveBalances={leaveBalances}
        MAX_CL_DAYS={MAX_CL_DAYS}
        applyLeave={applyLeave}
      />

      {/* EDIT ATTENDANCE MODAL */}
      <EditAttendanceModal
        showEditModal={showEditModal}
        editModalData={editModalData}
        setShowEditModal={setShowEditModal}
        setEditModalData={setEditModalData}
        editRemark={editRemark}
        setEditRemark={setEditRemark}
        editFilePreview={editFilePreview}
        setEditFilePreview={setEditFilePreview}
        setEditFile={setEditFile}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        getMonthNumber={getMonthNumber}
        isFutureDate={isFutureDate}
        generateMonthlyAttendance={generateMonthlyAttendance}
        handleFileUpload={handleFileUpload}
        updateAttendanceStatus={updateAttendanceStatus}
      />

      {/* DAY DETAIL MODAL */}
      <DayDetailModal
        show={showDayDetailModal}
        onClose={() => {
          setShowDayDetailModal(false);
          setDayDetailData({ employee: null, date: null, status: null });
        }}
        employee={dayDetailData.employee}
        date={dayDetailData.date}
        status={dayDetailData.status}
        biometricAttendance={biometricAttendance}
        fieldAttendance={fieldAttendance}
        onEdit={(emp, date, currentStatus) => {
          const [year, month, day] = date.split("-");
          const dayIndex = parseInt(day) - 1;
          setEditModalData({
            employee: emp,
            date: date,
            currentStatus: currentStatus,
            dayIndex: dayIndex
          });
          setShowEditModal(true);
        }}
      />
    </div>
  );
}