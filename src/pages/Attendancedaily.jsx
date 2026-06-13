import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Filter,
  Calendar,
  Users,
  UserCheck,
  UserMinus,
  TrendingUp,
  LayoutDashboard,
  Fingerprint,
  Map,
  Coffee,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  Database,
  Smartphone,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../utils/supabase";

// Helper Functions
const calculateDuration = (inTime, outTime) => {
  if (!inTime || !outTime) return "N/A";
  try {
    const [inHours, inMinutes] = inTime.split(":").map(Number);
    const [outHours, outMinutes] = outTime.split(":").map(Number);
    let totalMinutes = outHours * 60 + outMinutes - (inHours * 60 + inMinutes);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    return "N/A";
  }
};

// Add this function
const fetchEmployeeIds = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("name_as_per_aadhar, rbp_joining_id");

    if (error) throw error;

    const mapping = {};
    (data || []).forEach((emp) => {
      if (emp.name_as_per_aadhar) {
        mapping[emp.name_as_per_aadhar.toLowerCase()] = emp.rbp_joining_id;
      }
    });
    setEmployeeIdMap(mapping);
  } catch (error) {
    console.error("Error fetching employee IDs:", error);
  }
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <CheckCircle className="w-3 h-3" />
          Present
        </span>
      );
    case "absent":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
          <AlertCircle className="w-3 h-3" />
          Absent
        </span>
      );
    case "late":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
          <ClockIcon className="w-3 h-3" />
          Late
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
          <ClockIcon className="w-3 h-3" />
          Partial
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 shadow-sm">
          {status || "N/A"}
        </span>
      );
  }
};

