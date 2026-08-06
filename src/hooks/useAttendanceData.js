import { useState, useEffect, useMemo } from "react";
import supabase from "../utils/supabase";
import {
  calcSummary,
  paidDays,
  getMonthNumber,
  parseTimeToMinutes
} from "../utils/attendanceHelpers";

export default function useAttendanceData() {
  // States for real data
  const [employees, setEmployees] = useState([]);
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
  const [bulkAction, setBulkAction] = useState({ employeeId: "ALL", startDate: "", endDate: "", status: "P", remark: "" });

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
      let joiningData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: joiningError } = await supabase
          .from("joining")
          .select("id, name_as_per_aadhar, firm_name, attendance_type, rbp_joining_id, department, designation, status, employee_category, date_of_joining, leaving_date, gender")
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
          status: join.status || "Active",
          gender: join.gender || ""
        };
      });

      setEmployees(empList);
      return empList;
    } catch (err) {
      console.error("Error fetching employees:", err);
      return [];
    }
  };

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

      const groupedData = {};
      allData.forEach(record => {
        if (!record.employee_id || !record.attendance_date) return;
        const empId = record.employee_id.toString().trim().toUpperCase();
        const attDate = record.attendance_date.toString().trim().split(" ")[0].split("T")[0];
        const key = `${empId}_${attDate}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            employeeCode: empId,
            employeeName: record.employee_name,
            date: attDate,
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

        allTimes.sort((a, b) => a.localeCompare(b));

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

  const fetchManualCorrections = async (employeesList = employees) => {
    try {
      let allData = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("attendance")
          .select("*")
          .eq("approved_status", "corrected")
          .order("id", { ascending: true })
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

      const corrections = (allData || []).map(record => ({
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

      const overrides = {};
      corrections.forEach(c => {
        const status = c.next;
        const dateStr = c.date;
        if (!dateStr) return;

        const codeStr = c.code ? String(c.code).trim() : "";
        const empStr = c.emp ? String(c.emp).trim() : "";

        // Find employee object in employeesList to map by id, code, and name
        const matchedEmp = (employeesList || []).find(e =>
          (codeStr && (String(e.code || "").trim().toLowerCase() === codeStr.toLowerCase() || String(e.id) === codeStr)) ||
          (empStr && String(e.name || "").trim().toLowerCase() === empStr.toLowerCase())
        );

        const keysToSet = new Set();
        if (codeStr) keysToSet.add(codeStr);
        if (empStr) keysToSet.add(empStr);
        if (matchedEmp) {
          if (matchedEmp.id) keysToSet.add(String(matchedEmp.id));
          if (matchedEmp.code) keysToSet.add(String(matchedEmp.code).trim());
          if (matchedEmp.name) keysToSet.add(String(matchedEmp.name).trim());
        }

        keysToSet.forEach(key => {
          if (!overrides[key]) overrides[key] = {};
          overrides[key][dateStr] = status;
        });
      });

      setManualOverrides(prev => ({ ...prev, ...overrides }));
      return overrides;
    } catch (err) {
      console.error("Error fetching corrections:", err);
      return {};
    }
  };

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

  const syncMonthlyCLCredits = async (employeesList, ledgerRows, yearNum, monthName) => {
    try {
      const selectedMonthNum = getMonthNumber(monthName) + 1;

      const fyStartYear = selectedMonthNum >= 4 ? parseInt(yearNum) : parseInt(yearNum) - 1;

      const eligibleMonths = [];

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

      // Create a Set of existing credit keys for O(1) lookup
      const existingCreditsSet = new Set();
      ledgerRows.forEach(row => {
        if (row.employee_id && row.leave_type === "CL" && row.transaction_type === "CREDIT" && row.remarks) {
          existingCreditsSet.add(`${row.employee_id}_${row.remarks}`);
        }
      });

      for (const emp of employeesList) {
        if (emp.status && emp.status.toLowerCase() !== "active") continue;

        const dojStr = emp.dateOfJoining;
        const doj = dojStr ? new Date(dojStr) : null;

        for (const target of eligibleMonths) {
          const firstDayOfTarget = new Date(target.year, target.month - 1, 1);

          if (doj && (firstDayOfTarget.getFullYear() < doj.getFullYear() ||
            (firstDayOfTarget.getFullYear() === doj.getFullYear() && firstDayOfTarget.getMonth() < doj.getMonth()))) {
            continue;
          }

          const targetMonthName = monthsNames[target.month - 1];
          const remarkKey = `Auto Monthly Credit - ${targetMonthName} ${target.year}`;

          const alreadyCredited = existingCreditsSet.has(`${emp.id}_${remarkKey}`);

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
          await fetchLeaveLedger();
        }
      }
    } catch (err) {
      console.error("Error in syncMonthlyCLCredits:", err);
    }
  };

  const processAttendanceEngine = (employeesList, biometricList, fieldList, holidaysList, ledgerList, yearVal, monthName, currentOverrides = manualOverrides) => {
    const monthIndex = getMonthNumber(monthName);
    const daysInMonth = new Date(parseInt(yearVal), monthIndex + 1, 0).getDate();

    const draftStatus = {};
    const draftDetails = {};
    const localBalances = {};

    // Group ledgerList by employee_id for O(1) retrieval
    const ledgerMap = new Map();
    ledgerList.forEach(row => {
      if (row.employee_id) {
        const key = row.employee_id.toString();
        if (!ledgerMap.has(key)) {
          ledgerMap.set(key, []);
        }
        ledgerMap.get(key).push(row);
      }
    });

    // Group biometricList by employeeCode and employeeName for O(1) retrieval
    const biometricByCodeDateMap = new Map();
    const biometricByNameDateMap = new Map();
    biometricList.forEach(b => {
      const date = b.date;
      if (b.employeeCode && date) {
        biometricByCodeDateMap.set(`${b.employeeCode.toString().trim().toLowerCase()}_${date}`, b);
      }
      if (b.employeeName && date) {
        biometricByNameDateMap.set(`${b.employeeName.toString().trim().toLowerCase()}_${date}`, b);
      }
    });

    // Group fieldList by employeeCode and employeeName for O(1) retrieval
    const fieldByCodeDateMap = new Map();
    const fieldByNameDateMap = new Map();
    fieldList.forEach(f => {
      const date = f.date;
      if (f.employeeCode && date) {
        fieldByCodeDateMap.set(`${f.employeeCode.toString().trim().toLowerCase()}_${date}`, f);
      }
      if (f.employeeName && date) {
        fieldByNameDateMap.set(`${f.employeeName.toString().trim().toLowerCase()}_${date}`, f);
      }
    });

    // Map holidaysList by date for O(1) retrieval
    const holidayMap = new Map();
    holidaysList.forEach(h => {
      if (h.holiday_date) {
        holidayMap.set(h.holiday_date, h);
      }
    });

    const selectedMonthNum = monthIndex + 1;
    const fyStartYear = selectedMonthNum >= 4 ? parseInt(yearVal) : parseInt(yearVal) - 1;
    const fyStartDateStr = `${fyStartYear}-04-01`;
    const targetMonthEndStr = `${yearVal}-${String(selectedMonthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    employeesList.forEach(emp => {
      const empLedger = ledgerMap.get(emp.id?.toString()) || [];

      const totalClCredits = empLedger
        .filter(row =>
          row.leave_type === "CL" &&
          (row.transaction_type === "CREDIT" || (row.transaction_type === "ADJUSTMENT" && row.earned > 0)) &&
          row.ledger_date >= fyStartDateStr &&
          row.ledger_date <= targetMonthEndStr
        )
        .reduce((sum, row) => sum + Number(row.earned || 0), 0);

      const totalClDebits = empLedger
        .filter(row =>
          row.leave_type === "CL" &&
          (row.transaction_type === "DEBIT" || (row.transaction_type === "ADJUSTMENT" && row.used > 0)) &&
          row.ledger_date >= fyStartDateStr &&
          row.ledger_date <= targetMonthEndStr
        )
        .reduce((sum, row) => sum + Number(row.used || 0), 0);

      localBalances[emp.id] = {
        earnedCL: totalClCredits,
        usedCL: totalClDebits,
        remainingCL: totalClCredits - totalClDebits,
        lwpCount: 0
      };
    });

    setLeaveBalances(localBalances);

    employeesList.forEach(emp => {
      const empStatusArray = new Array(daysInMonth).fill("A");
      const empDetailsArray = [];

      const empLedger = ledgerMap.get(emp.id?.toString()) || [];
      const targetMonthStartStr = `${yearVal}-${String(monthIndex + 1).padStart(2, "0")}-01`;

      const clDebitsPrior = empLedger
        .filter(row => row.leave_type === "CL" && (row.transaction_type === "DEBIT" || row.used > 0) && row.ledger_date < targetMonthStartStr)
        .reduce((sum, row) => sum + Number(row.used || 0), 0);
      let runningCLBalance = localBalances[emp.id].earnedCL - clDebitsPrior;

      let lateCount = 0;
      let lwpCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yearVal}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayDate = new Date(parseInt(yearVal), monthIndex, d);
        const dayOfWeek = dayDate.getDay();

        let status = "A";
        let inTime = null;
        let outTime = null;
        let isLate = false;
        let isHalfDay = false;
        let isPunchMissing = false;
        let remarks = "";
        let source = "biometric";

        const doj = emp.dateOfJoining ? new Date(emp.dateOfJoining) : null;
        const dol = emp.dateOfLeaving ? new Date(emp.dateOfLeaving) : null;

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

        const manualOverride =
          (emp.code && currentOverrides[emp.code]?.[dateStr]) ||
          (emp.id && currentOverrides[emp.id]?.[dateStr]) ||
          (emp.name && currentOverrides[emp.name]?.[dateStr]);

        if (manualOverride) {
          status = manualOverride;
          remarks = "Manual Override";
          source = "manual";

          if (status === "CL") {
            runningCLBalance--;
          } else if (status === "LWP") {
            lwpCount++;
          }
        } else {
          const holidayMatch = holidayMap.get(dateStr);

          if (holidayMatch) {
            status = "H";
            remarks = holidayMatch.holiday_name;
          }
          else {
            const empCodeLower = emp.code?.toString().trim().toLowerCase();
            const empNameLower = emp.name?.toString().trim().toLowerCase();
            const codeKey = `${empCodeLower}_${dateStr}`;
            const nameKey = `${empNameLower}_${dateStr}`;

            const fRecord = fieldByCodeDateMap.get(codeKey) || fieldByNameDateMap.get(nameKey) || null;
            const fieldCL = (fRecord && fRecord.status === "CL") ? fRecord : null;

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
              let record = null;

              if (emp.employeeCategory?.trim() === "Office Staff") {
                record = biometricByCodeDateMap.get(codeKey) || biometricByNameDateMap.get(nameKey) || null;
                source = "biometric";
              } else {
                const fNormalRecord = (fRecord && fRecord.status !== "CL") ? fRecord : null;
                record = fNormalRecord;
                source = "field";
              }

              if (record && (record.inTime || record.outTime)) {
                inTime = record.inTime;
                outTime = record.outTime;

                if (inTime && outTime) {
                  status = "P";
                  remarks = "Present";
                } else {
                  status = "HD";
                  isHalfDay = true;
                  isPunchMissing = true;
                  remarks = "Punch Missing";
                }
              } else {
                if (dayOfWeek === 0) {
                  status = "WO";
                  remarks = "Weekly Off";
                } else {
                  status = "A";
                  remarks = "Absent";
                }
              }
            }
          }
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
          lateCountVal: status === "P" && isLate ? lateCount : (status === "HD" && isLate ? lateCount : 0)
        });
      }

      draftStatus[emp.id] = empStatusArray;
      draftDetails[emp.id] = empDetailsArray;

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

  const generateMonthlyAttendance = (employee, year, month) => {
    const monthNum = getMonthNumber(month);
    const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();

    const getDefaultStatusForDay = (d) => {
      const dayDate = new Date(parseInt(year), monthNum, d);
      return dayDate.getDay() === 0 ? "WO" : "A";
    };

    if (isFinalized) {
      const arr = new Array(daysInMonth);
      for (let d = 1; d <= daysInMonth; d++) {
        arr[d - 1] = getDefaultStatusForDay(d);
      }
      const empFinalRecords = (employee.id && finalizedAttendanceMap.get(employee.id.toString())) || [];

      empFinalRecords.forEach(r => {
        if (r.attendance_date) {
          const d = new Date(r.attendance_date).getDate();
          if (d >= 1 && d <= daysInMonth) {
            const dayDate = new Date(parseInt(year), monthNum, d);
            const isSunday = dayDate.getDay() === 0;
            if (isSunday && r.status === "A") {
              arr[d - 1] = "WO";
            } else {
              arr[d - 1] = r.status;
            }
          }
        }
      });
      return arr;
    } else {
      if (processedDraft[employee.id]) {
        return processedDraft[employee.id];
      }
      const arr = new Array(daysInMonth);
      for (let d = 1; d <= daysInMonth; d++) {
        arr[d - 1] = getDefaultStatusForDay(d);
      }
      return arr;
    }
  };

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

      if (isFinalized) {
        await supabase
          .from("final_attendance")
          .update({ status: newStatus, remarks: editRemark })
          .eq("employee_id", employee.id)
          .eq("attendance_date", date);
      }

      setManualOverrides(prev => {
        const next = { ...prev };
        if (employee.code) {
          if (!next[employee.code]) next[employee.code] = {};
          next[employee.code][date] = newStatus;
        }
        if (employee.id) {
          if (!next[employee.id]) next[employee.id] = {};
          next[employee.id][date] = newStatus;
        }
        if (employee.name) {
          if (!next[employee.name]) next[employee.name] = {};
          next[employee.name][date] = newStatus;
        }
        return next;
      });

      await loadDynamicData();

      alert(`Attendance updated to ${newStatus} for ${employee.name} on ${date}`);

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

  const handleApplyBulkAction = async () => {
    if (!bulkAction.startDate || !bulkAction.endDate) {
      alert("Please select both Start Date and End Date!");
      return;
    }
    const start = new Date(bulkAction.startDate + "T00:00:00");
    const end = new Date(bulkAction.endDate + "T00:00:00");
    if (start > end) {
      alert("Start Date cannot be after End Date!");
      return;
    }

    if (!bulkAction.remark || !bulkAction.remark.trim()) {
      alert("Please enter a remark for the bulk attendance override!");
      return;
    }

    let targetEmps = filtered;
    if (bulkAction.employeeId && bulkAction.employeeId !== "ALL") {
      targetEmps = employees.filter(e => e.code === bulkAction.employeeId || String(e.id) === String(bulkAction.employeeId));
    }

    if (!targetEmps || targetEmps.length === 0) {
      alert("No employees selected for bulk update!");
      return;
    }

    const dates = [];
    let curr = new Date(start);
    while (curr <= end) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, "0");
      const dd = String(curr.getDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
      curr.setDate(curr.getDate() + 1);
    }

    try {
      setLoading(true);
      const rowsToInsert = [];
      const overrides = { ...manualOverrides };
      const remarkText = bulkAction.remark.trim();

      targetEmps.forEach(emp => {
        if (emp.code && !overrides[emp.code]) overrides[emp.code] = {};
        if (emp.id && !overrides[emp.id]) overrides[emp.id] = {};
        if (emp.name && !overrides[emp.name]) overrides[emp.name] = {};

        dates.forEach(dateStr => {
          if (emp.code) overrides[emp.code][dateStr] = bulkAction.status;
          if (emp.id) overrides[emp.id][dateStr] = bulkAction.status;
          if (emp.name) overrides[emp.name][dateStr] = bulkAction.status;

          rowsToInsert.push({
            person_name: emp.name,
            employee_code: emp.code,
            date: dateStr,
            status: bulkAction.status,
            approved_status: "corrected",
            remark: remarkText,
            timestamp: new Date().toISOString()
          });
        });
      });

      const CHUNK_SIZE = 500;
      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
        const { error: insertErr } = await supabase
          .from("attendance")
          .insert(chunk);

        if (insertErr) throw insertErr;
      }

      setManualOverrides(overrides);

      alert(`Successfully saved bulk attendance for ${targetEmps.length} employee(s) over ${dates.length} day(s) (${rowsToInsert.length} record(s)) to Database!`);

      await loadDynamicData();
    } catch (err) {
      console.error("Error saving bulk attendance:", err);
      alert(`Error saving to database: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

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

      const finalRows = [];
      const ledgerEntries = [];

      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

      const companyEmployees = employees.filter(e => e.company === selectedCompany);

      companyEmployees.forEach(emp => {
        const statuses = processedDraft[emp.id] || [];
        const details = processedDraftDetails[emp.id] || [];

        for (let d = 1; d <= daysInMonth; d++) {
          const status = statuses[d - 1];
          const detail = details[d - 1];
          if (!status) continue;

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
          }
        }
      });

      const { error: finalError } = await supabase
        .from("final_attendance")
        .insert(finalRows);
      if (finalError) throw finalError;

      if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabase
          .from("leave_ledger")
          .insert(ledgerEntries);
        if (ledgerError) throw ledgerError;
      }

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

  const loadDynamicData = async () => {
    try {
      const empList = await fetchEmployees();
      
      const [
        biometricList,
        fieldList,
        holidaysList,
        ledgerList,
        logList,
        finalizedList,
        correctionsOverrides
      ] = await Promise.all([
        fetchBiometricAttendance(selectedYear, selectedMonth),
        fetchFieldAttendance(selectedYear, selectedMonth),
        fetchHolidays(),
        fetchLeaveLedger(empList),
        fetchFinalizationLogs(),
        fetchFinalizedAttendance(selectedYear, selectedMonth, empList),
        fetchManualCorrections(empList)
      ]);

      const isMonthFinalized = logList.some(log =>
        log.month === (getMonthNumber(selectedMonth) + 1) &&
        log.year === parseInt(selectedYear) &&
        log.company === selectedCompany
      );

      setIsFinalized(isMonthFinalized);

      if (empList.length > 0) {
        await syncMonthlyCLCredits(empList, ledgerList, selectedYear, selectedMonth);
        processAttendanceEngine(empList, biometricList, fieldList, holidaysList, ledgerList, selectedYear, selectedMonth, correctionsOverrides);
      }
    } catch (err) {
      console.error("Error loading dynamic data:", err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await loadDynamicData();
      setLoading(false);
    };
    loadAll();
  }, [selectedYear, selectedMonth, selectedCompany]);

  useEffect(() => {
    if (employees.length > 0 && !isFinalized) {
      processAttendanceEngine(employees, biometricAttendance, fieldAttendance, holidays, leaveLedger, selectedYear, selectedMonth, manualOverrides);
    }
  }, [manualOverrides]);

  // Group finalizedAttendance by employee identifier for O(1) lookups
  const finalizedAttendanceMap = useMemo(() => {
    const map = new Map();
    finalizedAttendance.forEach(r => {
      if (r.employee_id) {
        const key = r.employee_id.toString();
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(r);
      }
    });
    return map;
  }, [finalizedAttendance]);

  // Derived/computed properties
  const companies = useMemo(() => {
    let list = employees.filter(e =>
      e.status?.toLowerCase() !== "inactive" &&
      e.status?.toLowerCase() !== "in-active"
    );

    if (activeTab === "biometric") {
      list = list.filter(e => e.employeeCategory?.trim() === "Office Staff");
    } else if (activeTab === "field") {
      list = list.filter(e => e.employeeCategory?.trim() === "Field Staff");
    }

    const unique = [...new Set(list.map(e => e.company).filter(c => c && c !== "N/A"))];
    return unique.sort();
  }, [employees, activeTab]);

  const filtered = useMemo(() => {
    let list = employees.filter(e =>
      (e.name?.toLowerCase().includes(search.toLowerCase()) ||
       e.code?.toLowerCase().includes(search.toLowerCase())) &&
      e.status?.toLowerCase() !== "inactive" &&
      e.status?.toLowerCase() !== "in-active"
    );

    if (selectedCompany !== "All Companies") {
      list = list.filter(e => e.company === selectedCompany);
    }

    if (selectedDept !== "All Departments") {
      list = list.filter(e => e.dept === selectedDept);
    }

    if (activeTab === "biometric") {
      list = list.filter(e => e.employeeCategory?.trim() === "Office Staff");
    } else if (activeTab === "field") {
      list = list.filter(e => e.employeeCategory?.trim() === "Field Staff");
    }

    if (selectedType === "Biometric") {
      list = list.filter(e => e.employeeCategory?.trim() === "Office Staff");
    } else if (selectedType === "Field") {
      list = list.filter(e => e.employeeCategory?.trim() === "Field Staff");
    }

    return list;
  }, [employees, search, selectedCompany, selectedDept, activeTab, selectedType]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let onLeave = 0;

    filtered.forEach(emp => {
      const attendance = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
      const summary = calcSummary(attendance);
      present += summary.P;
      absent += summary.A;
      onLeave += summary.CL;
    });

    return {
      totalEmployees: filtered.length,
      present,
      absent,
      onLeave,
      lateArrivals: 0,
      manualCorrections: manualCorrections.length
    };
  }, [filtered, selectedYear, selectedMonth, isFinalized, finalizedAttendance, processedDraft, manualCorrections.length]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const selEmp = employees[selectedEmp];
  const daysOfWeek = getDaysOfWeek(selectedYear, selectedMonth);
  const weekendCols = new Set(daysOfWeek.map((d, i) => (d === "Sun") ? i : -1).filter(i => i >= 0));

  return {
    employees, setEmployees,
    companies,
    fieldAttendance, setFieldAttendance,
    biometricAttendance, setBiometricAttendance,
    loading, setLoading,
    error, setError,
    manualCorrections, setManualCorrections,
    currentMainTab, setCurrentMainTab,
    holidays, setHolidays,
    leaveLedger, setLeaveLedger,
    finalizationLogs, setFinalizationLogs,
    finalizedAttendance, setFinalizedAttendance,
    isFinalized, setIsFinalized,
    processedDraft, setProcessedDraft,
    processedDraftDetails, setProcessedDraftDetails,
    manualOverrides, setManualOverrides,
    showHolidayModal, setShowHolidayModal,
    editingHoliday, setEditingHoliday,
    holidayForm, setHolidayForm,
    showAdjustModal, setShowAdjustModal,
    adjustForm, setAdjustForm,
    bulkAction, setBulkAction,
    showEditModal, setShowEditModal,
    editModalData, setEditModalData,
    showDayDetailModal, setShowDayDetailModal,
    dayDetailData, setDayDetailData,
    expandedRow, setExpandedRow,
    selectedEmp, setSelectedEmp,
    search, setSearch,
    currentPage, setCurrentPage,
    activeTab, setActiveTab,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    selectedCompany, setSelectedCompany,
    selectedDept, setSelectedDept,
    selectedType, setSelectedType,
    selectedStatus, setSelectedStatus,
    editingCell, setEditingCell,
    editRemark, setEditRemark,
    editFile, setEditFile,
    editFilePreview, setEditFilePreview,
    leaveBalances, setLeaveBalances,
    showLeaveModal, setShowLeaveModal,
    selectedLeaveEmp, setSelectedLeaveEmp,
    leaveType, setLeaveType,
    leaveDays, setLeaveDays,
    leaveReason, setLeaveReason,
    ROWS_PER_PAGE,
    MAX_CL_DAYS,
    getCurrentDate,
    fetchEmployees,
    formatTime12hr,
    fetchBiometricAttendance,
    fetchFieldAttendance,
    fetchManualCorrections,
    fetchHolidays,
    fetchLeaveLedger,
    fetchFinalizationLogs,
    fetchFinalizedAttendance,
    syncMonthlyCLCredits,
    processAttendanceEngine,
    applyLeave,
    getDaysOfWeek,
    isFutureDate,
    generateMonthlyAttendance,
    updateAttendanceStatus,
    handleFileUpload,
    handleApplyBulkAction,
    handleFinalizeAttendance,
    handleSaveHoliday,
    handleDeleteHoliday,
    handleAddAdjustment,
    loadDynamicData,
    filtered,
    stats,
    totalPages,
    pageRows,
    selEmp,
    daysOfWeek,
    weekendCols
  };
}