const Attendancedaily = () => {
  // Existing States
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [uniqueNames, setUniqueNames] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [uniqueYears, setUniqueYears] = useState([]);
  const [showTodayData, setShowTodayData] = useState(false);
  const [employeeIdMap, setEmployeeIdMap] = useState({});

  // New States for Attendance Editing
  const [selectedEditItem, setSelectedEditItem] = useState(null);
  const [editInTime, setEditInTime] = useState("");
  const [editMidTime, setEditMidTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");
  const [editRemark, setEditRemark] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditModal = (item) => {
    setSelectedEditItem(item);
    setEditInTime(item.inTime || "");
    setEditMidTime(item.midEntries && item.midEntries.length > 0 ? item.midEntries[0] : "");
    setEditOutTime(item.outTime || "");
    setEditRemark("");
  };

  const handleCloseEditModal = () => {
    setSelectedEditItem(null);
    setEditInTime("");
    setEditMidTime("");
    setEditOutTime("");
    setEditRemark("");
  };

  const handleSaveAttendanceEdit = async () => {
    if (!editRemark.trim()) {
      alert("Remark is required!");
      return;
    }
    
    setIsSavingEdit(true);
    try {
      const userStr = localStorage.getItem("user");
      const loggedInUser = userStr ? JSON.parse(userStr) : null;
      const username = loggedInUser?.username || "Admin";
      
      const currentDateTime = new Date().toLocaleString();
      const currentTimestamp = new Date().toISOString();
      const formatToHHMMSS = (t) => {
        if (!t) return null;
        if (t.split(":").length === 2) return `${t}:00`;
        return t;
      };

      if (selectedEditItem.type === "biometric") {
        // 1. Update offline_biometric_punch table
        const { error: bioError } = await supabase
          .from("offline_biometric_punch")
          .update({
            in_time: formatToHHMMSS(editInTime),
            out_time: formatToHHMMSS(editOutTime),
            remark: editRemark,
            updated_by: username,
            updated_at: currentTimestamp
          })
          .eq("employee_id", selectedEditItem.employeeId)
          .eq("attendance_date", selectedEditItem.date);

        if (bioError) throw bioError;

        // 2. Insert correction log into attendance table
        const [year, month] = selectedEditItem.date.split("-");
        const monthName = new Date(selectedEditItem.date).toLocaleString("default", { month: "long" });

        const { error: attError } = await supabase
          .from("attendance")
          .insert({
            person_name: selectedEditItem.employee,
            date: selectedEditItem.date,
            status: "corrected",
            approved_status: "corrected",
            reason: `${editRemark} (Updated by: ${username} at ${currentDateTime})`,
            timestamp: currentTimestamp,
            year_name: year,
            month_name: monthName,
            updated_by: username,
            updated_at: currentTimestamp,
            remark: editRemark
          });
        if (attError) console.error("Error inserting biometric correction log:", attError);
      } else {
        // Field Staff type
        const [year, month] = selectedEditItem.date.split("-");
        const monthName = new Date(selectedEditItem.date).toLocaleString("default", { month: "long" });

        // Helper to insert, update or delete a status
        const updateStatusRow = async (status, newTime, originalTime) => {
          const formatted = formatToHHMMSS(newTime);
          if (originalTime) {
            if (!newTime) {
              // User cleared the time -> Delete the row
              const { error } = await supabase
                .from("attendance")
                .delete()
                .eq("person_name", selectedEditItem.employee)
                .eq("date", selectedEditItem.date)
                .eq("status", status);
              if (error) throw error;
            } else if (newTime !== originalTime) {
              // User changed the time -> Update the row
              const { error } = await supabase
                .from("attendance")
                .update({
                  time: formatted,
                  reason: `${editRemark} (Updated by: ${username} at ${currentDateTime})`,
                  approved_status: "corrected",
                  timestamp: currentTimestamp,
                  updated_by: username,
                  updated_at: currentTimestamp,
                  remark: editRemark
                })
                .eq("person_name", selectedEditItem.employee)
                .eq("date", selectedEditItem.date)
                .eq("status", status);
              if (error) throw error;
            }
          } else {
            if (newTime) {
              // User added a new time -> Insert a new row
              const { error } = await supabase
                .from("attendance")
                .insert({
                  person_name: selectedEditItem.employee,
                  date: selectedEditItem.date,
                  status: status,
                  time: formatted,
                  reason: `${editRemark} (Updated by: ${username} at ${currentDateTime})`,
                  approved_status: "corrected",
                  timestamp: currentTimestamp,
                  year_name: year,
                  month_name: monthName,
                  updated_by: username,
                  updated_at: currentTimestamp,
                  remark: editRemark
                });
              if (error) throw error;
            }
          }
        };

        // Handle IN, MID, and OUT times
        await updateStatusRow("IN", editInTime, selectedEditItem.inTime);
        await updateStatusRow("MID", editMidTime, selectedEditItem.midEntries && selectedEditItem.midEntries.length > 0 ? selectedEditItem.midEntries[0] : null);
        await updateStatusRow("OUT", editOutTime, selectedEditItem.outTime);
      }

      alert("Attendance updated successfully!");
      handleCloseEditModal();
      
      // Refresh data
      fetchAttendanceData(1, false, {
        year: selectedYear,
        month: selectedMonth,
        name: selectedName,
      });
      fetchFieldAttendance();
    } catch (err) {
      console.error("Error saving attendance edit:", err);
      alert("Failed to save changes: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // New States for merged functionality
  const [attendanceType, setAttendanceType] = useState("all");
  const [statusFilter, setStatusFilter] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [fieldRecords, setFieldRecords] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeModalCard, setActiveModalCard] = useState(null);
  const [modalSearch, setModalSearch] = useState("");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    biometricPresent: 0,
    fieldActive: 0,
    absent: 0,
    late: 0,
  });

  const fetchFieldAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false })
        .order("time", { ascending: true });

      if (error) throw error;

      const processedFieldData = {};
      (data || []).forEach((rec) => {
        const key = `${rec.person_name}_${rec.date}`;
        if (!processedFieldData[key]) {
          processedFieldData[key] = {
            type: "field",
            employee: rec.person_name,
            empCode: rec.employee_code || rec.person_name,
            date: rec.date,
            records: [],
            inTime: null,
            midEntries: [],
            outTime: null,
            location: rec.address,
            city: rec.address?.split(",").slice(-3, -2)[0]?.trim() || "Unknown",
            images: rec.images,
            mapLink: rec.map_link,
            lat: rec.latitude,
            lng: rec.longitude,
            status: "Partial",
          };
        }

        processedFieldData[key].records.push(rec);

        if (rec.status === "IN" && !processedFieldData[key].inTime) {
          processedFieldData[key].inTime = rec.time;
        }
        if (rec.status === "OUT") {
          processedFieldData[key].outTime = rec.time;
        }
        if (rec.status === "MID") {
          processedFieldData[key].midEntries.push(rec.time);
        }
        if (rec.images) processedFieldData[key].images = rec.images;
        if (rec.map_link) processedFieldData[key].mapLink = rec.map_link;
        if (rec.address) processedFieldData[key].location = rec.address;
      });

      // NEW FIELD STATUS LOGIC
      Object.values(processedFieldData).forEach((group) => {
        const hasIn = group.inTime !== null;
        const hasMid = group.midEntries.length > 0;
        const hasOut = group.outTime !== null;

        // Count how many entries are present
        const entryCount = [hasIn, hasMid, hasOut].filter(Boolean).length;

        if (hasIn && hasMid && hasOut) {
          group.status = "Present"; // All three present
        } else if (!hasIn && !hasMid && !hasOut) {
          group.status = "Absent"; // No entries at all
        } else if (entryCount === 2) {
          group.status = "Half Day"; // Exactly two entries (IN+MID or IN+OUT or MID+OUT)
        } else {
          group.status = "Partial"; // Only one entry
        }
      });

      setFieldRecords(Object.values(processedFieldData));
    } catch (error) {
      console.error("Error fetching field attendance:", error);
    }
  };


  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



const processBiometricAttendance = (data) => {
  if (!data) return [];
  const grouped = {};
  data.forEach(item => {
    if (!item.employee_id || !item.attendance_date) return;
    const key = `${item.employee_id}_${item.attendance_date}`;
    if (!grouped[key]) {
      grouped[key] = {
        item,
        inTimes: [],
        outTimes: [],
        records: []
      };
    }
    grouped[key].records.push(item);
    if (item.in_time) grouped[key].inTimes.push(item.in_time);
    if (item.out_time) grouped[key].outTimes.push(item.out_time);
  });

  return Object.values(grouped).map(({ item, inTimes, outTimes, records }) => {
    const allTimes = [];
    inTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });
    outTimes.forEach(t => { if (t && !allTimes.includes(t)) allTimes.push(t); });
    allTimes.sort((a, b) => a.localeCompare(b));

    let finalIn = null;
    let finalOut = null;

    if (allTimes.length === 1) {
      if (inTimes.length > 0) {
        finalIn = inTimes[0];
      } else if (outTimes.length > 0) {
        finalOut = outTimes[0];
      } else {
        finalIn = allTimes[0];
      }
    } else if (allTimes.length > 1) {
      finalIn = allTimes[0];
      finalOut = allTimes[allTimes.length - 1];
    }

    return {
      type: "biometric",
      employee: item.employee_name,
      empIdCode: item.employee_id,
      employeeId: item.employee_id,
      date: item.attendance_date,
      year: item.year?.toString(),
      monthName: item.month_name,
      day: item.day_name,
      inTime: finalIn,
      outTime: finalOut,
      location: "Head Office",
      records: records,
      status: finalIn && finalOut
        ? "Present"
        : finalIn || finalOut
          ? "Half Day"
          : "Absent",
      workingHour: item.working_hour,
      lateCalculation: item.late_calculation,
      lateCountsMorning: item.late_counts_morning,
      lateCountsEvening: item.late_counts_evening,
    };
  });
};

  // Fetch users for stats
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("employee_id, user_name, sales_person_name, admin");

      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Existing fetch functions
const fetchUniqueMonths = async () => {
  try {
    const { data, error } = await supabase
      .from("offline_biometric_punch")
      .select("attendance_date");
    if (error) throw error;
    const months = [
      ...new Set(
        data.map((item) =>
          new Date(item.attendance_date).toLocaleString("default", {
            month: "long",
          }),
        ),
      ),
    ];
    setUniqueMonths(months);
  } catch (error) {
    console.error("Error fetching unique months:", error);
  }
};




const fetchUniqueNames = async () => {
  try {
    const { data, error } = await supabase
      .from("offline_biometric_punch")
      .select("employee_name");
    if (error) throw error;
    const names = [
      ...new Set(data.map((item) => item.employee_name).filter(Boolean)),
    ];
    setUniqueNames(names);
  } catch (error) {
    console.error("Error fetching unique names:", error);
  }
};



const fetchAttendanceData = async (
  pageNum = 1,
  append = false,
  filters = {},
) => {
  if (pageNum === 1) setTableLoading(true);
  else setIsLoadingMore(true);
  setError(null);

  try {
    let query = supabase
      .from("offline_biometric_punch")
      .select("*")
      .order("attendance_date", { ascending: false })
      .range((pageNum - 1) * 500, pageNum * 500 - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Process biometric data with new logic
    let processedData = processBiometricAttendance(data);

    if (filters.year)
      processedData = processedData.filter(
        (item) => item.year === filters.year,
      );
    if (filters.month)
      processedData = processedData.filter(
        (item) => item.monthName === filters.month,
      );
    if (filters.name)
      processedData = processedData.filter((item) =>
        (item.employee || "")
          .toLowerCase()
          .includes(filters.name.toLowerCase()),
      );

    if (append) setAttendanceData((prev) => [...prev, ...processedData]);
    else setAttendanceData(processedData);

    setHasMore(data.length === 500);
    setPage(pageNum);
  } catch (error) {
    console.error("Error fetching data:", error);
    setError(error.message);
  } finally {
    setTableLoading(false);
    setIsLoadingMore(false);
  }
};

const fetchUniqueYears = async () => {
  try {
    const { data, error } = await supabase
      .from("offline_biometric_punch")
      .select("attendance_date");
    if (error) throw error;
    const years = [
      ...new Set(
        data.map((item) =>
          new Date(item.attendance_date).getFullYear().toString(),
        ),
      ),
    ];
    setUniqueYears(years);
  } catch (error) {
    console.error("Error fetching unique years:", error);
  }
};

  const filterByDate = useCallback((list) => {
    let result = [...list];
    if (showTodayData) {
      const todayDate = getTodayDate();
      result = result.filter((item) => item.date === todayDate);
    } else {
      if (startDate) {
        result = result.filter((item) => item.date >= startDate);
      }
      if (endDate) {
        result = result.filter((item) => item.date <= endDate);
      }
      if (selectedMonth) {
        result = result.filter((item) => {
          const itemMonth = new Date(item.date).toLocaleString("default", {
            month: "long",
          });
          return itemMonth === selectedMonth;
        });
      }
      if (selectedYear) {
        result = result.filter(
          (item) => new Date(item.date).getFullYear().toString() === selectedYear,
        );
      }
    }
    return result;
  }, [showTodayData, startDate, endDate, selectedMonth, selectedYear]);

  const calculateStats = useCallback(() => {
    const currentAttendanceData = filterByDate(attendanceData);
    const currentFieldRecords = filterByDate(fieldRecords);

    // Get unique employees from biometric data
    const uniqueBiometricEmployees = {};
    currentAttendanceData.forEach((d) => {
      const empKey = d.empIdCode || d.employee;
      if (empKey && !uniqueBiometricEmployees[empKey]) {
        uniqueBiometricEmployees[empKey] = d.employee;
      }
    });

    // Get unique employees from field data
    const uniqueFieldEmployees = {};
    currentFieldRecords.forEach((d) => {
      const empKey = d.empCode || d.employee;
      if (empKey && !uniqueFieldEmployees[empKey]) {
        uniqueFieldEmployees[empKey] = d.employee;
      }
    });

    // Biometric stats with new statuses
    const biometricPresent = currentAttendanceData.filter(
      (d) => d.status === "Present"
    ).length;
    const biometricAbsent = currentAttendanceData.filter(
      (d) => d.status === "Absent"
    ).length;
    const biometricLate = currentAttendanceData.filter(
      (d) => d.status === "Late"
    ).length;
    const biometricHalfDay = currentAttendanceData.filter(
      (d) => d.status === "Half Day"
    ).length;

    // Field stats with new statuses
    const fieldPresent = currentFieldRecords.filter(
      (d) => d.status === "Present"
    ).length;
    const fieldAbsent = currentFieldRecords.filter(
      (d) => d.status === "Absent"
    ).length;
    const fieldHalfDay = currentFieldRecords.filter(
      (d) => d.status === "Half Day"
    ).length;
    const fieldPartial = currentFieldRecords.filter(
      (d) => d.status === "Partial"
    ).length;

    setStats({
      totalBiometricEmployees: Object.keys(uniqueBiometricEmployees).length,
      totalFieldEmployees: Object.keys(uniqueFieldEmployees).length,
      biometricPresent,
      biometricAbsent,
      biometricLate,
      biometricHalfDay,
      fieldPresent,
      fieldAbsent,
      fieldHalfDay,
      fieldPartial,
      totalPresent: biometricPresent + fieldPresent,
      totalAbsent: biometricAbsent + fieldAbsent,
      totalLate: biometricLate,
      totalHalfDay: biometricHalfDay + fieldHalfDay,
    });
  }, [attendanceData, fieldRecords, filterByDate]);


  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Merge biometric and field data
  const mergedData = useMemo(() => {
    let biometric = filterByDate(attendanceData).map((d) => ({ ...d, type: "biometric" }));
    let field = filterByDate(fieldRecords).map((d) => ({ ...d, type: "field" }));

    if (attendanceType === "biometric") biometric = biometric;
    else if (attendanceType === "field") biometric = [];
    else if (attendanceType === "field") field = field;
    else if (attendanceType === "biometric") field = [];

    let merged = [...biometric, ...field];

    if (searchTerm) {
      merged = merged.filter(
        (item) =>
          item.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.empIdCode || "")
  .toLowerCase()
  .includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter.length > 0) {
      merged = merged.filter((item) => statusFilter.includes(item.status));
    }

    if (activeTab === "biometric") {
      merged = merged.filter((item) => item.type === "biometric");
    } else if (activeTab === "field") {
      merged = merged.filter((item) => item.type === "field");
    }

    return merged;
  }, [
    attendanceData,
    fieldRecords,
    searchTerm,
    statusFilter,
    activeTab,
    attendanceType,
    employeeIdMap,
    filterByDate,
  ]);




  const toggleRowExpand = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      scrollTop + clientHeight >= scrollHeight - 100 &&
      hasMore &&
      !isLoadingMore
    ) {
      fetchAttendanceData(page + 1, true, {
        year: selectedYear,
        month: selectedMonth,
        name: selectedName,
      });
    }
  };

  const handleTodayClick = () => {
    setShowTodayData(true);
    // Clear other date-related filters
    setStartDate("");
    setEndDate("");
    setSelectedMonth("");
    setSelectedYear("");
    setSearchTerm("");
    setStatusFilter([]);
    setAttendanceType("all");
    // Reset pagination if needed
    setPage(1);
  };



  const clearFilters = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedName("");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setAttendanceType("all");
    setStatusFilter([]);
    setActiveTab("all");
    setPage(1);
    setAttendanceData([]);
    fetchAttendanceData(1, false, { year: "", month: "", name: "" });
    setShowTodayData(false);
  };

  const downloadCSV = () => {
    if (mergedData.length === 0) return;

    const headers = [
      "Type",
      "Employee",
      "Date",
      "In Time",
      "Mid Time",
      "Out Time",
      "Duration",
      "Status",
      "Location",
    ];
    const csvData = mergedData.map((item) => [
      item.type === "biometric" ? "Biometric" : "Field",
      item.employee,
      item.date,
      item.inTime || "N/A",
      item.midEntries?.join(", ") || "N/A",
      item.outTime || "N/A",
      calculateDuration(item.inTime, item.outTime),
      item.status,
      item.location || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_data_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  // Initial data fetch
  useEffect(() => {
    fetchAttendanceData(1, false, {});
    fetchUniqueMonths();
    fetchUniqueYears();
    fetchUniqueNames();
    fetchFieldAttendance();
    fetchUsers();
    fetchEmployeeIds();
  }, []);


  const getStatsCards = () => {
    if (activeTab === "biometric") {
      return [
        {
          label: "Total Biometric Employees",
          icon: Users,
          gradient: "from-purple-500 to-purple-600",
          items: [
            { label: "Total", value: stats.totalBiometricEmployees, color: "purple" }
          ],
          total: stats.totalBiometricEmployees
        },
        {
          label: "Present Today",
          icon: UserCheck,
          gradient: "from-emerald-500 to-emerald-600",
          items: [
            { label: "Present", value: stats.biometricPresent, color: "emerald" }
          ],
          total: stats.biometricPresent
        },
        {
          label: "Absent Today",
          icon: UserMinus,
          gradient: "from-rose-500 to-rose-600",
          items: [
            { label: "Absent", value: stats.biometricAbsent, color: "rose" }
          ],
          total: stats.biometricAbsent
        },
        {
          label: "Late Arrival",
          icon: Clock,
          gradient: "from-amber-500 to-amber-600",
          items: [
            { label: "Late (9:45-12:30)", value: stats.biometricLate, color: "amber" }
          ],
          total: stats.biometricLate
        },
        {
          label: "Half Day",
          icon: ClockIcon,
          gradient: "from-purple-500 to-purple-600",
          items: [
            { label: "Half Day", value: stats.biometricHalfDay, color: "purple" }
          ],
          total: stats.biometricHalfDay
        }
      ];
    }
    else if (activeTab === "field") {
      return [
        {
          label: "Total Field Employees",
          icon: Users,
          gradient: "from-emerald-500 to-emerald-600",
          items: [
            { label: "Total", value: stats.totalFieldEmployees, color: "emerald" }
          ],
          total: stats.totalFieldEmployees
        },
        {
          label: "Present (IN+MID+OUT)",
          icon: UserCheck,
          gradient: "from-emerald-500 to-emerald-600",
          items: [
            { label: "Present", value: stats.fieldPresent, color: "emerald" }
          ],
          total: stats.fieldPresent
        },
        {
          label: "Absent",
          icon: UserMinus,
          gradient: "from-rose-500 to-rose-600",
          items: [
            { label: "Absent", value: stats.fieldAbsent, color: "rose" }
          ],
          total: stats.fieldAbsent
        },
        {
          label: "Half Day (2 Entries)",
          icon: ClockIcon,
          gradient: "from-purple-500 to-purple-600",
          items: [
            { label: "Half Day", value: stats.fieldHalfDay, color: "purple" }
          ],
          total: stats.fieldHalfDay
        },
        {
          label: "Partial (1 Entry)",
          icon: Clock,
          gradient: "from-orange-500 to-orange-600",
          items: [
            { label: "Partial", value: stats.fieldPartial, color: "orange" }
          ],
          total: stats.fieldPartial
        }
      ];
    }
    else {
      // All attendance tab
      return [
        {
          label: "Total Unique Employees",
          icon: Users,
          gradient: "from-indigo-500 to-indigo-600",
          items: [
            { label: "Biometric", value: stats.totalBiometricEmployees, color: "purple" },
            { label: "Field", value: stats.totalFieldEmployees, color: "emerald" }
          ],
          total: stats.totalBiometricEmployees + stats.totalFieldEmployees
        },
        {
          label: "Total Present",
          icon: UserCheck,
          gradient: "from-emerald-500 to-emerald-600",
          items: [
            { label: "Biometric", value: stats.biometricPresent, color: "purple" },
            { label: "Field", value: stats.fieldPresent, color: "emerald" }
          ],
          total: stats.totalPresent
        },
        {
          label: "Total Absent",
          icon: UserMinus,
          gradient: "from-rose-500 to-rose-600",
          items: [
            { label: "Biometric", value: stats.biometricAbsent, color: "purple" },
            { label: "Field", value: stats.fieldAbsent, color: "emerald" }
          ],
          total: stats.totalAbsent
        },
        {
          label: "Late/Half Day",
          icon: Clock,
          gradient: "from-amber-500 to-amber-600",
          items: [
            { label: "Late (Bio)", value: stats.biometricLate, color: "amber" },
            { label: "Half Day (Bio)", value: stats.biometricHalfDay, color: "purple" },
            { label: "Half Day (Field)", value: stats.fieldHalfDay, color: "emerald" }
          ],
          total: stats.totalLate + stats.totalHalfDay
        }
      ];
    }
  };

  const statsCards = getStatsCards();

  const getCardEmployeeList = (label) => {
    const currentAttendanceData = filterByDate(attendanceData);
    const currentFieldRecords = filterByDate(fieldRecords);

    switch (label) {
      // Biometric Cards
      case "Total Biometric Employees": {
        const uniqueBiometricEmployees = {};
        currentAttendanceData.forEach((d) => {
          const empKey = d.empIdCode || d.employee;
          if (empKey && !uniqueBiometricEmployees[empKey]) {
            uniqueBiometricEmployees[empKey] = {
              employee: d.employee,
              empIdCode: empKey,
              type: "biometric",
              status: "Registered",
              location: "Head Office"
            };
          }
        });
        return Object.values(uniqueBiometricEmployees);
      }
      case "Present Today":
      case "Total Present":
        return currentAttendanceData.filter((d) => d.status === "Present");
      case "Absent Today":
      case "Total Absent":
        return currentAttendanceData.filter((d) => d.status === "Absent");
      case "Late Arrival":
        return currentAttendanceData.filter((d) => d.status === "Late");
      case "Half Day":
        return currentAttendanceData.filter((d) => d.status === "Half Day");

      // Field Cards
      case "Total Field Employees": {
        const uniqueFieldEmployees = {};
        currentFieldRecords.forEach((d) => {
          const empKey = d.empCode || d.employee;
          if (empKey && !uniqueFieldEmployees[empKey]) {
            uniqueFieldEmployees[empKey] = {
              employee: d.employee,
              empIdCode: empKey,
              type: "field",
              status: "Registered",
              location: d.location || "Field"
            };
          }
        });
        return Object.values(uniqueFieldEmployees);
      }
      case "Present (IN+MID+OUT)":
        return currentFieldRecords.filter((d) => d.status === "Present");
      case "Absent":
        return currentFieldRecords.filter((d) => d.status === "Absent");
      case "Half Day (2 Entries)":
        return currentFieldRecords.filter((d) => d.status === "Half Day");
      case "Partial (1 Entry)":
        return currentFieldRecords.filter((d) => d.status === "Partial");

      // All Tab Cards
      case "Total Unique Employees": {
        const uniqueAll = {};
        currentAttendanceData.forEach((d) => {
          const empKey = d.empIdCode || d.employee;
          if (empKey && !uniqueAll[empKey]) {
            uniqueAll[empKey] = {
              employee: d.employee,
              empIdCode: empKey,
              type: "biometric",
              status: "Registered",
              location: "Head Office"
            };
          }
        });
        currentFieldRecords.forEach((d) => {
          const empKey = d.empCode || d.employee;
          if (empKey && !uniqueAll[empKey]) {
            uniqueAll[empKey] = {
              employee: d.employee,
              empIdCode: empKey,
              type: "field",
              status: "Registered",
              location: d.location || "Field"
            };
          }
        });
        return Object.values(uniqueAll);
      }
      case "Late/Half Day": {
        const bioLate = currentAttendanceData.filter((d) => d.status === "Late");
        const bioHalf = currentAttendanceData.filter((d) => d.status === "Half Day");
        const fieldHalf = currentFieldRecords.filter((d) => d.status === "Half Day");
        return [...bioLate, ...bioHalf, ...fieldHalf];
      }
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 ml-0 md:ml-50">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold  text-indigo-600 ">
                Attendance Records
              </h1>
            </div>

          </div>

          {/* Admin User Profile */}
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm">AD</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      </div>


      {/* Enhanced Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
            className="group relative bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-lg"
            onClick={() => setActiveModalCard(card.label)}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                {card.total !== undefined && (
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                    Total: {card.total}
                  </span>
                )}
              </div>

              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                  {card.label}
                </p>

                {/* Multiple values display */}
                <div className="space-y-2">
                  {card.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500`}></div>
                        <span className="text-xs text-gray-600">{item.label}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {item.value}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full w-full bg-gradient-to-r ${card.gradient} rounded-full`}
                  style={{ width: `${Math.min(100, (card.items[0]?.value / Math.max(1, card.total)) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>



      {/* Tabs with Enhanced Design */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 bg-white/50 backdrop-blur-sm rounded-t-xl p-1">
        {[
          {
            id: "all",
            label: "All Attendance",
            icon: Database,
            color: "from-cyan-500 to-blue-500",
          },
          {
            id: "biometric",
            label: "Biometric",
            icon: Fingerprint,
            color: "from-purple-500 to-pink-500",
          },
          {
            id: "field",
            label: "Field Staff",
            icon: Smartphone,
            color: "from-emerald-500 to-teal-500",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all rounded-xl ${activeTab === tab.id
              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 mb-6 backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3" /> Search Employee
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type name or ID..."
                className="w-full py-2.5 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-36">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Status
            </label>
            <select
              className="w-full py-2.5 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
              value={statusFilter[0] || ""}
              onChange={(e) =>
                setStatusFilter(e.target.value ? [e.target.value] : [])
              }
            >
              <option value="">All</option>
              <option value="Present">Present</option>
              <option value="Partial">Partial</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="w-40">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> From Date
            </label>
            <input
              type="date"
              className={`w-full py-2 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 ${showTodayData ? "opacity-50 cursor-not-allowed" : ""}`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={showTodayData}
            />
          </div>

          <div className="w-40">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> To Date
            </label>
            <input
              type="date"
              className={`w-full py-2 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 ${showTodayData ? "opacity-50 cursor-not-allowed" : ""}`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={showTodayData}
            />
          </div>

          <button
            onClick={() => setShowTodayData(!showTodayData)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md ${showTodayData
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg scale-105"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <Calendar className="w-4 h-4" />
            Today's Filter
          </button>

          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={downloadCSV}
            disabled={mergedData.length === 0}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-md ${mergedData.length === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800"
              }`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Biometric Present: {stats.biometricPresent}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Field Active: {stats.fieldActive}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span>Absent: {stats.absent}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Late: {stats.late}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Field Active ↑ 5%</span>
          </div>
        </div>
      </div>

      {/* Enhanced Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div
          className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
          onScroll={handleScroll}
        >
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-700 to-indigo-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  S.No.
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  Edit
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  IN Time
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  MID Time
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  OUT Time
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableLoading && mergedData.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 text-sm">
                        Loading attendance records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="13"
                    className="px-4 py-12 text-center text-red-500"
                  >
                    Error: {error}
                  </td>
                </tr>
              ) : mergedData.length > 0 ? (
                mergedData.map((item, idx) => (
                  <React.Fragment
                    key={`${item.type}_${item.employee}_${item.date}_${idx}`}
                  >
                    <tr className="hover:bg-indigo-50/50 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          checked={selectedEditItem && selectedEditItem.type === item.type && selectedEditItem.employee === item.employee && selectedEditItem.date === item.date}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleOpenEditModal(item);
                            } else {
                              handleCloseEditModal();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${item.type === "biometric"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                        >
                          {item.type === "biometric" ? (
                            <Fingerprint className="w-3 h-3" />
                          ) : (
                            <Smartphone className="w-3 h-3" />
                          )}
                          {item.type === "biometric" ? "Biometric" : "Field"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono font-semibold text-indigo-600">
                          {item.employeeId || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {item.employee}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {item.empIdCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-nowrap">
                        <div className="text-sm text-gray-700 font-medium">
                          {item.date}
                        </div>
                        <div className="text-xs text-gray-400">{item.day}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-green-50 rounded-md">
                            <Clock className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {item.inTime || "--:--"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.midEntries?.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Coffee className="w-3 h-3 text-amber-500" />
                            <span className="text-sm text-gray-600">
                              {item.midEntries.join(", ")}
                            </span>
                          </div>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-red-50 rounded-md">
                            <LogOut className="w-3 h-3 text-red-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {item.outTime || "--:--"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-semibold ${item.inTime && item.outTime
                            ? "text-emerald-600"
                            : "text-gray-400"
                            }`}
                        >
                          <Clock className="w-3 h-3" />
                          {calculateDuration(item.inTime, item.outTime)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span
                            className="text-xs text-gray-600 truncate max-w-[150px]"
                            title={item.location}
                          >
                            {item.location || "Head Office"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.type === "field" && (
                          <button
                            onClick={() => toggleRowExpand(idx)}
                            className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors group"
                          >
                            {expandedRows[idx] ? (
                              <ChevronDown className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Enhanced Expanded Row for Field Attendance */}
                    {expandedRows[idx] && item.type === "field" && (
                      <tr className="bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/50">
                        <td colSpan="13" className="px-4 py-5">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-indigo-200">
                              <Map className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-base font-bold text-indigo-800">
                                Field Visit Details
                              </h4>
                              <span className="text-xs text-gray-500 ml-auto">
                                {item.date}
                              </span>
                            </div>

                            {/* Timeline with Enhanced Design */}
                            <div className="relative">
                              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-red-500 rounded-full" />

                              <div className="space-y-4">
                                {item.records?.map((rec, recIdx) => (
                                  <div key={recIdx} className="relative pl-12">
                                    <div
                                      className={`absolute left-0 top-1.5 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${rec.status === "IN"
                                        ? "bg-green-100 border-2 border-green-500"
                                        : rec.status === "OUT"
                                          ? "bg-red-100 border-2 border-red-500"
                                          : "bg-yellow-100 border-2 border-yellow-500"
                                        }`}
                                    >
                                      {rec.status === "IN" ? (
                                        <LogOut className="w-4 h-4 text-green-600 rotate-180" />
                                      ) : rec.status === "OUT" ? (
                                        <LogOut className="w-4 h-4 text-red-600" />
                                      ) : (
                                        <Coffee className="w-4 h-4 text-yellow-600" />
                                      )}
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                      <div className="flex items-center justify-between mb-3">
                                        <span
                                          className={`px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${rec.status === "IN"
                                            ? "bg-green-600"
                                            : rec.status === "OUT"
                                              ? "bg-red-600"
                                              : "bg-yellow-600"
                                            }`}
                                        >
                                          {rec.status}
                                        </span>
                                        <span className="text-lg font-bold text-gray-700">
                                          {rec.time}
                                        </span>
                                      </div>

                                      {rec.address && (
                                        <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                                          <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-sm text-gray-700">
                                            {rec.address}
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-4">
                                        {rec.images && (
                                          <div className="group relative">
                                            <img
                                              src={rec.images}
                                              alt="Attendance"
                                              className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                            />
                                            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <Eye className="w-5 h-5 text-white" />
                                            </div>
                                          </div>
                                        )}

                                        {rec.images && (
                                          <a
                                            href={rec.images}
                                            target="_blank"
                                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg"
                                          >
                                            <ImageIcon className="w-3.5 h-3.5" />{" "}
                                            View Image
                                          </a>
                                        )}

                                        {rec.map_link && (
                                          <a
                                            href={rec.map_link}
                                            target="_blank"
                                            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />{" "}
                                            View Map
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">
                        No attendance records found for the selected filters.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="text-indigo-600 text-sm hover:underline mt-2"
                      >
                        Clear filters to see all records
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isLoadingMore && (
            <div className="py-6 text-center bg-white/80 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">
                  Loading more records...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <p>
          Showing {mergedData.length} records • Last updated:{" "}
          {new Date().toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          {activeTab === "all" && (
            <>
              <span className="px-2 py-1 bg-gray-100 rounded-lg">
                Biometric: {stats.biometricPresent}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded-lg">
                Field: {stats.fieldPresent}
              </span>
            </>
          )}
          {activeTab === "biometric" && (
            <span className="px-2 py-1 bg-gray-100 rounded-lg">
              Biometric Present: {stats.biometricPresent}
            </span>
          )}
          {activeTab === "field" && (
            <span className="px-2 py-1 bg-gray-100 rounded-lg">
              Field Present: {stats.fieldPresent}
            </span>
          )}
          <span className="px-2 py-1 bg-gray-100 rounded-lg">
            Total: {mergedData.length}
          </span>
        </div>
      </div>

      {/* STATS DETAILS MODAL */}
      <AnimatePresence>
        {activeModalCard && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setActiveModalCard(null);
              setModalSearch("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-200" />
                    {activeModalCard}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    Showing list of matching records ({getCardEmployeeList(activeModalCard).length} items)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveModalCard(null);
                    setModalSearch("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search Bar */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ID in this list..."
                    className="w-full py-2 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch("")}
                    className="text-xs text-gray-500 hover:text-indigo-600 font-semibold"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {/* Modal Body - Table */}
              <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Employee Name</th>
                      <th className="pb-3 px-4">Type</th>
                      {activeModalCard !== "Total Unique Employees" && (
                        <>
                          <th className="pb-3 px-4">Date</th>
                          <th className="pb-3 px-4">IN Time</th>
                          <th className="pb-3 px-4">OUT Time</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4">Location</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getCardEmployeeList(activeModalCard)
                      .filter((emp) => {
                        if (!modalSearch) return true;
                        const term = modalSearch.toLowerCase();
                        return (
                          emp.employee?.toLowerCase().includes(term) ||
                          emp.empIdCode?.toLowerCase().includes(term) ||
                          emp.empCode?.toLowerCase().includes(term)
                        );
                      })
                      .map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 pr-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{emp.employee}</div>
                              <div className="text-xs text-gray-500 font-mono">{emp.empIdCode || emp.empCode || "N/A"}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${emp.type === "biometric"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                              {emp.type === "biometric" ? "Biometric" : "Field"}
                            </span>
                          </td>
                          {activeModalCard !== "Total Unique Employees" && (
                            <>
                              <td className="py-3 px-4 text-sm text-gray-600">{emp.date || "N/A"}</td>
                              <td className="py-3 px-4 text-sm text-gray-600 font-medium">{emp.inTime || "--:--"}</td>
                              <td className="py-3 px-4 text-sm text-gray-600 font-medium">{emp.outTime || "--:--"}</td>
                              <td className="py-3 px-4">{getStatusBadge(emp.status)}</td>
                              <td className="py-3 pl-4 text-xs text-gray-500 max-w-[150px] truncate" title={emp.location || "Head Office"}>
                                {emp.location || "Head Office"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    {getCardEmployeeList(activeModalCard).filter((emp) => {
                      if (!modalSearch) return true;
                      const term = modalSearch.toLowerCase();
                      return (
                        emp.employee?.toLowerCase().includes(term) ||
                        emp.empIdCode?.toLowerCase().includes(term) ||
                        emp.empCode?.toLowerCase().includes(term)
                      );
                    }).length === 0 && (
                        <tr>
                          <td colSpan={activeModalCard !== "Total Unique Employees" ? "7" : "2"} className="py-12 text-center text-gray-400 text-sm">
                            No matching records found.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {getCardEmployeeList(activeModalCard).filter((emp) => {
                    if (!modalSearch) return true;
                    const term = modalSearch.toLowerCase();
                    return (
                      emp.employee?.toLowerCase().includes(term) ||
                      emp.empIdCode?.toLowerCase().includes(term) ||
                      emp.empCode?.toLowerCase().includes(term)
                    );
                  }).length} records
                </span>
                <button
                  onClick={() => {
                    setActiveModalCard(null);
                    setModalSearch("");
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DAILY ATTENDANCE MODAL */}
      <AnimatePresence>
        {selectedEditItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseEditModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Edit Daily Attendance
                  </h3>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    {selectedEditItem.employee} ({selectedEditItem.type === "biometric" ? "Biometric" : "Field"})
                  </p>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                {/* Updated Date + Time (Autofill) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Updated Date & Time
                  </label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toLocaleString()}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Updated By Username (Autofill) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Updated By (Username)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))?.username || "Admin" : "Admin"}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Time Fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      IN Time
                    </label>
                    <input
                      type="time"
                      step="1"
                      value={editInTime}
                      onChange={(e) => setEditInTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      MID Time
                    </label>
                    <input
                      type="time"
                      step="1"
                      disabled={selectedEditItem.type === "biometric"}
                      value={editMidTime}
                      onChange={(e) => setEditMidTime(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        selectedEditItem.type === "biometric" ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""
                      }`}
                      title={selectedEditItem.type === "biometric" ? "Mid time is not supported for Biometric records" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      OUT Time
                    </label>
                    <input
                      type="time"
                      step="1"
                      value={editOutTime}
                      onChange={(e) => setEditOutTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Remark (Required) */}
                <div>
                  <label className="block text-xs font-semibold text-red-500 mb-1">
                    Remark *
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Enter Remark/Reason for change (Required)"
                    value={editRemark}
                    onChange={(e) => setEditRemark(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-red-300"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAttendanceEdit}
                  disabled={isSavingEdit || !editRemark.trim()}
                  className={`px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors hover:bg-indigo-700 flex items-center gap-1.5 ${
                    isSavingEdit || !editRemark.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Attendancedaily;
